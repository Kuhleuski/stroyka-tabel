import React, { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { saveShift, findShiftsForSiteAndDate } from '../../services/supabase'
import { formatDateLocal } from '../../utils/dateHelpers'
import styles from '../../styles/shifts.module.css'

export const AddShiftForm = ({ selectedDate, onClose, onSuccess, sites, workers }) => {
  const [selectedSite, setSelectedSite] = useState(null)
  const [selectedWorkers, setSelectedWorkers] = useState([])
  const [loading, setLoading] = useState(false)
  
  // === СОСТОЯНИЯ ДЛЯ ДИАЛОГА ПОДТВЕРЖДЕНИЯ ===
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [existingShifts, setExistingShifts] = useState([])
  const [pendingSaveData, setPendingSaveData] = useState(null)

  const handleWorkerToggle = (workerId) => {
    setSelectedWorkers(prev =>
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    )
  }

  const handleSelectAll = () => {
    if (selectedWorkers.length === workers.length) {
      setSelectedWorkers([])
    } else {
      setSelectedWorkers(workers.map(w => w.id))
    }
  }

  const handleSiteSelect = (siteId) => {
    setSelectedSite(prev => prev === siteId ? null : siteId)
  }

  // === ПРОВЕРКА СУЩЕСТВУЮЩЕЙ СМЕНЫ ПЕРЕД СОХРАНЕНИЕМ ===
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
    console.log('📅 Сохраняем смену на дату:', localDate)
    console.log('📍 Объект ID:', selectedSite)
    console.log('👷 Работники ID:', selectedWorkers)
    
    try {
      // Проверяем, есть ли уже смена на этот день и объект
      const existing = await findShiftsForSiteAndDate(selectedSite, localDate)
      
      if (existing && existing.length > 0) {
        // Если есть — показываем диалог подтверждения
        console.log('📊 Найдена существующая смена:', existing)
        setExistingShifts(existing)
        setPendingSaveData({ siteId: selectedSite, workDate: localDate, workerIds: selectedWorkers })
        setShowConfirmDialog(true)
      } else {
        // Если нет — сразу сохраняем
        await performSave(selectedSite, localDate, selectedWorkers)
      }
    } catch (error) {
      console.error('❌ Ошибка проверки смены:', error)
      alert('Не удалось проверить существующую смену')
    }
  }

  // === ВЫПОЛНЕНИЕ СОХРАНЕНИЯ ===
  const performSave = async (siteId, workDate, workerIds) => {
    setLoading(true)
    try {
      await saveShift(siteId, workDate, workerIds)
      onSuccess()
    } catch (error) {
      console.error('❌ Ошибка сохранения:', error)
      alert('Не удалось сохранить смену: ' + error.message)
      setLoading(false)
    }
  }

  // === ОБРАБОТЧИКИ ДИАЛОГА ===
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

  const formatDate = (date) => {
    if (!date) return ''
    const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  const getAvatarColor = (name) => {
    const colors = ['#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#FDD835', '#FFB300', '#FB8C00', '#F4511E', '#6D4C41', '#78909C']
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
  }

  const isBase64Image = (str) => {
    return str && str.startsWith('data:image')
  }

  // === ПОЛУЧЕНИЕ ДАННЫХ ОБЪЕКТА ДЛЯ ДИАЛОГА ===
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

  // === ДИАЛОГ ПОДТВЕРЖДЕНИЯ ===
  if (showConfirmDialog) {
    const siteName = getSiteName(selectedSite)
    const siteColor = getSiteColor(selectedSite)
    const existingWorkerIds = existingShifts.map(s => s.worker_id)
    const existingWorkerNames = getWorkerNames(existingWorkerIds)
    const newWorkerNames = getWorkerNames(selectedWorkers)
    const dateDisplay = formatDate(selectedDate)

    return (
      <div className={styles.shiftFormScreen}>
        <div className={styles.shiftFormHeader}>
          <button onClick={handleCancelOverwrite} className={styles.shiftFormBack}>
            <ArrowLeft size={24} />
            <span>Назад</span>
          </button>
          <span className={styles.shiftFormTitle} style={{ flex: 1, textAlign: 'center' }}>
            Подтверждение
          </span>
          <div style={{ width: '60px' }} />
        </div>

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
            <div className={styles.confirmDialogCardNew}>
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

  // === ОСНОВНАЯ ФОРМА ===
  return (
    <div className={styles.shiftFormScreen}>
      <div className={styles.shiftFormHeader}>
        <button onClick={onClose} className={styles.shiftFormBack}>
          <ArrowLeft size={24} />
          <span>Назад</span>
        </button>
        <span className={styles.shiftFormTitle} style={{ flex: 1, textAlign: 'center' }}>
          Новая смена на {formatDate(selectedDate)}
        </span>
        <div style={{ width: '60px' }} />
      </div>

      <form id="shift-form" onSubmit={handleSubmit} className={styles.shiftFormBody}>
        <div className={styles.shiftFormBlock}>
          <label className={styles.shiftFormLabel} style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            Выберите объект:
          </label>
          <div className={styles.shiftSitesGrid}>
            {sites.length === 0 ? (
              <div className={styles.shiftFormEmpty}>
                <p>Нет добавленных объектов</p>
                <span>Добавьте в разделе "Объекты"</span>
              </div>
            ) : (
              sites.map(site => {
                const isSelected = selectedSite === site.id
                return (
                  <div key={site.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <div
                      className={`${styles.shiftSiteCard} ${isSelected ? styles.selected : ''}`}
                      onClick={() => handleSiteSelect(site.id)}
                      style={{
                        backgroundColor: site.color || '#2d7d46',
                        borderColor: isSelected ? '#2d7d46' : 'transparent',
                        borderWidth: isSelected ? '3px' : '0px',
                        position: 'relative',
                        width: '100%'
                      }}
                    >
                      <span className={styles.shiftSiteName}>{site.name}</span>
                      {isSelected && (
                        <div className={styles.shiftSiteCheck}>✓</div>
                      )}
                    </div>
                    {site.address && (
                      <div className={styles.shiftSiteAddress}>{site.address}</div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className={styles.shiftFormBlock}>
          <div className={styles.shiftFormWorkersHeader} style={{ marginBottom: '12px' }}>
            <label className={styles.shiftFormLabel} style={{ fontSize: '16px', fontWeight: 600 }}>
              Кто работал:
            </label>
            {workers.length > 0 && (
              <button 
                type="button" 
                onClick={handleSelectAll}
                className={styles.shiftFormSelectAll}
              >
                {selectedWorkers.length === workers.length ? 'Снять всех' : 'Выбрать всех'}
              </button>
            )}
          </div>
          
          <div className={styles.shiftWorkersGrid}>
            {workers.length === 0 ? (
              <div className={styles.shiftFormEmpty}>
                <p>Нет добавленных работников</p>
                <span>Добавьте в разделе "Бригада"</span>
              </div>
            ) : (
              workers.map(worker => {
                const isSelected = selectedWorkers.includes(worker.id)
                const hasPhoto = isBase64Image(worker.avatar)
                const initials = getInitials(worker.name)
                const avatarColor = getAvatarColor(worker.name)

                return (
                  <div
                    key={worker.id}
                    className={`${styles.shiftWorkerCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleWorkerToggle(worker.id)}
                    style={{
                      borderColor: isSelected ? 'transparent' : 'transparent',
                    }}
                  >
                    <div className={styles.shiftWorkerAvatar} style={{
                      backgroundColor: hasPhoto ? 'transparent' : avatarColor,
                      border: hasPhoto ? '2px solid #e8eaed' : 'none',
                      overflow: 'hidden',
                      width: '56px',
                      height: '56px'
                    }}>
                      {hasPhoto ? (
                        <img 
                          src={worker.avatar} 
                          alt={worker.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '50%'
                          }}
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
                    <div className={styles.shiftWorkerName}>{worker.name}</div>
                    {isSelected && (
                      <div className={styles.shiftWorkerCheck}>✓</div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className={styles.shiftFormActions}>
          <button 
            type="submit" 
            className={styles.shiftFormBottomBtn}
            disabled={loading}
          >
            {loading ? '⏳ Сохранение...' : 'Сохранить смену'}
          </button>
          <button 
            type="button" 
            className={styles.shiftFormCancelBtn}
            onClick={onClose}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}