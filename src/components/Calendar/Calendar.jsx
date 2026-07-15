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
    onModeChange,
    feedScrollPosition // позиция из MainPage
}) {
    const [mode, setMode] = useState(externalMode || 'month')
    const [displayDate, setDisplayDate] = useState(new Date())
    const [feedDays, setFeedDays] = useState([])
    const [feedOffset, setFeedOffset] = useState(0)
    const [isFeedReady, setIsFeedReady] = useState(false)
    const isFirstRender = useRef(true)
    const feedContainerRef = useRef(null)
    const isRestoringScroll = useRef(false)
    const hasScrolledToToday = useRef(false)

    // Генерация дней для режима "День"
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
        setIsFeedReady(true)
        hasScrolledToToday.current = false
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

    // Позиционирование при открытии/переключении на "День"
    useEffect(() => {
        if (mode === 'feed' && isFeedReady && feedContainerRef.current) {
            const container = feedContainerRef.current
            
            // Если есть сохранённая позиция — восстанавливаем её
            if (feedScrollPosition !== undefined && feedScrollPosition !== null) {
                isRestoringScroll.current = true
                container.scrollTop = feedScrollPosition
                setTimeout(() => {
                    isRestoringScroll.current = false
                }, 50)
                return
            }
            
            // Иначе — скроллим к сегодняшнему дню на 30% от верха
            const todayItems = container.querySelectorAll('.feed-item.today')
            if (todayItems.length > 0) {
                const target = todayItems[0]
                const containerHeight = container.clientHeight
                const targetOffsetTop = target.offsetTop
                // 30% от верха
                const scrollTo = targetOffsetTop - containerHeight * 0.3
                // Мгновенный скролл без анимации
                container.scrollTop = scrollTo
                hasScrolledToToday.current = true
            }
        }
    }, [mode, isFeedReady, feedScrollPosition])

    // Запоминаем позицию скролла для сохранения
    useEffect(() => {
        const container = feedContainerRef.current
        if (!container || mode !== 'feed') return

        const handleScroll = () => {
            if (isRestoringScroll.current) return
            // Передаём позицию в MainPage через onModeChange
            if (onModeChange) {
                onModeChange(mode, container.scrollTop)
            }
        }

        container.addEventListener('scroll', handleScroll)
        return () => container.removeEventListener('scroll', handleScroll)
    }, [mode, onModeChange])

    // Бесконечная подгрузка при скролле
    useEffect(() => {
        const container = feedContainerRef.current
        if (!container || mode !== 'feed' || !isFeedReady) return

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container
            
            if (scrollTop < 50) {
                const newOffset = feedOffset - 20
                const newDays = generateFeedDays(newOffset, 20)
                setFeedDays(prev => [...newDays, ...prev])
                setFeedOffset(newOffset)
                isRestoringScroll.current = true
                setTimeout(() => {
                    container.scrollTop = 200
                    isRestoringScroll.current = false
                }, 50)
                return
            }
            
            if (scrollTop + clientHeight >= scrollHeight - 50) {
                const lastDate = feedDays[feedDays.length - 1]?.date
                if (lastDate) {
                    const newOffset = feedOffset + feedDays.length
                    const newDays = generateFeedDays(newOffset, 20)
                    setFeedDays(prev => [...prev, ...newDays])
                }
            }
        }

        container.addEventListener('scroll', handleScroll)
        return () => container.removeEventListener('scroll', handleScroll)
    }, [feedDays, feedOffset, mode, isFeedReady])

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
            // При переключении сбрасываем сохранённую позицию, чтобы показать сегодня
            onModeChange(newMode, null)
        }
        const today = new Date()
        onDateSelect(today)
        setDisplayDate(today)
        
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

    const displayDays = getDays(displayDate)

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
                    days={displayDays}
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
