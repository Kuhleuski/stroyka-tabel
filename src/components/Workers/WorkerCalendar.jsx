import { useState, useEffect } from 'react'
import { MONTHS, getMonthDays, isToday as checkIsToday, formatDate } from '../../utils/dateHelpers'

export function WorkerCalendar({ shifts, workerName }) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())

    const getShiftDates = () => {
        const dates = new Set()
        shifts.forEach(s => {
            if (s.worker_name === workerName) {
                dates.add(s.work_date)
            }
        })
        return dates
    }

    const shiftDates = getShiftDates()

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const days = getMonthDays(year, month)

    const handlePrevMonth = () => {
        const newDate = new Date(currentDate)
        newDate.setMonth(newDate.getMonth() - 1)
        setCurrentDate(newDate)
    }

    const handleNextMonth = () => {
        const newDate = new Date(currentDate)
        newDate.setMonth(newDate.getMonth() + 1)
        setCurrentDate(newDate)
    }

    const isToday = (date) => {
        return checkIsToday(date)
    }

    const isShiftDay = (date) => {
        const dateStr = formatDate(date)
        return shiftDates.has(dateStr)
    }

    const isSelected = (date) => {
        return date.getDate() === selectedDate.getDate() &&
               date.getMonth() === selectedDate.getMonth() &&
               date.getFullYear() === selectedDate.getFullYear()
    }

    const handleDayClick = (date) => {
        setSelectedDate(date)
    }

    return (
        <div className="worker-calendar">
            <div className="worker-calendar-header">
                <button className="worker-calendar-nav" onClick={handlePrevMonth}>‹</button>
                <span className="worker-calendar-title">
                    {MONTHS[month]} {year}
                </span>
                <button className="worker-calendar-nav" onClick={handleNextMonth}>›</button>
            </div>
            
            <div className="worker-calendar-grid">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                    <div key={day} className="worker-calendar-label">{day}</div>
                ))}
                
                {days.map((day, index) => {
                    if (day.empty) {
                        return <div key={`empty-${index}`} className="worker-calendar-cell empty"></div>
                    }
                    
                    const hasShift = isShiftDay(day.date)
                    const today = isToday(day.date)
                    const selected = isSelected(day.date)
                    
                    return (
                        <div 
                            key={index}
                            className={`worker-calendar-cell ${today ? 'today' : ''} ${selected ? 'selected' : ''} ${hasShift ? 'has-shift' : ''}`}
                            onClick={() => handleDayClick(day.date)}
                        >
                            <span className="worker-calendar-day">{day.day}</span>
                            {hasShift && <span className="worker-calendar-dot"></span>}
                        </div>
                    )
                })}
            </div>
            
            {shiftDates.size > 0 && (
                <div className="worker-calendar-stats">
                    <span>📋 Всего смен: {shiftDates.size}</span>
                </div>
            )}
        </div>
    )
}
