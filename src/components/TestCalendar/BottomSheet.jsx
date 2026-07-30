import React, { useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDateLocal } from '../../utils/dateHelpers'
import styles from '../../styles/test.module.css'

export function BottomSheet({ 
  isOpen, 
  onClose, 
  selectedDate, 
  shifts, 
  sites, 
  workers 
}) {
  const dateStr = formatDateLocal(selectedDate)
  const prevDateStr = useRef(dateStr)
  const overlayRef = useRef(null)

  // Группируем смены по объектам
  const dayGroups = useMemo(() => {
    const dayShifts = shifts.filter(s => s.work_date === dateStr)
    
    if (dayShifts.length === 0) return []

    const groupsMap = {}
    dayShifts.forEach(shift => {
      if (!groupsMap[shift.site_id]) {
        groupsMap[shift.site_id] = {
          siteId: shift.site_id,
          workerIds: []
        }
      }
      groupsMap[shift.site_id].workerIds.push(shift.worker_id)
    })

    return Object.values(groupsMap).map(group => {
      const site = sites.find(s => s.id === group.siteId)
      
      const workerNames = group.workerIds
        .map(id => {
          const worker = workers.find(w => w.id === id)
          return worker ? worker.name : null
        })
        .filter(name => name !== null)

      return {
        siteId: group.siteId,
        siteName: site?.name || 'Неизвестный объект',
        address: site?.address || '',
        color: site?.color || '#999',
        workers: workerNames
      }
    })
  }, [dateStr, shifts, sites, workers])

  const formatDateDisplay = (date) => {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
    
    const dayName = days[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    
    return `${dayName}, ${day} ${month} ${year}`
  }

  // Закрытие по свайпу вниз
  const [startY, setStartY] = React.useState(0)
  const [offsetY, setOffsetY] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState(false)

  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    const deltaY = e.touches[0].clientY - startY
    if (deltaY > 0) {
      setOffsetY(Math.min(deltaY, 200))
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (offsetY > 80) {
      onClose()
    }
    setOffsetY(0)
    setStartY(0)
  }

  // Блокировка скролла фона
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Сохраняем предыдущую дату для анимации контента
  useEffect(() => {
    if (isOpen) {
      prevDateStr.current = dateStr
    }
  }, [dateStr, isOpen])

  // Определяем, изменилась ли дата (для анимации контента)
  const isDateChanged = prevDateStr.current !== dateStr && isOpen

  // Обработчик клика на оверлей через ref
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          className={styles.bottomSheetOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            className={styles.bottomSheet}
            initial={{ y: '100%' }}
            animate={{ 
              y: offsetY > 0 ? offsetY : 0,
              transition: { 
                type: 'spring', 
                damping: 30, 
                stiffness: 400,
                duration: 0.2
              }
            }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ 
              transform: offsetY > 0 ? `translateY(${offsetY}px)` : 'translateY(0)',
              transition: offsetY > 0 ? 'none' : 'transform 0.2s ease'
            }}
          >
            {/* Свайп-индикатор */}
            <div className={styles.sheetHandle}>
              <div className={styles.sheetHandleBar} />
            </div>

            {/* Заголовок */}
            <div className={styles.sheetHeader}>
              <div className={styles.sheetDate}>
                📅 {formatDateDisplay(selectedDate)}
              </div>
              <button 
                className={styles.sheetCloseBtn}
                onClick={onClose}
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>

            {/* Контент с анимацией при смене даты */}
            <div className={styles.sheetContent}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={dateStr}
                  initial={isDateChanged ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className={styles.sheetContentInner}
                >
                  {dayGroups.length === 0 ? (
                    <div className={styles.emptyState}>
                      <span>😴</span>
                      <span>В этот день никто не работал</span>
                    </div>
                  ) : (
                    dayGroups.map((group) => (
                      <div key={group.siteId} className={styles.sheetGroup}>
                        <div className={styles.sheetGroupHeader}>
                          <div 
                            className={styles.sheetColorDot}
                            style={{ background: group.color }}
                          />
                          <div className={styles.sheetSiteName}>{group.siteName}</div>
                        </div>
                        {group.address && (
                          <div className={styles.sheetAddress}>📍 {group.address}</div>
                        )}
                        <div className={styles.sheetWorkers}>
                          👷 {group.workers.join(', ')}
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}