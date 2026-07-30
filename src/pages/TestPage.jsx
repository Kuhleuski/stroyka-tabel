import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useShifts } from '../hooks/useShifts'
import { useSites } from '../hooks/useSites'
import { useWorkers } from '../hooks/useWorkers'
import { useAuth } from '../context/AuthContext'
import { ColoredDay } from '../components/TestCalendar/ColoredDay'
import { DayDetails } from '../components/TestCalendar/DayDetails'
import { AddShiftForm } from '../components/Shifts/AddShiftForm'
import { Plus } from 'lucide-react'
import styles from '../styles/test.module.css'
import componentsStyles from '../styles/components.module.css'

export default function TestPage() {
  const [date, setDate] = useState(new Date())
  const [activeStartDate, setActiveStartDate] = useState(new Date())
  const [direction, setDirection] = useState(0)
  const [showAddShift, setShowAddShift] = useState(false)
  const [showSavingScreen, setShowSavingScreen] = useState(false)
  const [updateKey, setUpdateKey] = useState(0)
  
  const { shifts, loading, refetch } = useShifts()
  const { sites } = useSites()
  const { workers } = useWorkers()
  const { user } = useAuth()

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

  const handleOpenAddShift = () => {
    setShowAddShift(true)
  }

  const handleShiftAdded = async () => {
    setShowSavingScreen(true)
    setShowAddShift(false)
    
    if (refetch) {
      await refetch()
    }
    
    await new Promise(resolve => setTimeout(resolve, 1200))
    setShowSavingScreen(false)
    setUpdateKey(prev => prev + 1)
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

  const isCurrentMonth = () => {
    const today = new Date()
    return activeStartDate.getMonth() === today.getMonth() && 
           activeStartDate.getFullYear() === today.getFullYear()
  }

  // Проверка: видна ли выбранная дата в текущем месяце
  const isDateVisible = () => {
    const selectedMonth = date.getMonth()
    const selectedYear = date.getFullYear()
    const currentMonth = activeStartDate.getMonth()
    const currentYear = activeStartDate.getFullYear()
    
    return selectedMonth === currentMonth && selectedYear === currentYear
  }

  if (showSavingScreen) {
    return (
      <div className={componentsStyles.savingScreen}>
        <div className={componentsStyles.savingContent}>
          <div className={componentsStyles.savingSpinner}>
            <div className={componentsStyles.savingDot}></div>
            <div className={componentsStyles.savingDot}></div>
            <div className={componentsStyles.savingDot}></div>
          </div>
          <h2 className={componentsStyles.savingTitle}>Сохраняем смену</h2>
          <p className={componentsStyles.savingText}>Пожалуйста, подождите</p>
        </div>
      </div>
    )
  }

  if (showAddShift) {
    return (
      <AddShiftForm
        selectedDate={date}
        onClose={() => setShowAddShift(false)}
        onSuccess={handleShiftAdded}
        sites={sites}
        workers={workers}
      />
    )
  }

  return (
    <div className={styles.testPage}>
      <div className={styles.calendarWrapper}>
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

      {/* Детали дня - показываем только если выбранная дата видна в календаре */}
      {isDateVisible() ? (
        <DayDetails 
          key={updateKey}
          selectedDate={date}
          shifts={shifts}
          sites={sites}
          workers={workers}
        />
      ) : (
        <div className={styles.dateNotVisible}>
          <span>Выберите день в текущем месяце</span>
        </div>
      )}

      {/* FAB кнопка - показываем только если дата выбрана и видна */}
      {user?.role === 'admin' && isDateVisible() && (
        <button 
          className={componentsStyles.fabAddShift}
          onClick={handleOpenAddShift}
          aria-label="Добавить смену"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}