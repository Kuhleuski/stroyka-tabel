import React, { useMemo } from 'react'
import { formatDateLocal } from '../../utils/dateHelpers'
import styles from '../../styles/test.module.css'

export function DayDetails({ selectedDate, shifts, sites, workers }) {
  const dateStr = formatDateLocal(selectedDate)

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
      <div className={styles.dayDetailsDate}>
        {formatDateDisplay(selectedDate)}
      </div>

      <div className={styles.timeline}>
        {dayGroups.map((group, index) => (
          <div 
            key={group.siteId} 
            className={styles.timelineItem}
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            <div 
              className={styles.timelineDot}
              style={{ 
                background: group.color,
                boxShadow: `0 0 12px ${group.color}40, 0 0 24px ${group.color}20`
              }}
            />
            
            <div className={styles.timelineContent}>
              <div className={styles.objectLabel}>Объект</div>
              <div className={styles.siteName}>{group.siteName}</div>
              {group.address && (
                <div className={styles.siteAddress}>{group.address}</div>
              )}
              <div className={styles.workersLabel}>Работали на объекте:</div>
              <div className={styles.workers}>
                {group.workers.join(', ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
