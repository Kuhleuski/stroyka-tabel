export const MONTHS = [
   'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
   'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

export const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

/**
 * Единая функция форматирования даты в локальный формат YYYY-MM-DD
 * Используется ВЕЗДЕ для:
 * - сохранения в БД
 * - сравнения дат
 * - отображения
 */
export const formatDateLocal = (date) => {
   if (!date) return ''
   const year = date.getFullYear()
   const month = String(date.getMonth() + 1).padStart(2, '0')
   const day = String(date.getDate()).padStart(2, '0')
   return `${year}-${month}-${day}`
}

export function isToday(date) {
   if (!date) return false
   const today = new Date()
   return formatDateLocal(date) === formatDateLocal(today)
}

export function getMonthDays(year, month) {
   const firstDay = new Date(year, month, 1)
   const daysInMonth = new Date(year, month + 1, 0).getDate()
   const startDayOfWeek = firstDay.getDay() || 7

   const days = []
   for (let i = 1; i < startDayOfWeek; i++) {
      days.push({ empty: true })
   }

   for (let i = 1; i <= daysInMonth; i++) {
      days.push({
         date: new Date(year, month, i),
         day: i,
         empty: false
      })
   }
   return days
}

export function getWeekDays(date) {
   const day = date.getDay() || 7
   const diff = date.getDate() - day + 1
   const startOfWeek = new Date(date.getFullYear(), date.getMonth(), diff)

   const days = []
   for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      days.push({
         date: d,
         day: d.getDate(),
         empty: false
      })
   }
   return days
}
