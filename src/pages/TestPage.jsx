// src/pages/TestPage.jsx

import { useState, useEffect } from 'react'
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
  const [isAnimating, setIsAnimating] = useState(false)

  // Получаем даты для 3 месяцев
  const getMonthDate = (delta) => {
    const newDate = new Date(activeStartDate)
    newDate.setMonth(newDate.getMonth() + delta)
    return newDate
  }

  // Переключение месяца
  const changeMonth = (direction) => {
    if (isAnimating) return
    
    setIsAnimating(true)
    const newDate = new Date(activeStartDate)
    newDate.setMonth(newDate.getMonth() + direction)
    setActiveStartDate(newDate)
    
    setTimeout(() => {
      setIsAnimating(false)
    }, 300)
  }

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (isAnimating) return
      
      const deltaX = eventData.deltaX
      const absDeltaX = Math.abs(deltaX)
      
      if (absDeltaX > 10) {
        setIsDragging(true)
        setOffsetX(deltaX)
      }
    },
    onSwiped: (eventData) => {
      if (isAnimating) return
      
      const deltaX = eventData.deltaX
      
      if (deltaX < -50) {
        // Свайп влево → следующий месяц
        changeMonth(1)
      } else if (deltaX > 50) {
        // Свайп вправо → предыдущий месяц
        changeMonth(-1)
      }
      
      // Сброс анимации
      setIsDragging(false)
      setOffsetX(0)
    },
    onTap: () => {
      setIsDragging(false)
      setOffsetX(0)
    },
    trackMouse: false,
    threshold: 10,
  })

  // Вычисляем стили для анимации
  const getContainerStyle = () => {
    const maxOffset = window.innerWidth * 0.7
    
    if (!isDragging) {
      return {
        transform: 'translateX(0)',
        transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }
    }
    
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, offsetX))
    return {
      transform: `translateX(${clampedOffset}px)`,
      transition: 'none',
    }
  }

  // Получаем 3 месяца
  const prevMonth = getMonthDate(-1)
  const currentMonth = getMonthDate(0)
  const nextMonth = getMonthDate(1)

  const formatMonth = (date) => {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  }

  // Обработчик кликов по кнопкам навигации
  const handlePrevClick = () => changeMonth(-1)
  const handleNextClick = () => changeMonth(1)

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
              prevLabel={<span onClick={handlePrevClick}>‹</span>}
              nextLabel={<span onClick={handleNextClick}>›</span>}
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
        <p>Dragging: {isDragging ? 'Да' : 'Нет'}</p>
      </div>
    </div>
  )
}
