import React from 'react'
import { formatDateLocal } from '../../utils/dateHelpers'
import styles from '../../styles/test.module.css'

export function ColoredDay({ date, shifts, sites }) {
  const dateStr = formatDateLocal(date)
  
  const dayShifts = shifts.filter(s => s.work_date === dateStr)
  
  if (dayShifts.length === 0) {
    return null
  }
  
  const siteIds = [...new Set(dayShifts.map(s => s.site_id))]
  
  const colors = siteIds
    .map(id => {
      const site = sites.find(s => s.id === id)
      return site ? site.color : null
    })
    .filter(c => c !== null)
  
  if (colors.length === 0) {
    return null
  }
  
  const showPlus = colors.length > 4
  const displayColors = showPlus ? colors.slice(0, 4) : colors
  const colorCount = displayColors.length
  
  let backgroundStyle = {}
  
  if (colorCount === 1) {
    backgroundStyle = { backgroundColor: displayColors[0] }
  } else if (colorCount === 2) {
    backgroundStyle = {
      background: `conic-gradient(from 0deg, ${displayColors[0]} 0deg, ${displayColors[0]} 180deg, ${displayColors[1]} 180deg, ${displayColors[1]} 360deg)`
    }
  } else if (colorCount === 3) {
    backgroundStyle = {
      background: `conic-gradient(from 0deg, ${displayColors[0]} 0deg, ${displayColors[0]} 120deg, ${displayColors[1]} 120deg, ${displayColors[1]} 240deg, ${displayColors[2]} 240deg, ${displayColors[2]} 360deg)`
    }
  } else if (colorCount === 4) {
    backgroundStyle = {
      background: `conic-gradient(from 0deg, ${displayColors[0]} 0deg, ${displayColors[0]} 90deg, ${displayColors[1]} 90deg, ${displayColors[1]} 180deg, ${displayColors[2]} 180deg, ${displayColors[2]} 270deg, ${displayColors[3]} 270deg, ${displayColors[3]} 360deg)`
    }
  }
  
  return (
    <div 
      className={styles.coloredDay}
      style={backgroundStyle}
    >
      {showPlus && (
        <div className={styles.dayPlus}>+</div>
      )}
    </div>
  )
}
