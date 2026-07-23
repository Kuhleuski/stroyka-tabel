import { useState, useEffect } from 'react'
import { MONTHS, getMonthDays, isToday as checkIsToday, formatDate } from '../../utils/dateHelpers'
import styles from '../../styles/workers.module.css'
import calendarStyles from '../../styles/calendar.module.css'

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
        <div className={styles.workerCalendar}>
            <div className={styles.workerCalendarHeader}>
                <button className={styles.workerCalendarNav} onClick={handlePrevMonth}>‹</button>
                <span className={styles.workerCalendarTitle}>
                    {MONTHS[month]} {year}
                </span>
                <button className={styles.workerCalendarNav} onClick={handleNextMonth}>›</button>
            </div>
            
            <div className={styles.workerCalendarGrid}>
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                    <div key={day} className={styles.workerCalendarLabel}>{day}</div>
                ))}
                
                {days.map((day, index) => {
                    if (day.empty) {
                        return <div key={`empty-${index}`} className={`${styles.workerCalendarCell} ${styles.empty}`}></div>
                    }
                    
                    const hasShift = isShiftDay(day.date)
                    const today = isToday(day.date)
                    const selected = isSelected(day.date)
                    
                    return (
                        <div 
                            key={index}
                            className={`${styles.workerCalendarCell} ${today ? styles.today : ''} ${selected ? styles.selected : ''} ${hasShift ? styles.hasShift : ''}`}
                            onClick={() => handleDayClick(day.date)}
                        >
                            <span className={styles.workerCalendarDay}>{day.day}</span>
                            {hasShift && <span className={styles.workerCalendarDot}></span>}
                        </div>
                    )
                })}
            </div>
            
            {shiftDates.size > 0 && (
                <div className={styles.workerCalendarStats}>
                    <span>📋 Всего смен: {shiftDates.size}</span>
                </div>
            )}
        </div>
    )
}
