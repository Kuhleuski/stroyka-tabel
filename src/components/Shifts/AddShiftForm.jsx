import React, { useState, useEffect, useRef } from 'react'
import { Lock, CalendarPlus, ChevronDown } from 'lucide-react'
import { saveShift, findShiftsForSiteAndDate } from '../../services/supabase'
import { formatDateLocal } from '../../utils/dateHelpers'
import { useAuth } from '../../context/AuthContext'
import styles from '../../styles/shifts.module.css'

export const AddShiftForm = ({ 
  selectedDate, 
  onClose, 
  onSuccess, 
  sites, 
  workers,
  shifts = [],
  initialSiteId = null,
  initialWorkerIds = [],
  isEditMode = false
}) => {
  const { user } = useAuth()
  const [selectedSite, setSelectedSite] = useState(initialSiteId)
  const [selectedWorkers, setSelectedWorkers] = useState(initialWorkerIds)
  const [loading, setLoading] = useState(false)
  
  const [showAllSites, setShowAllSites] = useState(false)
  const [showAllWorkers, setShowAllWorkers] = useState(false)
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [existingShifts, setExistingShifts] = useState([])
  const [pendingSaveData, setPendingSaveData] = useState(null)
  
  const prevSiteIdRef = useRef(initialSiteId)
  const prevWorkerIdsRef = useRef(initialWorkerIds)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (initialSiteId !== prevSiteIdRef.current) {
      prevSiteIdRef.current = initialSiteId
      setSelectedSite(initialSiteId)
    }

    const workerIdsChanged = 
      initialWorkerIds.length !== prevWorkerIdsRef.current.length ||
      initialWorkerIds.some((id, index) => id !== prevWorkerIdsRef.current[index])
    
    if (workerIdsChanged) {
      prevWorkerIdsRef.current = [...initialWorkerIds]
      setSelectedWorkers(initialWorkerIds)
    }
  }, [initialSiteId, initialWorkerIds])

  // Объекты - фильтруем по статусу (русские значения)
  const getFilteredSites = () => {
    if (showAllSites) return sites
    
    // Проверяем, есть ли у объектов поле status
    const hasStatus = sites.some(s => s.status !== undefined && s.status !== null)
    
    // Если статуса нет — показываем все
    if (!hasStatus) return sites
    
    // Показываем только объекты со статусом 'в работе'
    return sites.filter(site => site.status === 'в работе')
  }

  // Ранжирование объектов по дате последней смены
  const getSortedSites = () => {
    const filtered = getFilteredSites()
    return [...filtered].sort((a, b) => {
      const aShifts = shifts.filter(s => s.site_id === a.id)
      const bShifts = shifts.filter(s => s.site_id === b.id)
      
      const aLastDate = aShifts.length > 0 
        ? new Date(Math.max(...aShifts.map(s => new Date(s.work_date).getTime())))
        : new Date(0)
      const bLastDate = bShifts.length > 0 
        ? new Date(Math.max(...bShifts.map(s => new Date(s.work_date).getTime())))
        : new Date(0)
      
      return bLastDate.getTime() - aLastDate.getTime()
    })
  }

  // Работники - фильтруем по статусу
  const getFilteredWorkers = () => {
    if (showAllWorkers) return workers
    return workers.filter(worker => worker.status === 'active')
  }

  // Ранжирование работников: активные сверху по алфавиту, неактивные снизу по алфавиту
  const getSortedWorkers = () => {
    const filtered = getFilteredWorkers()
    return [...filtered].sort((a, b) => {
      const aActive = a.status === 'active'
      const bActive = b.status === 'active'
      
      if (aActive && !bActive) return -1
      if (!aActive && bActive) return 1
      
      const aFirstName = a.name.split(' ')[0] || a.name
      const bFirstName = b.name.split(' ')[0] || b.name
      return aFirstName.localeCompare(bFirstName)
    })
  }

  const filteredSites = getSortedSites()
  const filteredWorkers = getSortedWorkers()
  const totalVisible = filteredWorkers.length
  const allVisibleSelected = totalVisible > 0 && filteredWorkers.every(w => selectedWorkers.includes(w.id))

  const handleWorkerToggle = (workerId) => {
    setSelectedWorkers(prev =>
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    )
  }

  const handleSelectAll = () => {
    const currentVisibleWorkers = filteredWorkers.map(w => w.id)
    const allVisibleSelected = currentVisibleWorkers.every(id => selectedWorkers.includes(id))
    
    if (allVisibleSelected) {
      setSelectedWorkers(prev => prev.filter(id => !currentVisibleWorkers.includes(id)))
    } else {
      const newSelection = [...selectedWorkers]
      currentVisibleWorkers.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id)
        }
      })
      setSelectedWorkers(newSelection)
    }
  }

  const handleSiteSelect = (siteId) => {
    if (isEditMode) return
    setSelectedSite(prev => prev === siteId ? null : siteId)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedSite) {
      alert('Выберите объект')
      return
    }
    if (selectedWorkers.length === 0) {
      alert('Выберите хотя бы одного работника')
      return
    }

    const localDate = formatDateLocal(selectedDate)
    
    try {
      const existing = await findShiftsForSiteAndDate(selectedSite, localDate)
      
      if (existing && existing.length > 0) {
        setExistingShifts(existing)
        setPendingSaveData({ siteId: selectedSite, workDate: localDate, workerIds: selectedWorkers })
        setShowConfirmDialog(true)
      } else {
        await performSave(selectedSite, localDate, selectedWorkers)
      }
    } catch (error) {
      console.error('❌ Ошибка проверки смены:', error)
      alert('Не удалось проверить существующую смену')
    }
  }

  const performSave = async (siteId, workDate, workerIds) => {
    setLoading(true)
    try {
      await saveShift(siteId, workDate, workerIds, user?.id)
      onSuccess()
    } catch (error) {
      console.error('❌ Ошибка сохранения:', error)
      alert('Не удалось сохранить смену: ' + error.message)
      setLoading(false)
    }
  }

  const handleConfirmOverwrite = async () => {
    setShowConfirmDialog(false)
    if (pendingSaveData) {
      await performSave(pendingSaveData.siteId, pendingSaveData.workDate, pendingSaveData.workerIds)
    }
  }

  const handleCancelOverwrite = () => {
    setShowConfirmDialog(false)
    setExistingShifts([])
    setPendingSaveData(null)
  }

  const formatDateFull = (date) => {
    if (!date) return ''
    const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${days[date.getDay()]}`
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const firstName = name.split(' ')[0] || name
    return firstName.charAt(0).toUpperCase()
  }

  const getAvatarColor = (name) => {
    const colors = ['#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#FDD835', '#FFB300', '#FB8C00', '#F4511E', '#6D4C41', '#78909C']
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
  }

  const isBase64Image = (str) => {
    return str && str.startsWith('data:image')
  }

  const getSiteName = (siteId) => {
    const site = sites.find(s => s.id === siteId)
    return site ? site.name : 'Неизвестный объект'
  }

  const getSiteColor = (siteId) => {
    const site = sites.find(s => s.id === siteId)
    return site ? site.color : '#2d7d46'
  }

  const getWorkerNames = (workerIds) => {
    return workerIds
      .map(id => {
        const worker = workers.find(w => w.id === id)
        return worker ? worker.name : null
      })
      .filter(name => name !== null)
  }

  // Диалог подтверждения
  if (showConfirmDialog) {
    const siteName = getSiteName(selectedSite)
    const siteColor = getSiteColor(selectedSite)
    const existingWorkerIds = existingShifts.map(s => s.worker_id)
    const existingWorkerNames = getWorkerNames(existingWorkerIds)
    const newWorkerNames = getWorkerNames(selectedWorkers)
    const dateDisplay = formatDateFull(selectedDate)

    return (
      <div className={styles.shiftFormScreen}>
        <div className={styles.confirmDialogBody}>
          <div className={styles.confirmDialogHeader}>
            <div className={styles.confirmDialogIcon}>!</div>
            <h3 className={styles.confirmDialogTitle}>Подтверждение перезаписи</h3>
          </div>

          <p className={styles.confirmDialogMessage}>
            Внимание, в этот день на объекте <strong>{siteName}</strong> ранее уже была поставлена смена.
          </p>

          <div className={styles.confirmDialogSection}>
            <div className={styles.confirmDialogLabel}>Существующая запись</div>
            <div className={styles.confirmDialogCard}>
              <div className={styles.confirmDialogDate}>{dateDisplay}</div>
              <div className={styles.confirmDialogSite}>
                <span className={styles.confirmDialogDot} style={{ background: siteColor }} />
                {siteName}
              </div>
              <div className={styles.confirmDialogWorkers}>
                {existingWorkerNames.join(', ')}
              </div>
            </div>
          </div>

          <div className={styles.confirmDialogDivider} />

          <p className={styles.confirmDialogQuestion}>
            Вы уверены, что хотите перезаписать данные?
          </p>

          <div className={styles.confirmDialogSection}>
            <div className={styles.confirmDialogLabel}>Новая запись</div>
            <div className={styles.confirmDialogCard}>
              <div className={styles.confirmDialogDate}>{dateDisplay}</div>
              <div className={styles.confirmDialogSite}>
                <span className={styles.confirmDialogDot} style={{ background: siteColor }} />
                {siteName}
              </div>
              <div className={styles.confirmDialogWorkers}>
                {newWorkerNames.join(', ')}
              </div>
            </div>
          </div>

          <div className={styles.confirmDialogActions}>
            <button 
              className={styles.confirmDialogCancel}
              onClick={handleCancelOverwrite}
            >
              Отмена
            </button>
            <button 
              className={styles.confirmDialogConfirm}
              onClick={handleConfirmOverwrite}
            >
              Перезаписать
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Основная форма
  return (
    <div className={styles.shiftFormScreen}>
      <div className={styles.shiftFormContent}>
        {/* Заголовок с иконкой слева */}
        <div className={styles.shiftFormHeaderLeft}>
          <div className={styles.shiftFormIconLeft}>
            <CalendarPlus size={70} strokeWidth={1.2} color="#888888" />
          </div>
          <div className={styles.shiftFormHeaderTextLeft}>
            <div className={styles.shiftFormTitleLeft}>
              {isEditMode ? 'Редактирование смены' : 'Новая смена'}
            </div>
            <div className={styles.shiftFormDateLeft}>
              {formatDateFull(selectedDate)}
            </div>
          </div>
        </div>

        <form id="shift-form" onSubmit={handleSubmit} className={styles.shiftFormBody}>
          {/* Заголовок над объектами */}
          <div className={styles.shiftFormSectionLabelLeft}>
            Выберите объект на котором работали:
          </div>

          {/* Плашка объектов */}
          <div className={styles.shiftFormBlock}>
            <div className={styles.shiftSitesGrid}>
              {filteredSites.length === 0 ? (
                <div className={styles.shiftFormEmpty}>
                  <p>Нет добавленных объектов</p>
                </div>
              ) : (
                filteredSites.map(site => {
                  const isSelected = selectedSite === site.id
                  const isDisabled = isEditMode && !isSelected
                  
                  return (
                    <div
                      key={site.id}
                      className={`${styles.shiftSiteChip} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`}
                      onClick={() => handleSiteSelect(site.id)}
                    >
                      <span 
                        className={styles.shiftSiteDot}
                        style={{ 
                          backgroundColor: site.color || '#2d7d46',
                          boxShadow: `0 0 12px ${site.color || '#2d7d46'}60`
                        }}
                      />
                      <span className={styles.shiftSiteName}>{site.name}</span>
                      {isSelected && (
                        <span className={styles.shiftCheckMark}>✓</span>
                      )}
                      {isEditMode && isSelected && (
                        <span className={styles.shiftLockIcon}>
                          <Lock size={14} />
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {sites.length > 0 && !showAllSites && (
              <button
                type="button"
                className={styles.filterTextBtn}
                onClick={() => setShowAllSites(true)}
              >
                Показать все объекты <ChevronDown size={16} />
              </button>
            )}
          </div>

          {/* Заголовок над работниками с кнопкой "Выбрать всех" */}
          <div className={styles.shiftFormSectionLabelWrapper}>
            <div className={styles.shiftFormSectionLabelLeft}>
              Выберите работников:
            </div>
            <button
              type="button"
              className={styles.selectAllBtn}
              onClick={handleSelectAll}
            >
              {allVisibleSelected ? 'Снять всех' : 'Выбрать всех'}
            </button>
          </div>

          {/* Плашка работников */}
          <div className={styles.shiftFormBlock}>
            <div className={styles.shiftWorkersGrid}>
              {filteredWorkers.length === 0 ? (
                <div className={styles.shiftFormEmpty}>
                  <p>Нет активных работников</p>
                </div>
              ) : (
                filteredWorkers.map(worker => {
                  const isSelected = selectedWorkers.includes(worker.id)
                  const hasPhoto = isBase64Image(worker.avatar)
                  const initials = getInitials(worker.name)
                  const avatarColor = getAvatarColor(worker.name)
                  const firstName = worker.name.split(' ')[0] || worker.name

                  return (
                    <div
                      key={worker.id}
                      className={`${styles.shiftWorkerChip} ${isSelected ? styles.selected : ''}`}
                      onClick={() => handleWorkerToggle(worker.id)}
                    >
                      <div 
                        className={styles.shiftWorkerAvatar}
                        style={{
                          backgroundColor: hasPhoto ? 'transparent' : avatarColor,
                        }}
                      >
                        {hasPhoto ? (
                          <img 
                            src={worker.avatar} 
                            alt={firstName}
                            className={styles.shiftWorkerAvatarImg}
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.parentNode.style.backgroundColor = avatarColor
                              e.target.parentNode.textContent = initials
                            }}
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <span className={styles.shiftWorkerName}>{firstName}</span>
                      {isSelected && (
                        <span className={styles.shiftCheckMark}>✓</span>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {workers.length > 0 && !showAllWorkers && (
              <button
                type="button"
                className={styles.filterTextBtn}
                onClick={() => setShowAllWorkers(true)}
              >
                Показать всех работников <ChevronDown size={16} />
              </button>
            )}
          </div>
          
          {/* Отступ снизу для фиксированных кнопок */}
          <div style={{ height: '20px' }} />
        </form>
      </div>

      {/* ФУТЕР С КНОПКАМИ — FIXED ВНИЗУ */}
      <div className={styles.shiftFormActionsFixed}>
        <button 
          type="button" 
          className={styles.shiftFormCancelBtn}
          onClick={onClose}
        >
          Отмена
        </button>
        <button 
          type="submit" 
          className={styles.shiftFormBottomBtn}
          disabled={loading}
          form="shift-form"
        >
          {loading ? 'Сохранение...' : (isEditMode ? 'Обновить смену' : 'Сохранить смену')}
        </button>
      </div>
    </div>
  )
}