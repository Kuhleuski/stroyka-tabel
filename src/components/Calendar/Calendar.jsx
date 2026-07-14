import { useState, useEffect } from 'react'
import { ViewModeButtons } from './ViewModeButtons'
import { CalendarGrid } from './CalendarGrid'
import { MONTHS, getMonthDays, getWeekDays } from '../../utils/dateHelpers'

export function Calendar({ shifts, selectedDate, onDateSelect }) {
    const [mode, setMode] = useState('month')
    const [currentDate, setCurrentDate] = useState(new Date())

    useEffect(() => {
        if (selectedDate) {
            setCurrentDate(new Date(selectedDate))
        }
    }, [selectedDate])

    const getDays = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        
        switch (mode) {
            case 'day':
                return [{ date: new Date(selectedDate), day: selectedDate.getDate(), empty: false }]
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
        } else if (mode === 'day') {
            newDate.setDate(newDate.getDate() - 1)
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
                // Даже если день в неделе — обновляем, чтобы таймлайн перерисовался
                onDateSelect(new Date(selectedDate))
            }
        } else {
            // Для месяца и дня просто обновляем
            onDateSelect(new Date(selectedDate))
        }
    }

    const handleNext = () => {
        const newDate = new Date(currentDate)
        if (mode === 'month') {
            newDate.setMonth(newDate.getMonth() + 1)
        } else if (mode === 'week') {
            newDate.setDate(newDate.getDate() + 7)
        } else if (mode === 'day') {
            newDate.setDate(newDate.getDate() + 1)
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
        
        // Проверяем для недели
        if (newMode === 'week') {
            const weekDays = getWeekDays(currentDate)
            const isSelectedInWeek = weekDays.some(d => 
                d.date.getDate() === selectedDate.getDate() &&
                d.date.getMonth() === selectedDate.getMonth() &&
                d.date.getFullYear() === selectedDate.getFullYear()
            )
            if (!isSelectedInWeek) {
                onDateSelect(weekDays[0].date)
            } else {
                // Принудительно обновляем таймлайн с тем же днем
                onDateSelect(new Date(selectedDate))
            }
        } else if (newMode === 'day') {
            // Для дня просто обновляем таймлайн
            onDateSelect(new Date(selectedDate))
        } else {
            // Для месяца — обновляем таймлайн
            onDateSelect(new Date(selectedDate))
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
                onDayClick={(date) => {
                    onDateSelect(date)
                    // Если мы в режиме недели или месяца, обновляем currentDate
                    if (mode === 'week') {
                        setCurrentDate(new Date(date))
                    } else if (mode === 'month') {
                        setCurrentDate(new Date(date))
                    }
                }}
                shifts={shifts}
            />
        </div>
    )
}
