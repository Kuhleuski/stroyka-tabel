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
    const [feedOffset, setFeedOffset] = useState(0) // для бесконечной ленты
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

    const getDays = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        
        switch (mode) {
            case 'feed': {
                // Бесконечная лента — показываем 60 дней вокруг текущей позиции
                const days = []
                const startDate = new Date(date)
                startDate.setDate(startDate.getDate() - 30 + feedOffset)
                for (let i = 0; i < 60; i++) {
                    const d = new Date(startDate)
                    d.setDate(startDate.getDate() + i)
                    days.push({ date: d, day: d.getDate(), empty: false })
                }
                return days
            }
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
                return '' // Убираем заголовок
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
        const newDate = new Date(displayDate)
        if (mode === 'month') {
            newDate.setMonth(newDate.getMonth() + direction)
        } else if (mode === 'week') {
            newDate.setDate(newDate.getDate() + direction * 7)
        } else if (mode === 'feed') {
            // Для ленты просто смещаем offset
            setFeedOffset(feedOffset + direction * 30)
            onDateSelect(new Date(selectedDate))
            return
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
        setFeedOffset(0)
    }

    const handleDayClick = (date) => {
        onDateSelect(date)
        if (onDayClick) {
            onDayClick(date, mode)
        }
    }

    return (
        <div className="calendar-wrapper">
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
    )
}
