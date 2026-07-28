import React, { useMemo } from 'react'
import { formatDateLocal } from '../../utils/dateHelpers'
import styles from '../../styles/test.module.css'

export function DayDetails({ selectedDate, shifts, sites, workers }) {
  const dateStr = formatDateLocal(selectedDate)

  // Группируем смены по объектам
  const dayGroups = useMemo(() => {
    // Фильтруем смены за выбранную дату
    const dayShifts = shifts.filter(s => s.work_date === dateStr)
    
    if (dayShifts.length === 0) return []

    // Группируем по site_id
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

    // Добавляем данные объектов и работников
    return Object.values(groupsMap).map(group => {
      const site = sites.find(s => s.id === group.siteId)
      
      // Получаем имена работников
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

  // Форматируем дату для отображения
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

  // Если смен нет - показываем пустое состояние
  if (dayGroups.length === 0) {
    return (
      <div className={styles.dayDetails}>
        <div className={styles.dayDetailsDate}>
          {formatDateDisplay(selectedDate)}
        </div>
        <div className={styles.dayDetailsEmpty}>
          <span className={styles.emptyIcon}>😴</span>
          <span>В этот день никто не работал</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.dayDetails}>
      {/* Дата */}
      <div className={styles.dayDetailsDate}>
        {formatDateDisplay(selectedDate)}
      </div>

      {/* Таймлайн */}
      <div className={styles.timeline}>
        {dayGroups.map((group, index) => (
          <div 
            key={group.siteId} 
            className={styles.timelineItem}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Точка */}
            <div 
              className={styles.timelineDot}
              style={{ background: group.color }}
            />
            
            {/* Контент */}
            <div className={styles.timelineContent}>
              <div className={styles.siteName}>{group.siteName}</div>
              {group.address && (
                <div className={styles.siteAddress}>{group.address}</div>
              )}
              <div className={styles.workers}>
                👷 {group.workers.join(', ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
