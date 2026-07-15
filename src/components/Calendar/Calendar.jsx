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
    const [allDays, setAllDays] = useState([])
    const [loading, setLoading] = useState(false)
    const isFirstRender = useRef(true)
    const containerRef = useRef(null)
    const feedOffset = useRef(0)

    // Генерация дней от текущей позиции
    const generateDays = (offset, count = 30) => {
        const days = []
        const startDate = new Date(displayDate)
        startDate.setDate(startDate.getDate() + offset)
        for (let i = 0; i < count; i++) {
            const d = new Date(startDate)
            d.setDate(startDate.getDate() + i)
            days.push({ date: d, day: d.getDate(), empty: false })
        }
        return days
    }

    // Загружаем начальные дни
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            const today = new Date()
            onDateSelect(today)
            setDisplayDate(today)
            // Начальные дни: 60 дней (30 назад + 30 вперёд)
            const initialDays = generateDays(-30, 60)
            setAllDays(initialDays)
        }
    }, [])

    // Проверка скролла для подгрузки
    useEffect(() => {
        const container = document.getElementById('feedContainer')
        if (!container || mode !== 'feed') return

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container
            
            // Подгружаем если дошли до верха
            if (scrollTop < 100 && !loading) {
                setLoading(true)
                // Добавляем 20 дней в начало
                const newDays = generateDays(feedOffset.current - 30, 20)
                setAllDays(prev => [...newDays, ...prev])
                feedOffset.current -= 20
                // Сохраняем позицию скролла
                setTimeout(() => {
                    container.scrollTop = 200
                    setLoading(false)
                }, 50)
                return
            }
            
            // Подгружаем если дошли до низа
            if (scrollTop + clientHeight >= scrollHeight - 100 && !loading) {
                setLoading(true)
                // Добавляем 20 дней в конец
                const currentOffset = feedOffset.current + allDays.length
                const newDays = generateDays(currentOffset, 20)
                setAllDays(prev => [...prev, ...newDays])
                setTimeout(() => {
                    setLoading(false)
                }, 50)
            }
        }

        container.addEventListener('scroll', handleScroll)
        return () => container.removeEventListener('scroll', handleScroll)
    }, [allDays, loading, mode])

    const getDays = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        
        switch (mode) {
            case 'feed':
                return allDays
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
                return ''
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
            // Смещаем все дни на 30 дней
            const offset = direction * 30
            feedOffset.current += offset
            const newDays = generateDays(feedOffset.current - 30, 60)
            setAllDays(newDays)
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
        feedOffset.current = 0
        const initialDays = generateDays(-30, 60)
        setAllDays(initialDays)
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
