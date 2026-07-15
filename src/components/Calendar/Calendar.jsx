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
    const isFirstRender = useRef(true)
    const touchStartX = useRef(0)
    const touchEndX = useRef(0)
    const touchStartY = useRef(0)
    const touchEndY = useRef(0)

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
            case 'feed':
                // Для ленты показываем 30 дней от текущей даты
                const days = []
                const startDate = new Date(date)
                startDate.setDate(startDate.getDate() - 15)
                for (let i = 0; i < 30; i++) {
                    const d = new Date(startDate)
                    d.setDate(startDate.getDate() + i)
                    days.push({ date: d, day: d.getDate(), empty: false })
                }
                return days
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
            case 'feed':
                return `Лента событий`
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
        
        const newDate = new Date(displayDate)
        if (mode === 'month') {
            newDate.setMonth(newDate.getMonth() + direction)
        } else if (mode === 'week') {
            newDate.setDate(newDate.getDate() + direction * 7)
        } else if (mode === 'feed') {
            newDate.setDate(newDate.getDate() + direction * 15)
        }
        
        setDisplayDate(newDate)
        setCurrentDate(newDate)
        
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
        
        setTimeout(() => {
            setIsAnimating(false)
        }, 300)
    }

    const handlePrev = () => changeMonth(-1)
    const handleNext = () => changeMonth(1)

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX
        touchStartY.current = e.touches[0].clientY
    }

    const handleTouchEnd = (e) => {
        touchEndX.current = e.changedTouches[0].clientX
        touchEndY.current = e.changedTouches[0].clientY
        
        const diffX = touchStartX.current - touchEndX.current
        const diffY = touchStartY.current - touchEndY.current
        
        // Для ленты — свайп вверх/вниз
        if (mode === 'feed') {
            if (Math.abs(diffY) > 50) {
                if (diffY > 0) {
                    // Свайп вверх — следующие дни
                    const newDate = new Date(displayDate)
                    newDate.setDate(newDate.getDate() + 15)
                    setDisplayDate(newDate)
                    setCurrentDate(newDate)
                    onDateSelect(new Date(selectedDate))
                } else {
                    // Свайп вниз — предыдущие дни
                    const newDate = new Date(displayDate)
                    newDate.setDate(newDate.getDate() - 15)
                    setDisplayDate(newDate)
                    setCurrentDate(newDate)
                    onDateSelect(new Date(selectedDate))
                }
            }
            return
        }
        
        // Для месяца и недели — свайп влево/вправо
        if (Math.abs(diffX) > 50) {
            if (diffX > 0) {
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
            onTouchEnd={handleTouchEnd}
        >
            <ViewModeButtons mode={mode} onChange={handleModeChange} />
            
            <div className="calendar-header">
                {mode !== 'feed' && (
                    <>
                        <button className="calendar-nav-btn" onClick={handlePrev}>‹</button>
                        <span className="month-title">{getTitle(displayDate)}</span>
                        <button className="calendar-nav-btn" onClick={handleNext}>›</button>
                    </>
                )}
                {mode === 'feed' && (
                    <span className="month-title">{getTitle(displayDate)}</span>
                )}
            </div>
            
            <div className={`calendar-slide-container ${isAnimating ? 'slide-animate' : ''}`}>
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
