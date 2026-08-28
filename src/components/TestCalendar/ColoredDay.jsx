import React from 'react'
import { formatDateLocal } from '../../utils/dateHelpers'
import styles from '../../styles/test.module.css'

export function ColoredDay({ date, shifts, sites, archivedSites = [], isActive }) {
  const dateStr = formatDateLocal(date)
  
  // === ОБЪЕДИНЯЕМ ВСЕ ОБЪЕКТЫ (активные + архивные) ===
  const allSites = [...sites, ...archivedSites]

  // Находим все смены за эту дату
  const dayShifts = shifts.filter(s => s.work_date === dateStr)
  
  if (dayShifts.length === 0) return null

  // Группируем смены по объектам
  const siteColors = []
  const siteIds = new Set()

  dayShifts.forEach(shift => {
    if (!siteIds.has(shift.site_id)) {
      siteIds.add(shift.site_id)
      const site = allSites.find(s => s.id === shift.site_id)
      if (site && site.color) {
        siteColors.push(site.color)
      } else {
        // Если объект не найден — используем серый цвет
        siteColors.push('#666666')
      }
    }
  })

  // Ограничиваем количество цветов для отображения (максимум 4)
  const displayColors = siteColors.slice(0, 4)
  const extraCount = siteColors.length - 4

  // Функция для получения градиента
  const getBackground = () => {
    if (displayColors.length === 1) {
      return displayColors[0]
    } else if (displayColors.length === 2) {
      return `linear-gradient(to right, ${displayColors[0]} 50%, ${displayColors[1]} 50%)`
    } else if (displayColors.length === 3) {
      return `linear-gradient(to right, ${displayColors[0]} 33.33%, ${displayColors[1]} 33.33%, ${displayColors[1]} 66.66%, ${displayColors[2]} 66.66%)`
    } else if (displayColors.length === 4) {
      return `linear-gradient(to right, ${displayColors[0]} 25%, ${displayColors[1]} 25%, ${displayColors[1]} 50%, ${displayColors[2]} 50%, ${displayColors[2]} 75%, ${displayColors[3]} 75%)`
    }
    return 'transparent'
  }

  return (
    <div className={styles.coloredDayContainer}>
      <div 
        className={`${styles.coloredDayCell} ${isActive ? styles.activeCell : ''}`}
        style={{ background: getBackground() }}
      />
      {extraCount > 0 && (
        <div className={styles.plusBadgeContainer}>
          <span className={styles.plusBadgeTextNew}>+{extraCount}</span>
        </div>
      )}
    </div>
  )
}