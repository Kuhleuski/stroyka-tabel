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
  const [direction, setDirection] = useState(null) // 'left' или 'right'
  
  // Для отображения названия месяца с анимацией
  const [displayMonth, setDisplayMonth] = useState(activeStartDate)
  const [monthTransition, setMonthTransition] = useState(false)

  // Обновляем displayMonth при изменении activeStartDate
  useEffect(() => {
    if (!isDragging) {
      setDisplayMonth(activeStartDate)
    }
  }, [activeStartDate, isDragging])

  // Получаем даты для 3 месяцев
  const getMonthDate = (delta) => {
    const newDate = new Date(activeStartDate)
    newDate.setMonth(newDate.getMonth() + delta)
    return newDate
  }

  // Переключение месяца с анимацией
  const changeMonth = (direction) => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setDirection(direction === 1 ? 'left' : 'right')
    
    const newDate = new Date(activeStartDate)
    newDate.setMonth(newDate.getMonth() + direction)
    setActiveStartDate(newDate)
    
    // Анимация названия месяца
    setMonthTransition(true)
    setTimeout(() => {
      setMonthTransition(false)
    }, 300)
    
    setTimeout(() => {
      setIsAnimating(false)
      setDirection(null)
    }, 350)
  }

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (isAnimating) return
      
      const deltaX = eventData.deltaX
      const absDeltaX = Math.abs(deltaX)
      
      if (absDeltaX > 10) {
        setIsDragging(true)
        setOffsetX(deltaX)
        
        if (deltaX < 0) {
          setDirection('left')
        } else if (deltaX > 0) {
          setDirection('right')
        }
      }
    },
    onSwiped: (eventData) => {
      if (isAnimating) return
      
      const deltaX = eventData.deltaX
      
      if (deltaX < -50) {
        changeMonth(1)
      } else if (deltaX > 50) {
        changeMonth(-1)
      } else {
        // Сброс если свайп был маленький
        setIsDragging(false)
        setOffsetX(0)
        setDirection(null)
      }
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
    const maxOffset = window.innerWidth * 0.7
    
    if (!isDragging && !isAnimating) {
      return {
        transform: 'translateX(0)',
        transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }
    }
    
    if (isAnimating) {
      // Анимация перехода
      const targetOffset = direction === 'left' ? -window.innerWidth : window.innerWidth
      return {
        transform: `translateX(${targetOffset}px)`,
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

  // Визуальный индикатор переключения
  const getMonthTitle = () => {
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    
    let month = monthNames[displayMonth.getMonth()]
    let year = displayMonth.getFullYear()
    
    let directionText = ''
    if (direction === 'left') directionText = ' →'
    if (direction === 'right') directionText = ' ←'
    
    return `${month} ${year}${directionText}`
  }

  return (
    <div className={styles.testPage}>
      <h1 className={styles.pageTitle}>🧪 Тест: Календарь со свайпом</h1>
      
      {/* Визуальный индикатор месяца */}
      <div className={styles.monthIndicator}>
        <span className={`${styles.monthText} ${monthTransition ? styles.monthTransition : ''}`}>
          {getMonthTitle()}
        </span>
        {isDragging && (
          <span className={styles.dragIndicator}>
            {offsetX < -20 ? '◀' : offsetX > 20 ? '▶' : ''}
          </span>
        )}
      </div>
      
      <div className={styles.calendarWrapper}>
        <div 
          className={styles.calendarContainer}
          {...handlers}
          style={getContainerStyle()}
        >
          {/* Предыдущий месяц */}
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

          {/* Текущий месяц */}
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

          {/* Следующий месяц */}
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
        <p>Направление: {direction || 'нет'}</p>
        <p>Анимация: {isAnimating ? 'Да' : 'Нет'}</p>
        <p>Дрэг: {isDragging ? 'Да' : 'Нет'}</p>
      </div>
    </div>
  )
}
