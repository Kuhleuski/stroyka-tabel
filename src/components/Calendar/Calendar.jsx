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
    
    // Состояния для drag-свайпа
    const [dragOffset, setDragOffset] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)
    const [animationDirection, setAnimationDirection] = useState('')
    
    const isFirstRender = useRef(true)
    const touchStartX = useRef(0)
    const touchCurrentX = useRef(0)
    const dragStartDate = useRef(null)

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

    const getDays = (date) => {
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

    const getTitle = (date) => {
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
        setAnimationDirection(direction > 0 ? 'slide-left' : 'slide-right')
        
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
            setAnimationDirection('')
            if (callback) callback()
        }, 300)
    }

    const handlePrev = () => changeMonth(-1)
    const handleNext = () => changeMonth(1)

    // === DRAG-СВАЙП ===
    const handleTouchStart = (e) => {
        if (isAnimating) return
        setIsDragging(true)
        touchStartX.current = e.touches[0].clientX
        touchCurrentX.current = e.touches[0].clientX
        dragStartDate.current = new Date(displayDate)
        setDragOffset(0)
    }

    const handleTouchMove = (e) => {
        if (!isDragging || isAnimating) return
        
        touchCurrentX.current = e.touches[0].clientX
        const diff = touchStartX.current - touchCurrentX.current
        
        // Ограничиваем drag, чтобы не улетал слишком далеко
        const maxDrag = 150
        const clampedDiff = Math.max(-maxDrag, Math.min(maxDrag, diff))
        setDragOffset(-clampedDiff)
    }

    const handleTouchEnd = (e) => {
        if (!isDragging) return
        setIsDragging(false)
        
        const diff = touchStartX.current - touchCurrentX.current
        const threshold = 60 // Минимальное расстояние для свайпа
        
        if (Math.abs(diff) > threshold) {
            // Резкий свайп — перелистываем
            const direction = diff > 0 ? 1 : -1
            changeMonth(direction)
        } else {
            // Возвращаем на место
            setDragOffset(0)
        }
    }

    // Для мыши (десктоп)
    const handleMouseDown = (e) => {
        if (isAnimating) return
        setIsDragging(true)
        touchStartX.current = e.clientX
        touchCurrentX.current = e.clientX
        dragStartDate.current = new Date(displayDate)
        setDragOffset(0)
    }

    const handleMouseMove = (e) => {
        if (!isDragging || isAnimating) return
        
        touchCurrentX.current = e.clientX
        const diff = touchStartX.current - touchCurrentX.current
        const maxDrag = 150
        const clampedDiff = Math.max(-maxDrag, Math.min(maxDrag, diff))
        setDragOffset(-clampedDiff)
    }

    const handleMouseUp = (e) => {
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

    // Очистка при уходе мыши за пределы
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

    // Стиль для drag-анимации
    const getSlideStyle = () => {
        if (isDragging) {
            return {
                transform: `translateX(${dragOffset}px)`,
                transition: 'none',
                opacity: 1
            }
        }
        if (isAnimating) {
            return {
                transform: `translateX(${animationDirection === 'slide-left' ? '-30px' : '30px'})`,
                transition: 'transform 0.3s ease, opacity 0.3s ease',
                opacity: 0.7
            }
        }
        return {
            transform: 'translateX(0)',
            transition: 'transform 0.3s ease, opacity 0.3s ease',
            opacity: 1
        }
    }

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
            style={{ userSelect: isDragging ? 'none' : 'auto' }}
        >
            <ViewModeButtons mode={mode} onChange={handleModeChange} />
            
            <div className="calendar-header">
                <button className="calendar-nav-btn" onClick={handlePrev}>‹</button>
                <span className="month-title">{getTitle(displayDate)}</span>
                <button className="calendar-nav-btn" onClick={handleNext}>›</button>
            </div>
            
            <div 
                className="calendar-slide-container"
                style={getSlideStyle()}
            >
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
