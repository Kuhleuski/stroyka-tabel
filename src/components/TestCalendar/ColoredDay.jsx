import React, { useMemo } from 'react'
import { formatDateLocal } from '../../utils/dateHelpers'
import styles from '../../styles/test.module.css'

export function ColoredDay({ date, shifts, sites, isActive }) {
  const dateStr = formatDateLocal(date)
  
  const dayShifts = shifts.filter(s => s.work_date === dateStr)
  
  if (dayShifts.length === 0) {
    return null
  }
  
  // Получаем уникальные site_id и их цвета (сохраняя порядок)
  const siteMap = []
  const seen = new Set()
  
  dayShifts.forEach(s => {
    if (!seen.has(s.site_id)) {
      seen.add(s.site_id)
      const site = sites.find(site => site.id === s.site_id)
      if (site) {
        siteMap.push({
          siteId: s.site_id,
          color: site.color,
          name: site.name
        })
      }
    }
  })
  
  const colors = siteMap.map(s => s.color).filter(c => c !== null && c !== undefined)
  const totalSites = colors.length
  
  if (totalSites === 0) {
    return null
  }

  // ⭐ ЕСЛИ ДЕНЬ ВЫБРАН — НЕ ПОКАЗЫВАЕМ ЗАЛИВКУ
  if (isActive) {
    return null
  }

  // ⭐ ФУНКЦИЯ ДЛЯ ПОСТРОЕНИЯ ЗАЛИВКИ
  const getBackground = () => {
    // 1 смена — один цвет
    if (totalSites === 1) {
      return colors[0]
    }
    
    // 2 смены — вертикальное деление
    if (totalSites === 2) {
      return `linear-gradient(to right, ${colors[0]} 50%, ${colors[1]} 50%)`
    }
    
    // 3 смены — как знак Мерседеса
    if (totalSites === 3) {
      return `conic-gradient(from 0deg at 50% 50%, 
        ${colors[0]} 0deg 120deg, 
        ${colors[1]} 120deg 240deg, 
        ${colors[2]} 240deg 360deg
      )`
    }
    
    // 4+ смен — сетка 2×2
    if (totalSites >= 4) {
      const c1 = colors[0] || '#666'
      const c2 = colors[1] || '#666'
      const c3 = colors[2] || '#666'
      const c4 = colors[3] || '#666'
      
      return `
        linear-gradient(to bottom, ${c1} 0% 50%, ${c3} 50% 100%),
        linear-gradient(to right, ${c1} 0% 50%, ${c2} 50% 100%),
        linear-gradient(to bottom, ${c2} 0% 50%, ${c4} 50% 100%)
      `
    }
    
    return colors[0] || '#666'
  }

  // Определяем фон в зависимости от количества смен
  let background = ''
  
  if (totalSites === 1) {
    background = colors[0]
  } else if (totalSites === 2) {
    background = `linear-gradient(to right, ${colors[0]} 50%, ${colors[1]} 50%)`
  } else if (totalSites === 3) {
    background = `conic-gradient(from 0deg at 50% 50%, 
      ${colors[0]} 0deg 120deg, 
      ${colors[1]} 120deg 240deg, 
      ${colors[2]} 240deg 360deg
    )`
  } else {
    // 4+ смен
    const c1 = colors[0] || '#666'
    const c2 = colors[1] || '#666'
    const c3 = colors[2] || '#666'
    const c4 = colors[3] || '#666'
    background = `
      linear-gradient(to bottom, ${c1} 0% 50%, ${c3} 50% 100%),
      linear-gradient(to right, ${c1} 0% 50%, ${c2} 50% 100%),
      linear-gradient(to bottom, ${c2} 0% 50%, ${c4} 50% 100%)
    `
  }

  const showPlus = totalSites > 4
  const plusCount = totalSites - 4

  return (
    <div className={styles.coloredDayContainer}>
      <div 
        className={`${styles.coloredDayCell}`}
        style={{ 
          background: background,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '8px',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      {showPlus && (
        <div className={styles.plusBadgeContainer}>
          <span className={styles.plusBadgeTextNew}>+{plusCount}</span>
        </div>
      )}
    </div>
  )
}