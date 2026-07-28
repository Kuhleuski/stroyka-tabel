// src/pages/TestPage.jsx

import { useState, useRef, useEffect } from 'react'
import Calendar from 'react-calendar'
import { useSwipeable } from 'react-swipeable'
import 'react-calendar/dist/Calendar.css'
import styles from '../styles/test.module.css'

export default function TestPage() {
  const [date, setDate] = useState(new Date())
  const [activeStartDate, setActiveStartDate] = useState(new Date())
  
  // Для анимации
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [direction, setDirection] = useState(null)
  
  // Для fade анимации при переключении
  const [fadeState, setFadeState] = useState('visible') // 'visible' | 'fading' | 'hidden'
  
  const containerRef = useRef(null)

  // Переключение месяца с fade анимацией
  const changeMonth = (direction) => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setDirection(direction === 1 ? 'left' : 'right')
    
    // 1. Сначала затемняем
    setFadeState('fading')
    
    // 2. Меняем дату
    setTimeout(() => {
      const newDate = new Date(activeStartDate)
      newDate.setMonth(newDate.getMonth() + direction)
      setActiveStartDate(newDate)
      setFadeState('hidden')
      
      // 3. Показываем с анимацией
      setTimeout(() => {
        setFadeState('visible')
        setIsAnimating(false)
        setDirection(null)
      }, 150)
    }, 200)
  }

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (isAnimating) return
      
      const deltaX = eventData.deltaX
      const maxOffset = 100 // Максимум 100px смещения
      const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaX))
      
      setIsDragging(true)
      setOffsetX(clampedOffset)
      
      if (deltaX < -10) {
        setDirection('left')
      } else if (deltaX > 10) {
        setDirection('right')
      } else {
        setDirection(null)
      }
    },
    onSwiped: (eventData) => {
      if (isAnimating) return
      
      const deltaX = eventData.deltaX
      const threshold = 30 // 30px порог
      
      if (deltaX < -threshold) {
        changeMonth(1)
      } else if (deltaX > threshold) {
        changeMonth(-1)
      } else {
        setIsDragging(false)
        setOffsetX(0)
        setDirection(null)
      }
    },
    onTap: () => {
      if (!isAnimating) {
        setIsDragging(false)
        setOffsetX(0)
        setDirection(null)
      }
    },
    trackMouse: false,
    threshold: 5,
  })

  // Стили для контейнера
  const getContainerStyle = () => {
    if (isDragging) {
      return {
        transform: `translateX(${offsetX}px)`,
        transition: 'none',
      }
    }
    
    return {
      transform: 'translateX(0)',
      transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    }
  }

  // Стили для календаря (fade анимация)
  const getCalendarStyle = () => {
    if (fadeState === 'fading') {
      return {
        opacity: 0,
        transform: 'scale(0.95)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      }
    }
    
    if (fadeState === 'hidden') {
      return {
        opacity: 0,
        transform: 'scale(0.95)',
      }
    }
    
    return {
      opacity: 1,
      transform: 'scale(1)',
      transition: 'opacity 0.25s ease, transform 0.25s ease',
    }
  }

  // Получаем 3 месяца
  const getMonthDate = (delta) => {
    const newDate = new Date(activeStartDate)
    newDate.setMonth(newDate.getMonth() + delta)
    return newDate
  }

  const prevMonth = getMonthDate(-1)
  const currentMonth = getMonthDate(0)
  const nextMonth = getMonthDate(1)

  const formatMonth = (date) => {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  }

  const handlePrevClick = () => changeMonth(-1)
  const handleNextClick = () => changeMonth(1)

  return (
    <div className={styles.testPage}>
      <h1 className={styles.pageTitle}>🧪 Тест: Календарь со свайпом</h1>
      
      <div className={styles.calendarWrapper}>
        <div 
          ref={containerRef}
          className={styles.calendarContainer}
          {...handlers}
          style={getContainerStyle()}
        >
          {/* Предыдущий месяц (всегда скрыт) */}
          <div className={styles.calendarSlide} style={{ opacity: 0, pointerEvents: 'none' }}>
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

          {/* Текущий месяц (с анимацией) */}
          <div 
            className={styles.calendarSlide}
            style={getCalendarStyle()}
          >
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

          {/* Следующий месяц (всегда скрыт) */}
          <div className={styles.calendarSlide} style={{ opacity: 0, pointerEvents: 'none' }}>
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
        <p>Offset: {Math.round(offsetX)}px</p>
        <p>Dragging: {isDragging ? 'Да' : 'Нет'}</p>
        <p>Fade: {fadeState}</p>
        <p>Направление: {direction || 'нет'}</p>
      </div>
    </div>
  )
}
