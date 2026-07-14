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
    const [displayDate, setDisplayDate] = useState(new Date())
    const [nextDate, setNextDate] = useState(null)
    const [prevDate, setPrevDate] = useState(null)
    const [dragOffset, setDragOffset] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)
    
    const isFirstRender = useRef(true)
    const touchStartX = useRef(0)
    const touchCurrentX = useRef(0)

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
            setDisplayDate(today)
        }
    }, [])

    // Обновляем соседние даты при изменении displayDate
    useEffect(() => {
        const prev = new Date(displayDate)
        const next = new Date(displayDate)
        
        if (mode === 'month') {
            prev.setMonth(prev.getMonth() - 1)
            next.setMonth(next.getMonth() + 1)
        } else if (mode === 'week') {
            prev.setDate(prev.getDate() - 7)
            next.setDate(next.getDate() + 7)
        }
        
        setPrevDate(prev)
        setNextDate(next)
    }, [displayDate, mode])

    const getDays = (date) => {
        if (!date) return []
        const year = date.getFullYear()
        const month = date.getMonth()
        
        switch (mode) {
            case 'week':
                return getWeekDays(date)
            case 'month':
            default:
                return getMonthDays(year, month)
        }
    }

    const days = getDays(displayDate)
    const prevDays = getDays(prevDate)
    const nextDays = getDays(nextDate)

    const getTitle = (date) => {
        if (!date) return ''
        const year = date.getFullYear()
        const month = date.getMonth()
        
        switch (mode) {
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

    const changeMonth = (direction, callback) => {
        if (isAnimating) return
        
        const newDate = new Date(displayDate)
        if (mode === 'month') {
            newDate.setMonth(newDate.getMonth() + direction)
        } else if (mode === 'week') {
            newDate.setDate(newDate.getDate() + direction * 7)
        }
        
        setIsAnimating(true)
        setDisplayDate(newDate)
        setCurrentDate(newDate)
        setDragOffset(0)
        
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
        
        setTimeout(() => {
            setIsAnimating(false)
            if (callback) callback()
        }, 300)
    }

    const handlePrev = () => changeMonth(-1)
    const handleNext = () => changeMonth(1)

    // === DRAG-СВАЙП С ПОДГЛЯДЫВАНИЕМ ===
    const handleTouchStart = (e) => {
        if (isAnimating) return
        setIsDragging(true)
        touchStartX.current = e.touches[0].clientX
        touchCurrentX.current = e.touches[0].clientX
        setDragOffset(0)
    }

    const handleTouchMove = (e) => {
        if (!isDragging || isAnimating) return
        
        touchCurrentX.current = e.touches[0].clientX
        const diff = touchStartX.current - touchCurrentX.current
        const maxDrag = 200
        const clampedDiff = Math.max(-maxDrag, Math.min(maxDrag, diff))
        setDragOffset(-clampedDiff)
    }

    const handleTouchEnd = (e) => {
        if (!isDragging) return
        setIsDragging(false)
        
        const diff = touchStartX.current - touchCurrentX.current
        const threshold = 60
        
        if (Math.abs(diff) > threshold) {
            const direction = diff > 0 ? 1 : -1
            changeMonth(direction)
        } else {
            setDragOffset(0)
        }
    }

    // Для мыши (десктоп)
    const handleMouseDown = (e) => {
        if (isAnimating) return
        setIsDragging(true)
        touchStartX.current = e.clientX
        touchCurrentX.current = e.clientX
        setDragOffset(0)
    }

    const handleMouseMove = (e) => {
        if (!isDragging || isAnimating) return
        touchCurrentX.current = e.clientX
        const diff = touchStartX.current - touchCurrentX.current
        const maxDrag = 200
        const clampedDiff = Math.max(-maxDrag, Math.min(maxDrag, diff))
        setDragOffset(-clampedDiff)
    }

    const handleMouseUp = () => {
        if (!isDragging) return
        setIsDragging(false)
        
        const diff = touchStartX.current - touchCurrentX.current
        const threshold = 60
        
        if (Math.abs(diff) > threshold) {
            const direction = diff > 0 ? 1 : -1
            changeMonth(direction)
        } else {
            setDragOffset(0)
        }
    }

    const handleMouseLeave = () => {
        if (isDragging) {
            setIsDragging(false)
            setDragOffset(0)
        }
    }

    const handleModeChange = (newMode) => {
        setMode(newMode)
        if (onModeChange) {
            onModeChange(newMode)
        }
        const today = new Date()
        onDateSelect(today)
        setDisplayDate(today)
        setCurrentDate(today)
        setDragOffset(0)
    }

    const handleDayClick = (date) => {
        onDateSelect(date)
        if (onDayClick) {
            onDayClick(date, mode)
        }
    }

    // Вычисляем прогресс свайпа (от -1 до 1)
    const maxDrag = 200
    const progress = Math.max(-1, Math.min(1, dragOffset / maxDrag))

    // Стили для трёх панелей
    const getContainerStyle = () => {
        if (isDragging) {
            const translateX = dragOffset
            return {
                transform: `translateX(${translateX}px)`,
                transition: 'none',
                position: 'relative',
                display: 'flex',
                width: '100%',
                overflow: 'visible'
            }
        }
        if (isAnimating) {
            return {
                transform: 'translateX(0)',
                transition: 'transform 0.3s ease',
                position: 'relative',
                display: 'flex',
                width: '100%',
                overflow: 'visible'
            }
        }
        return {
            transform: 'translateX(0)',
            transition: 'transform 0.3s ease',
            position: 'relative',
            display: 'flex',
            width: '100%',
            overflow: 'visible'
        }
    }

    // Если не в режиме drag — просто показываем текущий месяц
    if (!isDragging && !isAnimating) {
        return (
            <div 
                className="calendar-wrapper"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                style={{ userSelect: isDragging ? 'none' : 'auto', overflow: 'hidden' }}
            >
                <ViewModeButtons mode={mode} onChange={handleModeChange} />
                
                <div className="calendar-header">
                    <button className="calendar-nav-btn" onClick={handlePrev}>‹</button>
                    <span className="month-title">{getTitle(displayDate)}</span>
                    <button className="calendar-nav-btn" onClick={handleNext}>›</button>
                </div>
                
                <div className="calendar-slide-container">
                    <CalendarGrid
                        days={days}
                        selectedDate={selectedDate}
                        onDayClick={handleDayClick}
                        shifts={shifts}
                        mode={mode}
                    />
                </div>
            </div>
        )
    }

    // Режим drag — показываем три панели с параллаксом
    return (
        <div 
            className="calendar-wrapper"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ userSelect: 'none', overflow: 'hidden' }}
        >
            <ViewModeButtons mode={mode} onChange={handleModeChange} />
            
            <div className="calendar-header">
                <button className="calendar-nav-btn" onClick={handlePrev}>‹</button>
                <span className="month-title">{getTitle(displayDate)}</span>
                <button className="calendar-nav-btn" onClick={handleNext}>›</button>
            </div>
            
            <div 
                className="calendar-slide-container"
                style={{
                    position: 'relative',
                    display: 'flex',
                    width: '100%',
                    overflow: 'hidden',
                    ...getContainerStyle()
                }}
            >
                {/* Предыдущий месяц (слева) */}
                <div 
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        transform: `translateX(${100 + progress * 50}%)`,
                        opacity: Math.min(1, Math.abs(progress) * 2),
                        transition: isDragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
                        pointerEvents: 'none'
                    }}
                >
                    <CalendarGrid
                        days={prevDays}
                        selectedDate={selectedDate}
                        onDayClick={() => {}}
                        shifts={shifts}
                        mode={mode}
                        isGhost={true}
                    />
                </div>

                {/* Текущий месяц (центр) */}
                <div 
                    style={{
                        width: '100%',
                        flexShrink: 0,
                        transform: `translateX(${progress * 50}%)`,
                        transition: isDragging ? 'none' : 'transform 0.3s ease',
                        opacity: 1
                    }}
                >
                    <CalendarGrid
                        days={days}
                        selectedDate={selectedDate}
                        onDayClick={handleDayClick}
                        shifts={shifts}
                        mode={mode}
                    />
                </div>

                {/* Следующий месяц (справа) */}
                <div 
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: '-100%',
                        width: '100%',
                        transform: `translateX(-${100 - progress * 50}%)`,
                        opacity: Math.min(1, Math.abs(progress) * 2),
                        transition: isDragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
                        pointerEvents: 'none'
                    }}
                >
                    <CalendarGrid
                        days={nextDays}
                        selectedDate={selectedDate}
                        onDayClick={() => {}}
                        shifts={shifts}
                        mode={mode}
                        isGhost={true}
                    />
                </div>
            </div>
        </div>
    )
}
