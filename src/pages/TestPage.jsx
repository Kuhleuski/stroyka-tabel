// src/pages/TestPage.jsx

import { useState, useRef } from 'react'
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
  const containerRef = useRef(null)

  // Получаем ширину экрана для анимации
  const getContainerWidth = () => {
    return window.innerWidth
  }

  // Переключение месяца с полной анимацией
  const changeMonth = (direction) => {
    if (isAnimating) return
    
    setIsAnimating(true)
    const containerWidth = getContainerWidth()
    
    // Сдвигаем в нужную сторону на полную ширину
    const targetOffset = direction === 1 ? -containerWidth : containerWidth
    setOffsetX(targetOffset)
    
    // Ждем окончания анимации
    setTimeout(() => {
      const newDate = new Date(activeStartDate)
      newDate.setMonth(newDate.getMonth() + direction)
      setActiveStartDate(newDate)
      
      // Сбрасываем позицию без анимации
      setOffsetX(0)
      setIsAnimating(false)
    }, 350)
  }

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (isAnimating) return
      
      const deltaX = eventData.deltaX
      const absDeltaX = Math.abs(deltaX)
      
      if (absDeltaX > 10) {
        setIsDragging(true)
        // Ограничиваем смещение, чтобы не уехать слишком далеко
        const maxOffset = getContainerWidth() * 0.6
        const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaX))
        setOffsetX(clampedOffset)
      }
    },
    onSwiped: (eventData) => {
      if (isAnimating) return
      
      const deltaX = eventData.deltaX
      const containerWidth = getContainerWidth()
      
      // Порог свайпа - 30% ширины экрана
      const threshold = containerWidth * 0.3
      
      if (deltaX < -threshold) {
        // Свайп влево
        changeMonth(1)
      } else if (deltaX > threshold) {
        // Свайп вправо
        changeMonth(-1)
      } else {
        // Свайп слишком короткий - возвращаем на место
        setIsDragging(false)
        setOffsetX(0)
      }
    },
    onTap: () => {
      if (!isAnimating) {
        setIsDragging(false)
        setOffsetX(0)
      }
    },
    trackMouse: false,
    threshold: 10,
  })

  // Вычисляем стили для анимации
  const getContainerStyle = () => {
    if (isAnimating) {
      return {
        transform: `translateX(${offsetX}px)`,
        transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }
    }
    
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

  // Кнопки навигации
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
        <p>Offset: {offsetX}px</p>
        <p>Dragging: {isDragging ? 'Да' : 'Нет'}</p>
        <p>Animating: {isAnimating ? 'Да' : 'Нет'}</p>
      </div>
    </div>
  )
}
