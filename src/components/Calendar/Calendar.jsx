import { useState, useEffect, useRef } from 'react'
import { ViewModeButtons } from './ViewModeButtons'
import { CalendarGrid } from './CalendarGrid'
import { MONTHS, getMonthDays, getWeekDays } from '../../utils/dateHelpers'

export function Calendar({ 
    shifts, 
    selectedDate, 
    onDateSelect, 
    onDayClick,
    mode: externalMode,
    onModeChange 
}) {
    const [mode, setMode] = useState(externalMode || 'month')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [displayDate, setDisplayDate] = useState(new Date())
    const [isAnimating, setIsAnimating] = useState(false)
    const [animationDirection, setAnimationDirection] = useState('')
    const isFirstRender = useRef(true)
    const touchStartX = useRef(0)
    const touchEndX = useRef(0)
    const animationTimeout = useRef(null)

    useEffect(() => {
        if (externalMode && externalMode !== mode) {
            setMode(externalMode)
        }
    }, [externalMode])

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            const today = new Date()
            onDateSelect(today)
            setCurrentDate(today)
            setDisplayDate(today)
        }
    }, [])

    const getDays = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        
        switch (mode) {
            case 'week':
                return getWeekDays(date)
            case 'month':
            default:
                return getMonthDays(year, month)
        }
    }

    const days = getDays(displayDate)

    const getTitle = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        
        switch (mode) {
            case 'week': {
                const weekDays = getWeekDays(date)
                const first = weekDays[0]
                const last = weekDays[weekDays.length - 1]
                if (first && last) {
                    return `${first.date.getDate()} ${MONTHS[first.date.getMonth()]} - ${last.date.getDate()} ${MONTHS[last.date.getMonth()]} ${year}`
                }
                return ''
            }
            case 'month':
            default:
                return `${MONTHS[month]} ${year}`
        }
    }

    const changeMonth = (direction) => {
        if (isAnimating) return
        
        setIsAnimating(true)
        setAnimationDirection(direction > 0 ? 'slide-left' : 'slide-right')
        
        const newDate = new Date(displayDate)
        if (mode === 'month') {
            newDate.setMonth(newDate.getMonth() + direction)
        } else if (mode === 'week') {
            newDate.setDate(newDate.getDate() + direction * 7)
        }
        
        // Сначала показываем анимацию
        setTimeout(() => {
            setDisplayDate(newDate)
            setCurrentDate(newDate)
            
            // Обновляем выбранную дату
            if (mode === 'week') {
                const weekDays = getWeekDays(newDate)
                const isSelectedInWeek = weekDays.some(d => 
                    d.date.getDate() === selectedDate.getDate() &&
                    d.date.getMonth() === selectedDate.getMonth() &&
                    d.date.getFullYear() === selectedDate.getFullYear()
                )
                if (!isSelectedInWeek) {
                    onDateSelect(weekDays[0].date)
                } else {
                    onDateSelect(new Date(selectedDate))
                }
            } else {
                onDateSelect(new Date(selectedDate))
            }
            
            // Сбрасываем анимацию
            setTimeout(() => {
                setIsAnimating(false)
                setAnimationDirection('')
            }, 50)
        }, 250)
    }

    const handlePrev = () => changeMonth(-1)
    const handleNext = () => changeMonth(1)

    const handleTouchStart = (e) => {
        if (isAnimating) return
        touchStartX.current = e.touches[0].clientX
    }

    const handleTouchMove = (e) => {
        // Опционально: можно добавить визуальный отклик при свайпе
    }

    const handleTouchEnd = (e) => {
        if (isAnimating) return
        touchEndX.current = e.changedTouches[0].clientX
        const diff = touchStartX.current - touchEndX.current
        
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                handleNext()
            } else {
                handlePrev()
            }
        }
    }

    const handleModeChange = (newMode) => {
        setMode(newMode)
        if (onModeChange) {
            onModeChange(newMode)
        }
        const today = new Date()
        onDateSelect(today)
        setDisplayDate(today)
        setCurrentDate(today)
    }

    const handleDayClick = (date) => {
        onDateSelect(date)
        if (onDayClick) {
            onDayClick(date, mode)
        }
    }

    return (
        <div 
            className="calendar-wrapper"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <ViewModeButtons mode={mode} onChange={handleModeChange} />
            
            <div className="calendar-header">
                <button className="calendar-nav-btn" onClick={handlePrev}>‹</button>
                <span className="month-title">{getTitle(displayDate)}</span>
                <button className="calendar-nav-btn" onClick={handleNext}>›</button>
            </div>
            
            <div className={`calendar-slide-container ${isAnimating ? animationDirection : ''}`}>
                <CalendarGrid
                    days={days}
                    selectedDate={selectedDate}
                    onDayClick={handleDayClick}
                    shifts={shifts}
                    mode={mode}
                />
            </div>
        </div>
    )
}
