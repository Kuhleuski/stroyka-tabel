// src/pages/TestPage.jsx

import { useState, useRef, useEffect } from 'react'
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
  const [direction, setDirection] = useState(null)
  const containerRef = useRef(null)

  // Получаем ширину контейнера
  const getContainerWidth = () => {
    if (containerRef.current) {
      return containerRef.current.offsetWidth / 3 // Ширина одного слайда
    }
    return window.innerWidth
  }

  // Переключение месяца с плавной анимацией
  const changeMonth = (direction) => {
    if (isAnimating) return
    
    setIsAnimating(true)
    const slideWidth = getContainerWidth()
    
    // Смещаем на полную ширину слайда
    const targetOffset = direction === 1 ? -slideWidth : slideWidth
    setOffsetX(targetOffset)
    setDirection(direction === 1 ? 'left' : 'right')
    
    // Ждем окончания анимации
    setTimeout(() => {
      const newDate = new Date(activeStartDate)
      newDate.setMonth(newDate.getMonth() + direction)
      setActiveStartDate(newDate)
      
      // Мгновенно сбрасываем позицию (без анимации)
      setOffsetX(0)
      setIsAnimating(false)
      setDirection(null)
    }, 350)
  }

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (isAnimating) return
      
      const deltaX = eventData.deltaX
      const slideWidth = getContainerWidth()
      
      // Ограничиваем смещение максимум 60% ширины слайда
      const maxOffset = slideWidth * 0.6
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
      const slideWidth = getContainerWidth()
      
      // Порог - 25% ширины слайда
      const threshold = slideWidth * 0.25
      
      if (deltaX < -threshold) {
        // Свайп влево
        changeMonth(1)
      } else if (deltaX > threshold) {
        // Свайп вправо
        changeMonth(-1)
      } else {
        // Возврат на место с анимацией
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
    threshold: 10,
  })

  // Стили для контейнера
  const getContainerStyle = () => {
    // Во время анимации переключения
    if (isAnimating) {
      return {
        transform: `translateX(${offsetX}px)`,
        transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }
    }
    
    // Во время драга
    if (isDragging) {
      return {
        transform: `translateX(${offsetX}px)`,
        transition: 'none',
      }
    }
    
    // В покое
    return {
      transform: 'translateX(0)',
      transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
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
              prevLabel={<span onClick={handlePrevClick}>‹</span>}
              nextLabel={<span onClick={handleNextClick}>›</span>}
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
        <p>Offset: {Math.round(offsetX)}px</p>
        <p>Dragging: {isDragging ? 'Да' : 'Нет'}</p>
        <p>Animating: {isAnimating ? 'Да' : 'Нет'}</p>
        <p>Направление: {direction || 'нет'}</p>
      </div>
    </div>
  )
}
