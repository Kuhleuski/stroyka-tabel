import { useState, useEffect, useRef } from 'react'
import { ViewModeButtons } from './ViewModeButtons'
import { CalendarGrid } from './CalendarGrid'
import { MONTHS, getMonthDays } from '../../utils/dateHelpers'

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
    const [feedDays, setFeedDays] = useState([])
    const [feedOffset, setFeedOffset] = useState(0)
    const isFirstRender = useRef(true)
    const feedContainerRef = useRef(null)
    const isInitialized = useRef(false)

    // Генерация дней
    const generateFeedDays = (offset, count = 30) => {
        const days = []
        const today = new Date()
        const startDate = new Date(today)
        startDate.setDate(today.getDate() + offset)
        for (let i = 0; i < count; i++) {
            const d = new Date(startDate)
            d.setDate(startDate.getDate() + i)
            days.push({ date: d, day: d.getDate(), empty: false })
        }
        return days
    }

    const initFeed = (offset = 0) => {
        const days = generateFeedDays(offset - 45, 90)
        setFeedDays(days)
        setFeedOffset(offset)
    }

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
            initFeed(0)
        }
    }, [])

    // Скролл к сегодняшнему дню при первом открытии
    useEffect(() => {
        if (mode === 'feed' && feedDays.length > 0 && !isInitialized.current) {
            setTimeout(() => {
                const container = feedContainerRef.current
                if (container) {
                    const todayItems = container.querySelectorAll('.feed-item.today')
                    if (todayItems.length > 0) {
                        const target = todayItems[0]
                        const containerHeight = container.clientHeight
                        const targetOffsetTop = target.offsetTop
                        container.scrollTop = targetOffsetTop - containerHeight * 0.3
                    }
                }
                isInitialized.current = true
            }, 100)
        }
    }, [mode, feedDays])

    const getDays = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        
        switch (mode) {
            case 'feed':
                return feedDays
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
            const newOffset = feedOffset + direction * 30
            initFeed(newOffset)
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
        isInitialized.current = false
        
        if (newMode === 'feed') {
            initFeed(0)
        }
    }

    const handleDayClick = (date) => {
        onDateSelect(date)
        if (onDayClick) {
            onDayClick(date, mode)
        }
    }

    // Бесконечная подгрузка (простая)
    useEffect(() => {
        const container = feedContainerRef.current
        if (!container || mode !== 'feed' || feedDays.length === 0) return

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container
            
            if (scrollTop < 30) {
                const newOffset = feedOffset - 15
                const newDays = generateFeedDays(newOffset, 15)
                setFeedDays(prev => [...newDays, ...prev])
                setFeedOffset(newOffset)
                container.scrollTop = 100
                return
            }
            
            if (scrollTop + clientHeight >= scrollHeight - 30) {
                const newOffset = feedOffset + feedDays.length
                const newDays = generateFeedDays(newOffset, 15)
                setFeedDays(prev => [...prev, ...newDays])
            }
        }

        container.addEventListener('scroll', handleScroll)
        return () => container.removeEventListener('scroll', handleScroll)
    }, [feedDays, feedOffset, mode])

    return (
        <>
            <div className="view-mode-wrapper">
                <ViewModeButtons mode={mode} onChange={handleModeChange} />
            </div>

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
                    feedContainerRef={feedContainerRef}
                />
            </div>
        </>
    )
}
