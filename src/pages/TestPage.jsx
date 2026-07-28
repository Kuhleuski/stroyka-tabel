import { useState } from 'react'
import Calendar from 'react-calendar'
import { useSwipeable } from 'react-swipeable'
import 'react-calendar/dist/Calendar.css'
import styles from '../styles/test.module.css'

export default function TestPage() {
  const [date, setDate] = useState(new Date())
  const [activeStartDate, setActiveStartDate] = useState(new Date())

  // === СВАЙП ===
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const newDate = new Date(activeStartDate)
      newDate.setMonth(newDate.getMonth() + 1)
      setActiveStartDate(newDate)
    },
    onSwipedRight: () => {
      const newDate = new Date(activeStartDate)
      newDate.setMonth(newDate.getMonth() - 1)
      setActiveStartDate(newDate)
    },
    trackMouse: false,
    threshold: 30,
  })

  // === ФОРМАТИРОВАНИЕ НАЗВАНИЯ МЕСЯЦА ===
  const formatMonth = (date) => {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  }

  return (
    <div className={styles.testPage}>
      <h1 className={styles.pageTitle}>🧪 Тест: Новый календарь</h1>
      
      <div className={styles.calendarWrapper} {...handlers}>
        <Calendar
          value={date}
          onChange={setDate}
          activeStartDate={activeStartDate}
          onActiveStartDateChange={({ activeStartDate: newDate }) => {
            setActiveStartDate(newDate)
          }}
          minDetail="month"
          maxDetail="month"
          navigationLabel={({ date }) => formatMonth(date)}
          prevLabel="‹"
          nextLabel="›"
          next2Label={null}
          prev2Label={null}
          showNeighboringMonth={false}
        />
      </div>

      {/* ДЛЯ ОТЛАДКИ */}
      <div className={styles.debugInfo}>
        <p>Выбрано: {date.toLocaleDateString('ru-RU')}</p>
        <p>Текущий месяц: {formatMonth(activeStartDate)}</p>
      </div>
    </div>
  )
}
