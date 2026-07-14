import { useState } from 'react'
import { ViewModeButtons } from './ViewModeButtons'
import { CalendarGrid } from './CalendarGrid'
import { MONTHS, getMonthDays, getWeekDays } from '../../utils/dateHelpers'

export function Calendar({ shifts, selectedDate, onDateSelect }) {
    const [mode, setMode] = useState('month')
    const [currentDate, setCurrentDate] = useState(new Date())

    const getDays = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        
        switch (mode) {
            case 'day':
                return [{ date: selectedDate, day: selectedDate.getDate(), empty: false }]
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
            case 'day':
                return `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
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
    }

    const handleNext = () => {
        const newDate = new Date(currentDate)
        if (mode === 'month') {
            newDate.setMonth(newDate.getMonth() + 1)
        } else if (mode === 'week') {
            newDate.setDate(newDate.getDate() + 7)
        }
        setCurrentDate(newDate)
    }

    return (
        <div className="calendar-wrapper">
            <ViewModeButtons mode={mode} onChange={setMode} />
            
            <div className="calendar-header">
                <button className="calendar-nav-btn" onClick={handlePrev}>‹</button>
                <span className="month-title">{getTitle()}</span>
                <button className="calendar-nav-btn" onClick={handleNext}>›</button>
            </div>
            
            <CalendarGrid
                days={days}
                selectedDate={selectedDate}
                onDayClick={onDateSelect}
                shifts={shifts}
            />
        </div>
    )
}