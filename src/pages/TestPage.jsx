import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useShifts } from '../hooks/useShifts'
import { useSites } from '../hooks/useSites'
import { useWorkers } from '../hooks/useWorkers'
import { ColoredDay } from '../components/TestCalendar/ColoredDay'
import { DayDetails } from '../components/TestCalendar/DayDetails'
import styles from '../styles/test.module.css'

export default function TestPage() {
  const [date, setDate] = useState(new Date())
  const [activeStartDate, setActiveStartDate] = useState(new Date())
  const [direction, setDirection] = useState(0)
  
  const { shifts } = useShifts()
  const { sites } = useSites()
  const { workers } = useWorkers()

  const formatMonth = (date) => {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  }

  const changeMonth = (newDirection) => {
    setDirection(newDirection)
    const newDate = new Date(activeStartDate)
    newDate.setMonth(newDate.getMonth() + newDirection)
    setActiveStartDate(newDate)
  }

  const goToToday = () => {
    const today = new Date()
    setActiveStartDate(today)
    setDate(today)
    setDirection(0)
  }

  const handleDayClick = (value) => {
    setDate(value)
  }

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 200 : -200,
      opacity: 0,
      scale: 0.92,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 200 : -200,
      opacity: 0,
      scale: 0.92,
    }),
  }

  const tileContent = ({ date: tileDate, view }) => {
    if (view !== 'month') return null
    
    return (
      <ColoredDay 
        date={tileDate} 
        shifts={shifts} 
        sites={sites} 
      />
    )
  }

  // Проверяем, является ли текущий месяц активным
  const isCurrentMonth = () => {
    const today = new Date()
    return activeStartDate.getMonth() === today.getMonth() && 
           activeStartDate.getFullYear() === today.getFullYear()
  }

  return (
    <div className={styles.testPage}>
      <div className={styles.calendarWrapper}>
        {/* Кнопка "Сегодня" - показываем только если НЕ текущий месяц */}
        {!isCurrentMonth() && (
          <button 
            className={styles.todayButton}
            onClick={goToToday}
            aria-label="Перейти к сегодня"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            <span>Сегодня</span>
          </button>
        )}

        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={activeStartDate.getMonth() + '-' + activeStartDate.getFullYear()}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { 
                type: "spring", 
                stiffness: 500,
                damping: 35,
                mass: 0.5
              },
              opacity: { duration: 0.15 },
              scale: { duration: 0.15 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            dragMomentum={false}
            onDragEnd={(event, info) => {
              const threshold = 30
              if (info.offset.x < -threshold) {
                changeMonth(1)
              } else if (info.offset.x > threshold) {
                changeMonth(-1)
              }
            }}
            className={styles.calendarMotion}
          >
            <Calendar
              value={date}
              onChange={handleDayClick}
              activeStartDate={activeStartDate}
              minDetail="month"
              maxDetail="month"
              navigationLabel={({ date }) => formatMonth(date)}
              prevLabel={null}
              nextLabel={null}
              next2Label={null}
              prev2Label={null}
              showNeighboringMonth={false}
              tileContent={tileContent}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Детали дня */}
      <DayDetails 
        selectedDate={date}
        shifts={shifts}
        sites={sites}
        workers={workers}
      />
    </div>
  )
}