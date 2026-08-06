import { useState, useEffect, useRef } from 'react'
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
  
  // === СОСТОЯНИЯ ДЛЯ РЕДАКТИРОВАНИЯ ===
  const [editData, setEditData] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  
  const { shifts, loading, refetch } = useShifts()
  const { sites } = useSites()
  const { workers } = useWorkers()
  const { user } = useAuth()

  // === ОТСЛЕЖИВАНИЕ ПЕРВОГО РЕНДЕРА И ВОЗВРАТА ===
  const isFirstRender = useRef(true)
  const isReturning = useRef(false)

  // Проверяем, возвращаемся ли мы на страницу
  useEffect(() => {
    const savedReturn = sessionStorage.getItem('testPageReturning')
    if (savedReturn === 'true') {
      isReturning.current = true
      sessionStorage.removeItem('testPageReturning')
    }
  }, [])

  // При первом рендере — скролл наверх, без анимации
  useEffect(() => {
    if (isFirstRender.current) {
      setDirection(0)
      window.scrollTo({ top: 0, behavior: 'instant' })
      isFirstRender.current = false
    }
  }, [])

  // При возврате на страницу — скролл наверх, без анимации
  useEffect(() => {
    if (isReturning.current) {
      setDirection(0)
      window.scrollTo({ top: 0, behavior: 'instant' })
      isReturning.current = false
    }
  }, [])

  // Сохраняем флаг возврата при переключении вкладок
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        sessionStorage.setItem('testPageReturning', 'true')
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

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
    setIsEditMode(false)
    setEditData(null)
    setShowAddShift(true)
  }

  const handleEditShift = (siteId, workerIds) => {
    console.log('📝 Редактирование смены:', { siteId, workerIds })
    setIsEditMode(true)
    setEditData({ siteId, workerIds })
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
    setIsEditMode(false)
    setEditData(null)
  }

  const handleShiftDeleted = async () => {
    setShowSavingScreen(true)
    
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
          <h2 className={componentsStyles.savingTitle}>Обновляем данные</h2>
          <p className={componentsStyles.savingText}>Пожалуйста, подождите</p>
        </div>
      </div>
    )
  }

  if (showAddShift) {
    return (
      <AddShiftForm
        selectedDate={date}
        onClose={() => {
          setShowAddShift(false)
          setIsEditMode(false)
          setEditData(null)
        }}
        onSuccess={handleShiftAdded}
        sites={sites}
        workers={workers}
        initialSiteId={editData?.siteId || null}
        initialWorkerIds={editData?.workerIds || []}
        isEditMode={isEditMode}
      />
    )
  }

  // === КАСТОМНАЯ НАВИГАЦИЯ ===
  const renderCustomNavigation = () => {
    const showTodayButton = !isCurrentMonth()

    return (
      <div className={styles.customNavigation}>
        <div className={styles.navLeft}>
          <span className={styles.navMonthLabel}>
            {formatMonth(activeStartDate)}
          </span>
          {showTodayButton && (
            <button 
              className={styles.todayButtonNew}
              onClick={goToToday}
              aria-label="Перейти к сегодня"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              <span>Сегодня</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.testPage}>
      <div className={styles.calendarWrapper}>
        {/* Кастомная навигация */}
        {renderCustomNavigation()}

        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={activeStartDate.getMonth() + '-' + activeStartDate.getFullYear()}
            custom={direction}
            variants={variants}
            initial={isFirstRender.current || isReturning.current ? false : "enter"}
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

      {isDateVisible() ? (
        <DayDetails 
          key={updateKey}
          selectedDate={date}
          shifts={shifts}
          sites={sites}
          workers={workers}
          onShiftDeleted={handleShiftDeleted}
          onEditShift={handleEditShift}
        />
      ) : (
        <div className={styles.dateNotVisible}>
          <span>Выберите день в текущем месяце</span>
        </div>
      )}

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