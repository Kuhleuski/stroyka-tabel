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
import { formatDateLocal } from '../utils/dateHelpers'
import { Plus, X } from 'lucide-react'
import styles from '../styles/test.module.css'
import componentsStyles from '../styles/components.module.css'

export default function TestPage() {
  const [date, setDate] = useState(new Date())
  const [activeStartDate, setActiveStartDate] = useState(new Date())
  const [direction, setDirection] = useState(0)
  const [showAddShift, setShowAddShift] = useState(false)
  const [showSavingScreen, setShowSavingScreen] = useState(false)
  const [showFutureWarning, setShowFutureWarning] = useState(false)
  const [showNoDateWarning, setShowNoDateWarning] = useState(false)
  const [updateKey, setUpdateKey] = useState(0)
  
  // === СОСТОЯНИЯ ДЛЯ РЕДАКТИРОВАНИЯ ===
  const [editData, setEditData] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  
 const { shifts, loading, refetch } = useShifts()
const { sites, archivedSites, refreshArchivedSites } = useSites()
const { workers, archivedWorkers, refreshArchivedWorkers } = useWorkers()
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

  // Блокировка скролла при открытой модалке
  useEffect(() => {
    if (showFutureWarning || showNoDateWarning) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showFutureWarning, showNoDateWarning])

  const formatMonth = (date) => {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  }

  // ⭐ ПРОВЕРКА МОЖНО ЛИ ПЕРЕЙТИ НА СЛЕДУЮЩИЙ МЕСЯЦ
  const canGoNext = () => {
    const today = new Date()
    const nextMonth = new Date(activeStartDate)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    // Нельзя перейти на месяц позже текущего
    if (nextMonth.getFullYear() > today.getFullYear()) {
      return false
    }
    if (nextMonth.getMonth() > today.getMonth() && nextMonth.getFullYear() >= today.getFullYear()) {
      return false
    }
    return true
  }

  // ⭐ ПРОВЕРКА МОЖНО ЛИ ПЕРЕЙТИ НА ПРЕДЫДУЩИЙ МЕСЯЦ
  const canGoPrev = () => {
    const prevMonth = new Date(activeStartDate)
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    
    // Проверяем, что не ушли дальше 2 лет назад
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
    twoYearsAgo.setMonth(twoYearsAgo.getMonth())
    
    return prevMonth >= twoYearsAgo
  }

  const changeMonth = (newDirection) => {
    if (newDirection > 0 && !canGoNext()) return
    if (newDirection < 0 && !canGoPrev()) return
    
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
    // Если дата не выбрана — показываем предупреждение
    if (!date) {
      setShowNoDateWarning(true)
      return
    }
    
    // Проверяем, является ли выбранная дата будущей
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDate = new Date(date)
    selectedDate.setHours(0, 0, 0, 0)
    
    if (selectedDate > today) {
      setShowFutureWarning(true)
      return
    }
    
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
  
  // Обновляем архивные данные
  await refreshArchivedSites()
  await refreshArchivedWorkers()
  
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
  
  const isActive = date && tileDate.toDateString() === date.toDateString()
  
  return (
    <ColoredDay 
      date={tileDate} 
      shifts={shifts} 
      sites={sites}
      archivedSites={archivedSites}  // ← ДОБАВИТЬ
      isActive={isActive}
    />
  )
}

  // === КЛАССЫ ДЛЯ ЯЧЕЕК ===
  const tileClassName = ({ date: tileDate, view }) => {
    if (view !== 'month') return null
    
    const isActive = date && tileDate.toDateString() === date.toDateString()
    const classes = []
    
    if (isActive) {
      classes.push('custom-selected-day')
    }
    
    // Проверяем, является ли дата будущей (начиная с завтра)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(tileDate)
    checkDate.setHours(0, 0, 0, 0)
    const isFuture = checkDate > today
    
    if (isFuture) {
      classes.push('future-day')
    }
    
    return classes.length > 0 ? classes : null
  }

  const isCurrentMonth = () => {
    const today = new Date()
    return activeStartDate.getMonth() === today.getMonth() && 
           activeStartDate.getFullYear() === today.getFullYear()
  }

  const isDateVisible = () => {
    if (!date) return false
    const selectedMonth = date.getMonth()
    const selectedYear = date.getFullYear()
    const currentMonth = activeStartDate.getMonth()
    const currentYear = activeStartDate.getFullYear()
    
    return selectedMonth === currentMonth && selectedYear === currentYear
  }

  // === СБРОС ВЫБОРА ПРИ КЛИКЕ НА ПУСТОЕ МЕСТО ===
  const handleContainerClick = (e) => {
    // Проверяем, что клик был не по ячейке календаря, не по кнопке и не по модалке
    const target = e.target
    const isTile = target.closest('.react-calendar__tile')
    const isButton = target.closest('button')
    const isFab = target.closest('.fabAddShift')
    const isModal = target.closest('.futureWarningOverlay') || target.closest('.futureWarningModal')
    
    if (!isTile && !isButton && !isFab && !isModal) {
      // Сбрасываем выбранную дату в null (ничего не выбрано)
      setDate(null)
    }
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
        shifts={shifts}
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
    <div 
      className={styles.testPage}
      onClick={handleContainerClick}
    >
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
    dragDirectionLock={true}
    dragConstraints={{ left: 0, right: 0 }}
    dragElastic={0.5}
    dragMomentum={false}
    onDragEnd={(event, info) => {
        const threshold = 30
        if (info.offset.x < -threshold) {
            if (canGoNext()) {
                changeMonth(1)
            }
        } else if (info.offset.x > threshold) {
            if (canGoPrev()) {
                changeMonth(-1)
            }
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
        tileClassName={tileClassName}
    />
</motion.div>
        </AnimatePresence>
      </div>

    {date && isDateVisible() ? (
  <DayDetails 
    key={updateKey}
    selectedDate={date}
    shifts={shifts}
    sites={sites}
    workers={workers}
    archivedSites={archivedSites}
    archivedWorkers={archivedWorkers}
    onShiftDeleted={handleShiftDeleted}
    onEditShift={handleEditShift}
  />
) : date && !isDateVisible() ? (
  <div className={styles.dateNotVisible}>
    <span>Выберите день в текущем месяце</span>
  </div>
) : null}

      {/* FAB всегда видна для админов */}
      {user?.role === 'admin' && (
        <button 
          className={componentsStyles.fabAddShift}
          onClick={handleOpenAddShift}
          aria-label="Добавить смену"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}

      {/* Модалка предупреждения о будущей дате */}
      {showFutureWarning && (
        <div className={styles.futureWarningOverlay} onClick={() => setShowFutureWarning(false)}>
          <div className={styles.futureWarningModal} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.futureWarningClose}
              onClick={() => setShowFutureWarning(false)}
            >
              <X size={20} strokeWidth={2} />
            </button>
            <h3 className={styles.futureWarningTitle}>Недоступно</h3>
            <p className={styles.futureWarningText}>Создание смен на будущие даты запрещено</p>
            <button 
              className={styles.futureWarningBtn}
              onClick={() => setShowFutureWarning(false)}
            >
              Понятно
            </button>
          </div>
        </div>
      )}

      {/* Модалка предупреждения о невыбранной дате */}
      {showNoDateWarning && (
        <div className={styles.futureWarningOverlay} onClick={() => setShowNoDateWarning(false)}>
          <div className={styles.futureWarningModal} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.futureWarningClose}
              onClick={() => setShowNoDateWarning(false)}
            >
              <X size={20} strokeWidth={2} />
            </button>
            <h3 className={styles.futureWarningTitle}>Не выбрана дата</h3>
            <p className={styles.futureWarningText}>Выберите дату чтобы поставить смену</p>
            <button 
              className={styles.futureWarningBtn}
              onClick={() => setShowNoDateWarning(false)}
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  )
}