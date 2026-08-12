import React from 'react'
import { formatDateLocal } from '../../utils/dateHelpers'
import styles from '../../styles/test.module.css'

export function ColoredDay({ date, shifts, sites, isActive }) {
  const dateStr = formatDateLocal(date)
  
  const dayShifts = shifts.filter(s => s.work_date === dateStr)
  
  if (dayShifts.length === 0) {
    return null
  }
  
  // Получаем уникальные site_id и их цвета
  const siteMap = new Map()
  dayShifts.forEach(s => {
    if (!siteMap.has(s.site_id)) {
      const site = sites.find(site => site.id === s.site_id)
      if (site) {
        siteMap.set(s.site_id, site.color)
      }
    }
  })
  
  const colors = Array.from(siteMap.values()).filter(c => c !== null && c !== undefined)
  
  if (colors.length === 0) {
    return null
  }

  const totalSites = colors.length
  const plusCount = totalSites > 3 ? totalSites - 3 : 0
  const showPlus = totalSites > 3

  // Берем первые 3 цвета
  const displayColors = colors.slice(0, 3)
  
  const dotSize = 12
  const shift = 7

  // Если одна точка — центрируем её
  if (displayColors.length === 1) {
    return (
      <div className={styles.coloredDayContainer}>
        <div className={styles.coloredDotsRow}>
          <div
            className={styles.coloredDot}
            style={{
              backgroundColor: displayColors[0],
              position: 'absolute',
              left: '50%',
              top: '81%',
              transform: 'translate(-50%, -50%)',
              margin: 0,
              zIndex: 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
          />
        </div>
      </div>
    )
  }

  // Общая ширина группы
  const totalWidth = (displayColors.length - 1) * shift + dotSize
  const plusWidth = showPlus ? 18 : 0
  const groupWidth = totalWidth + plusWidth + 2

  return (
    <div className={styles.coloredDayContainer}>
      <div className={styles.coloredDotsRow}>
        {displayColors.map((color, index) => {
          const zIndex = index + 1
          const shiftX = index * shift
          const offsetX = shiftX - groupWidth / 2 + dotSize / 2
          return (
            <div
              key={index}
              className={styles.coloredDot}
              style={{
                backgroundColor: color,
                transform: `translateX(${offsetX}px)`,
                zIndex: zIndex,
                position: 'absolute',
                left: '50%',
                top: '78%',
                marginLeft: `-${dotSize/2}px`,
                marginTop: `-${dotSize/2}px`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }}
            />
          )
        })}
        {showPlus && (
          <span 
            className={styles.plusBadgeText}
            style={{
              position: 'absolute',
              left: '50%',
              top: '78%',
              transform: `translateX(${displayColors.length * shift - groupWidth / 2 + dotSize / 2 + 2}px) translateY(-50%)`,
            }}
          >
            +{plusCount}
          </span>
        )}
      </div>
    </div>
  )
}