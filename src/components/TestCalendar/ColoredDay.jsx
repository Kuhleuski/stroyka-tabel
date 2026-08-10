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
  const plusCount = totalSites > 4 ? totalSites - 3 : 0
  const showPlus = totalSites >= 5

  // Берем первые 3 цвета для 5+, или все для остальных
  let displayColors = []
  let displayPlus = 0
  
  if (totalSites >= 5) {
    displayColors = colors.slice(0, 3)
    displayPlus = totalSites - 3
  } else if (totalSites === 4) {
    displayColors = colors.slice(0, 4)
  } else {
    displayColors = colors
  }

  // Создаем сетку 2x2
  const grid = [
    [null, null],
    [null, null]
  ]

  // Заполняем сетку
  if (displayColors.length >= 1) grid[0][0] = { type: 'dot', color: displayColors[0] }
  if (displayColors.length >= 2) grid[0][1] = { type: 'dot', color: displayColors[1] }
  if (displayColors.length >= 3) grid[1][0] = { type: 'dot', color: displayColors[2] }
  
  // Четвертая позиция (нижний правый)
  if (displayColors.length === 4) {
    grid[1][1] = { type: 'dot', color: displayColors[3] }
  } else if (showPlus) {
    grid[1][1] = { type: 'plus', count: displayPlus }
  }

  // Для 1 смены - используем специальный контейнер с точкой по центру верхнего ряда
  if (totalSites === 1) {
    return (
      <div className={styles.coloredDayContainer}>
        <div className={styles.coloredDotRowSingle}>
          <div 
            className={styles.coloredDot}
            style={{ 
              backgroundColor: displayColors[0],
              boxShadow: `0 0 6px ${displayColors[0]}40, 0 0 12px ${displayColors[0]}20`
            }}
          />
        </div>
        <div className={styles.coloredDotRow}>
          <div className={styles.emptyCell} />
          <div className={styles.emptyCell} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.coloredDayContainer}>
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className={styles.coloredDotRow}>
          {row.map((cell, cellIndex) => {
            if (cell === null) {
              return <div key={`${rowIndex}-${cellIndex}`} className={styles.emptyCell} />
            }
            
            if (cell.type === 'dot') {
              return (
                <div 
                  key={`${rowIndex}-${cellIndex}`}
                  className={styles.coloredDot}
                  style={{ 
                    backgroundColor: cell.color,
                    boxShadow: `0 0 6px ${cell.color}40, 0 0 12px ${cell.color}20`
                  }}
                />
              )
            }
            
            if (cell.type === 'plus') {
              return (
                <span 
                  key={`${rowIndex}-${cellIndex}`} 
                  className={styles.plusBadgeText}
                >
                  +{cell.count}
                </span>
              )
            }
            
            return null
          })}
        </div>
      ))}
    </div>
  )
}