import { formatDateLocal } from './dateHelpers'

/**
 * Получить цвета для дня на основе смен
 * @param {Date} date - Дата
 * @param {Array} shifts - Все смены
 * @param {Array} sites - Все объекты
 * @returns {Object} { colors: [], showPlus: boolean }
 */
export function getDayColors(date, shifts, sites) {
  const dateStr = formatDateLocal(date)
  
  // Находим все смены за этот день
  const dayShifts = shifts.filter(s => s.work_date === dateStr)
  
  if (dayShifts.length === 0) {
    return { colors: [], showPlus: false }
  }
  
  // Получаем уникальные site_id
  const siteIds = [...new Set(dayShifts.map(s => s.site_id))]
  
  // Маппим на цвета объектов
  const colors = siteIds
    .map(id => {
      const site = sites.find(s => s.id === id)
      return site ? site.color : null
    })
    .filter(c => c !== null)
  
  // Если цветов нет - возвращаем пустой массив
  if (colors.length === 0) {
    return { colors: [], showPlus: false }
  }
  
  // Если цветов больше 4 - берем первые 4 и показываем плюсик
  const showPlus = colors.length > 4
  const displayColors = showPlus ? colors.slice(0, 4) : colors
  
  return { colors: displayColors, showPlus }
}
