import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useShifts } from '../hooks/useShifts'
import { useSites } from '../hooks/useSites'
import { ColoredDay } from '../components/TestCalendar/ColoredDay'
import styles from '../styles/test.module.css'

export default function TestPage() {
  const [date, setDate] = useState(new Date())
  const [activeStartDate, setActiveStartDate] = useState(new Date())
  const [direction, setDirection] = useState(0)
  
  const { shifts } = useShifts()
  const { sites } = useSites()

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

  return (
    <div className={styles.testPage}>
      <div className={styles.calendarWrapper}>
        {/* Кнопка "Сегодня" */}
        <button 
          className={styles.todayButton}
          onClick={goToToday}
          aria-label="Перейти к сегодня"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Сегодня</span>
        </button>

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
              onChange={setDate}
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
    </div>
  )
}
