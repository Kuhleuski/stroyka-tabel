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
    const [displayDate, setDisplayDate] = useState(new Date())
    const isFirstRender = useRef(true)

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
            setDisplayDate(today)
        }
    }, [])

    // Генерация дней для режима "День" — 90 дней (45 назад + 45 вперёд)
    const generateFeedDays = (date) => {
        const days = []
        const startDate = new Date(date)
        startDate.setDate(startDate.getDate() - 45)
        for (let i = 0; i < 90; i++) {
            const d = new Date(startDate)
            d.setDate(startDate.getDate() + i)
            days.push({ date: d, day: d.getDate(), empty: false })
        }
        return days
    }

    const getDays = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        
        switch (mode) {
            case 'feed':
                return generateFeedDays(date)
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
                return ''
            case 'month':
            default:
                return `${MONTHS[month]} ${year}`
        }
    }

    const changeMonth = (direction) => {
        const newDate = new Date(displayDate)
        if (mode === 'month') {
            newDate.setMonth(newDate.getMonth() + direction)
        } else if (mode === 'feed') {
            newDate.setDate(newDate.getDate() + direction * 45)
        }
        setDisplayDate(newDate)
        onDateSelect(new Date(selectedDate))
    }

    const handlePrev = () => changeMonth(-1)
    const handleNext = () => changeMonth(1)

    const handleModeChange = (newMode) => {
        setMode(newMode)
        if (onModeChange) {
            onModeChange(newMode)
        }
        const today = new Date()
        onDateSelect(today)
        setDisplayDate(today)
    }

    const handleDayClick = (date) => {
        onDateSelect(date)
        if (onDayClick) {
            onDayClick(date, mode)
        }
    }

    return (
        <>
            {/* Кнопки переключения режимов */}
            <div className="view-mode-wrapper">
                <ViewModeButtons mode={mode} onChange={handleModeChange} />
            </div>

            {/* Контент календаря */}
            <div className={`calendar-wrapper ${mode === 'feed' ? 'feed-mode' : ''}`}>
                <div className="calendar-header">
                    {mode !== 'feed' && (
                        <>
                            <button className="calendar-nav-btn" onClick={handlePrev}>‹</button>
                            <span className="month-title">{getTitle(displayDate)}</span>
                            <button className="calendar-nav-btn" onClick={handleNext}>›</button>
                        </>
                    )}
                    {mode === 'feed' && (
                        <span className="month-title" style={{ visibility: 'hidden' }}>—</span>
                    )}
                </div>
                
                <CalendarGrid
                    days={days}
                    selectedDate={selectedDate}
                    onDayClick={handleDayClick}
                    shifts={shifts}
                    mode={mode}
                />
            </div>
        </>
    )
}
