// src/pages/TestPage.jsx

import { useState } from 'react'
import Calendar from 'react-calendar'
import { useSwipeable } from 'react-swipeable'
import 'react-calendar/dist/Calendar.css'
import styles from '../styles/test.module.css'

export default function TestPage() {
  const [date, setDate] = useState(new Date())
  const [activeStartDate, setActiveStartDate] = useState(new Date())
  
  // Для drag-анимации
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [direction, setDirection] = useState(null) // 'left' или 'right'

  const formatMonth = (date) => {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  }

  // Получаем даты для соседних месяцев
  const getAdjacentMonth = (date, delta) => {
    const newDate = new Date(date)
    newDate.setMonth(newDate.getMonth() + delta)
    return newDate
  }

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      const deltaX = eventData.deltaX
      const absDeltaX = Math.abs(deltaX)
      
      if (absDeltaX > 20) {
        setIsDragging(true)
        setOffsetX(deltaX)
        
        if (deltaX < 0) {
          setDirection('left')
        } else {
          setDirection('right')
        }
      }
    },
    onSwiped: (eventData) => {
      const deltaX = eventData.deltaX
      
      if (Math.abs(deltaX) > 50) {
        // Свайп закончен - переключаем месяц
        if (deltaX < 0) {
          // Влево - следующий месяц
          const newDate = new Date(activeStartDate)
          newDate.setMonth(newDate.getMonth() + 1)
          setActiveStartDate(newDate)
        } else {
          // Вправо - предыдущий месяц
          const newDate = new Date(activeStartDate)
          newDate.setMonth(newDate.getMonth() - 1)
          setActiveStartDate(newDate)
        }
      }
      
      // Сброс анимации
      setIsDragging(false)
      setOffsetX(0)
      setDirection(null)
    },
    onTap: () => {
      setIsDragging(false)
      setOffsetX(0)
      setDirection(null)
    },
    trackMouse: false,
    threshold: 10,
  })

  // Вычисляем стили для анимации
  const getContainerStyle = () => {
    if (!isDragging) {
      return {
        transform: 'translateX(0)',
        transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }
    }
    
    return {
      transform: `translateX(${offsetX}px)`,
      transition: 'none',
    }
  }

  // Получаем месяцы для отображения
  const prevMonth = getAdjacentMonth(activeStartDate, -1)
  const currentMonth = activeStartDate
  const nextMonth = getAdjacentMonth(activeStartDate, 1)

  return (
    <div className={styles.testPage}>
      <h1 className={styles.pageTitle}>🧪 Тест: Календарь со свайпом</h1>
      
      <div className={styles.calendarWrapper}>
        {/* Контейнер с анимацией */}
        <div 
          className={styles.calendarContainer}
          {...handlers}
          style={getContainerStyle()}
        >
          {/* Предыдущий месяц (слева) */}
          <div className={styles.calendarSlide}>
            <Calendar
              value={date}
              onChange={setDate}
              activeStartDate={prevMonth}
              minDetail="month"
              maxDetail="month"
              navigationLabel={({ date }) => formatMonth(date)}
              prevLabel={null}
              nextLabel={null}
              next2Label={null}
              prev2Label={null}
              showNeighboringMonth={false}
            />
          </div>

          {/* Текущий месяц (центр) */}
          <div className={styles.calendarSlide}>
            <Calendar
              value={date}
              onChange={setDate}
              activeStartDate={currentMonth}
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

          {/* Следующий месяц (справа) */}
          <div className={styles.calendarSlide}>
            <Calendar
              value={date}
              onChange={setDate}
              activeStartDate={nextMonth}
              minDetail="month"
              maxDetail="month"
              navigationLabel={({ date }) => formatMonth(date)}
              prevLabel={null}
              nextLabel={null}
              next2Label={null}
              prev2Label={null}
              showNeighboringMonth={false}
            />
          </div>
        </div>
      </div>

      {/* Отладка */}
      <div className={styles.debugInfo}>
        <p>Текущий: {formatMonth(activeStartDate)}</p>
        <p>Offset: {offsetX}px</p>
        <p>Direction: {direction || 'нет'}</p>
      </div>
    </div>
  )
}
