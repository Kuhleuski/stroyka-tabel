import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDateLocal } from '../../utils/dateHelpers'
import { deleteShiftsForSiteAndDate } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'
import styles from '../../styles/test.module.css'

export function DayDetails({ 
  selectedDate, 
  shifts, 
  sites, 
  workers, 
  onShiftDeleted,
  onEditShift,
  archivedSites = [],     // ← НОВЫЙ ПРОП
  archivedWorkers = []    // ← НОВЫЙ ПРОП
}) {
  const { user } = useAuth()
  const dateStr = formatDateLocal(selectedDate)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [shiftToDelete, setShiftToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // === ОБЪЕДИНЯЕМ ВСЕ ОБЪЕКТЫ (активные + архивные) ===
  const allSites = useMemo(() => {
    return [...sites, ...archivedSites]
  }, [sites, archivedSites])

  // === ОБЪЕДИНЯЕМ ВСЕХ РАБОТНИКОВ (активные + архивные) ===
  const allWorkers = useMemo(() => {
    return [...workers, ...archivedWorkers]
  }, [workers, archivedWorkers])

  // === ПРОВЕРКА НА БУДУЩУЮ ДАТУ ===
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(selectedDate)
  checkDate.setHours(0, 0, 0, 0)
  const isFuture = checkDate > today

  const dayGroups = useMemo(() => {
    const dayShifts = shifts.filter(s => s.work_date === dateStr)
    if (dayShifts.length === 0) return []

    const groupsMap = {}
    dayShifts.forEach(shift => {
      if (!groupsMap[shift.site_id]) {
        groupsMap[shift.site_id] = { 
          siteId: shift.site_id, 
          workerIds: [],
          shiftIds: []
        }
      }
      groupsMap[shift.site_id].workerIds.push(shift.worker_id)
      groupsMap[shift.site_id].shiftIds.push(shift.id)
    })

    return Object.values(groupsMap).map(group => {
      // Ищем объект ВО ВСЕХ объектах (включая архивные)
      const site = allSites.find(s => s.id === group.siteId)
      // Ищем работников ВО ВСЕХ работниках (включая архивные)
      const workerData = group.workerIds
        .map(id => allWorkers.find(w => w.id === id))
        .filter(Boolean)

      return {
        siteId: group.siteId,
        siteName: site?.name || 'Неизвестный объект',
        color: site?.color || '#999',
        workers: workerData,
        shiftIds: group.shiftIds,
        uniqueKey: `${group.siteId}-${dateStr}`
      }
    })
  }, [dateStr, shifts, allSites, allWorkers])

  const formatDateDisplay = (date) => {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
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

  // === ОБРАБОТЧИК РЕДАКТИРОВАНИЯ ===
  const handleEditClick = (siteId) => {
    if (onEditShift) {
      const group = dayGroups.find(g => g.siteId === siteId)
      const workerIds = group ? group.workers.map(w => w.id) : []
      onEditShift(siteId, workerIds)
    }
  }

  // === ОБРАБОТЧИК УДАЛЕНИЯ ===
  const handleDeleteClick = (siteId, siteName) => {
    setShiftToDelete({ siteId, siteName })
    setShowConfirmDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!shiftToDelete) return
    
    setDeleting(true)
    setShowConfirmDialog(false)
    
    try {
      await deleteShiftsForSiteAndDate(
        shiftToDelete.siteId, 
        dateStr, 
        user?.id
      )
      
      if (onShiftDeleted) {
        await onShiftDeleted()
      }
    } catch (error) {
      console.error('❌ Ошибка удаления:', error)
      alert('Не удалось удалить смену: ' + error.message)
    } finally {
      setDeleting(false)
      setShiftToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setShowConfirmDialog(false)
    setShiftToDelete(null)
  }

  // === ДИАЛОГ ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ ===
  if (showConfirmDialog && shiftToDelete) {
    return (
      <div className={styles.deleteModalOverlay} onClick={handleCancelDelete}>
        <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.deleteModalTitle}>
            Подтверждение удаления
          </div>
          <div className={styles.deleteModalText}>
            Вы уверены, что хотите удалить смену на объекте <strong>{shiftToDelete.siteName}</strong>?
            <br />
            <span className={styles.deleteModalSubText}>Это действие нельзя отменить.</span>
          </div>
          <div className={styles.deleteModalActions}>
            <button 
              className={styles.deleteModalCancelBtn}
              onClick={handleCancelDelete}
              disabled={deleting}
            >
              Отмена
            </button>
            <button 
              className={styles.deleteModalConfirmBtn}
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Удаление...' : 'Удалить'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (dayGroups.length === 0) {
    return (
      <motion.div 
        className={styles.dayDetailsEmptyWrapper}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        key={dateStr}
      >
        <div className={styles.detailsEmpty}>
          {isFuture ? (
            <span>
              Дата еще не наступила.<br />
              Нельзя поставить смену
            </span>
          ) : (
            <span>В этот день никто не работал</span>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className={styles.dayDetailsWrapper}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      key={dateStr}
    >
      {dayGroups.map((group) => {
        return (
          <div key={group.uniqueKey} className={styles.dayDetailsCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div 
                  className={styles.detailsDot} 
                  style={{ 
                    background: group.color,
                    boxShadow: `0 0 20px ${group.color}60, 0 0 40px ${group.color}30`
                  }} 
                />
                <div className={styles.detailsSite}>{group.siteName}</div>
              </div>
              <div className={styles.cardActions}>
                {/* Иконка редактирования */}
                <button 
                  className={styles.cardActionBtn}
                  onClick={() => handleEditClick(group.siteId)}
                  aria-label="Редактировать смену"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
                    <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
                  </svg>
                </button>
                {/* Иконка удаления */}
                <button 
                  className={`${styles.cardActionBtn} ${styles.cardActionDelete}`}
                  onClick={() => handleDeleteClick(group.siteId, group.siteName)}
                  aria-label="Удалить смену"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.detailsDate}>
                {formatDateDisplay(selectedDate)}
              </div>
              <div className={styles.detailsChips}>
                {group.workers.map((worker, index) => {
                  const hasPhoto = isBase64Image(worker.avatar)
                  const initials = getInitials(worker.name)
                  const avatarColor = getAvatarColor(worker.name)
                  
                  return (
                    <div key={`${worker.id}-${index}-${dateStr}`} className={styles.detailsChip}>
                      <div 
                        className={styles.detailsAvatar}
                        style={{
                          backgroundColor: hasPhoto ? 'transparent' : avatarColor,
                        }}
                      >
                        {hasPhoto ? (
                          <img 
                            src={worker.avatar} 
                            alt={worker.name}
                            className={styles.detailsAvatarImg}
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
                      <span>{worker.name.split(' ')[0]}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </motion.div>
  )
}