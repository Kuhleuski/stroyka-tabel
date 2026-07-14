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
            setCurrentDate(today)
        }
    }, [])

    const getDays = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        
        switch (mode) {
            case 'week':
                return getWeekDays(currentDate)
            case 'month':
            default:
                return getMonthDays(year, month)
        }
    }

    const days = getDays()

    const getTitle = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        
        switch (mode) {
            case 'week': {
                const first = days[0]?.date
                const last = days[days.length - 1]?.date
                if (first && last) {
                    return `${first.getDate()} ${MONTHS[first.getMonth()]} - ${last.getDate()} ${MONTHS[last.getMonth()]} ${year}`
                }
                return ''
            }
            case 'month':
            default:
                return `${MONTHS[month]} ${year}`
        }
    }

    const handlePrev = () => {
        const newDate = new Date(currentDate)
        if (mode === 'month') {
            newDate.setMonth(newDate.getMonth() - 1)
        } else if (mode === 'week') {
            newDate.setDate(newDate.getDate() - 7)
        }
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
    }

    const handleNext = () => {
        const newDate = new Date(currentDate)
        if (mode === 'month') {
            newDate.setMonth(newDate.getMonth() + 1)
        } else if (mode === 'week') {
            newDate.setDate(newDate.getDate() + 7)
        }
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
    }

    const handleModeChange = (newMode) => {
        setMode(newMode)
        if (onModeChange) {
            onModeChange(newMode)
        }
        const today = new Date()
        onDateSelect(today)
        setCurrentDate(today)
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
                <button className="calendar-nav-btn" onClick={handlePrev}>‹</button>
                <span className="month-title">{getTitle()}</span>
                <button className="calendar-nav-btn" onClick={handleNext}>›</button>
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
