// src/components/Calendar/Calendar.jsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { MONTHS, getMonthDays, formatDateLocal, isToday as isTodayUtil } from '../../utils/dateHelpers'
import styles from '../../styles/calendar.module.css'

// ============================================================
// КОМПОНЕНТ ДНЯ С ЦВЕТАМИ
// ============================================================
const DayCell = ({ day, dayShifts, isToday, isSelected, onClick, sites }) => {
    const siteIds = [...new Set(dayShifts.map(s => s.site_id))]
    
    const colors = siteIds
        .map(id => {
            const site = sites.find(s => s.id === id)
            return site ? site.color : null
        })
        .filter(c => c !== null)
    
    const hasWork = colors.length > 0
    const showPlus = colors.length > 4
    const displayColors = colors.slice(0, 4)
    
    let backgroundStyle = {}
    let numberColor = '#1a1a1a'
    let numberWeight = '500'
    let isSelectedStyle = {}
    
    if (hasWork && !showPlus) {
        const count = displayColors.length
        const alpha = isSelected ? '30' : 'FF'
        const colorsWithAlpha = displayColors.map(c => c + alpha)
        
        if (count === 1) {
            backgroundStyle = { backgroundColor: colorsWithAlpha[0] }
        } else if (count === 2) {
            backgroundStyle = { 
                background: `conic-gradient(from 0deg, ${colorsWithAlpha[0]} 0deg, ${colorsWithAlpha[0]} 180deg, ${colorsWithAlpha[1]} 180deg, ${colorsWithAlpha[1]} 360deg)`
            }
        } else if (count === 3) {
            backgroundStyle = { 
                background: `conic-gradient(from 0deg, ${colorsWithAlpha[0]} 0deg, ${colorsWithAlpha[0]} 120deg, ${colorsWithAlpha[1]} 120deg, ${colorsWithAlpha[1]} 240deg, ${colorsWithAlpha[2]} 240deg, ${colorsWithAlpha[2]} 360deg)`
            }
        } else if (count === 4) {
            backgroundStyle = { 
                background: `conic-gradient(from 0deg, ${colorsWithAlpha[0]} 0deg, ${colorsWithAlpha[0]} 90deg, ${colorsWithAlpha[1]} 90deg, ${colorsWithAlpha[1]} 180deg, ${colorsWithAlpha[2]} 180deg, ${colorsWithAlpha[2]} 270deg, ${colorsWithAlpha[3]} 270deg, ${colorsWithAlpha[3]} 360deg)`
            }
        }
    } else if (hasWork && showPlus) {
        const count = displayColors.length
        const alpha = isSelected ? '30' : 'FF'
        const colorsWithAlpha = displayColors.map(c => c + alpha)
        
        if (count === 4) {
            backgroundStyle = { 
                background: `conic-gradient(from 0deg, ${colorsWithAlpha[0]} 0deg, ${colorsWithAlpha[0]} 90deg, ${colorsWithAlpha[1]} 90deg, ${colorsWithAlpha[1]} 180deg, ${colorsWithAlpha[2]} 180deg, ${colorsWithAlpha[2]} 270deg, ${colorsWithAlpha[3]} 270deg, ${colorsWithAlpha[3]} 360deg)`
            }
        } else if (count === 3) {
            backgroundStyle = { 
                background: `conic-gradient(from 0deg, ${colorsWithAlpha[0]} 0deg, ${colorsWithAlpha[0]} 120deg, ${colorsWithAlpha[1]} 120deg, ${colorsWithAlpha[1]} 240deg, ${colorsWithAlpha[2]} 240deg, ${colorsWithAlpha[2]} 360deg)`
            }
        } else if (count === 2) {
            backgroundStyle = { 
                background: `conic-gradient(from 0deg, ${colorsWithAlpha[0]} 0deg, ${colorsWithAlpha[0]} 180deg, ${colorsWithAlpha[1]} 180deg, ${colorsWithAlpha[1]} 360deg)`
            }
        } else if (count === 1) {
            backgroundStyle = { backgroundColor: colorsWithAlpha[0] }
        }
    }
    
    if (isSelected) {
        isSelectedStyle = {
            border: '3px solid #2d7d46'
        }
        numberWeight = '900'
    }

    return (
        <div
            className={`${styles.dayCell} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''}`}
            onClick={onClick}
            style={{ ...backgroundStyle, ...isSelectedStyle }}
        >
            <div className={styles.dayNumber} style={{ color: numberColor, fontWeight: numberWeight }}>{day.day}</div>
            {hasWork && showPlus && (
                <div className={styles.dayPlus} style={{ color: '#1a1a1a' }}>+</div>
            )}
            {dayShifts.length > 0 && !hasWork && (
                <div className={styles.dayCount}>{dayShifts.length}</div>
            )}
        </div>
    )
}

export function Calendar({ 
    shifts, 
    sites = [],
    selectedDate, 
    onDateSelect, 
    onDayClick
}) {
    const [displayDate, setDisplayDate] = useState(selectedDate || new Date())
    const wrapperRef = useRef(null)
    
    // === ДЛЯ СВАЙПА ===
    const touchStartX = useRef(0)
    const touchStartY = useRef(0)
    const isSwiping = useRef(false)
    const [translateX, setTranslateX] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [fadeState, setFadeState] = useState('visible') // 'visible' | 'fading' | 'hidden'

    const getDayShifts = useCallback((date) => {
        const dateStr = formatDateLocal(date)
        return shifts.filter(s => s.work_date === dateStr)
    }, [shifts])

    const isToday = useCallback((date) => {
        return isTodayUtil(date)
    }, [])

    const isSelected = useCallback((date) => {
        if (!selectedDate) return false
        return formatDateLocal(date) === formatDateLocal(selectedDate)
    }, [selectedDate])

    const getTitle = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        return `${MONTHS[month]} ${year}`
    }

    const changeMonth = useCallback((direction) => {
        if (isAnimating) return
        
        const newDate = new Date(displayDate)
        newDate.setMonth(newDate.getMonth() + direction)
        
        // Анимация затухания
        setFadeState('fading')
        
        setTimeout(() => {
            setDisplayDate(newDate)
            setFadeState('visible')
        }, 200)
    }, [displayDate, isAnimating])

    // === ОБРАБОТЧИКИ СВАЙПА ===
    const handleTouchStart = (e) => {
        if (isAnimating) return
        touchStartX.current = e.touches[0].clientX
        touchStartY.current = e.touches[0].clientY
        isSwiping.current = false
        setTranslateX(0)
    }

    const handleTouchMove = (e) => {
        if (!touchStartX.current || isAnimating) return
        
        const deltaX = e.touches[0].clientX - touchStartX.current
        const deltaY = e.touches[0].clientY - touchStartY.current
        
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            isSwiping.current = true
            e.preventDefault()
            
            const maxOffset = window.innerWidth * 0.3
            const offset = Math.max(-maxOffset, Math.min(maxOffset, deltaX))
            setTranslateX(offset)
        }
    }

    const handleTouchEnd = (e) => {
        if (isAnimating) return
        
        const deltaX = e.changedTouches[0].clientX - touchStartX.current
        
        if (Math.abs(deltaX) > 50 && isSwiping.current) {
            setIsAnimating(true)
            const direction = deltaX < 0 ? 1 : -1
            
            // Улетаем в сторону свайпа
            const offset = deltaX < 0 ? -window.innerWidth * 0.3 : window.innerWidth * 0.3
            setTranslateX(offset)
            
            setTimeout(() => {
                changeMonth(direction)
                // Возвращаемся на место и убираем анимацию
                setTimeout(() => {
                    setTranslateX(0)
                    setIsAnimating(false)
                }, 50)
            }, 200)
        } else {
            setTranslateX(0)
        }
        
        touchStartX.current = 0
        touchStartY.current = 0
        isSwiping.current = false
    }

    // === ПОДКЛЮЧАЕМ СЛУШАТЕЛИ ===
    useEffect(() => {
        const wrapper = wrapperRef.current
        if (!wrapper) return

        wrapper.addEventListener('touchstart', handleTouchStart, { passive: true })
        wrapper.addEventListener('touchmove', handleTouchMove, { passive: false })
        wrapper.addEventListener('touchend', handleTouchEnd, { passive: true })

        return () => {
            wrapper.removeEventListener('touchstart', handleTouchStart)
            wrapper.removeEventListener('touchmove', handleTouchMove)
            wrapper.removeEventListener('touchend', handleTouchEnd)
        }
    }, [handleTouchStart, handleTouchMove, handleTouchEnd])

    const handleDayClick = (date) => {
        onDateSelect(date)
        if (onDayClick) {
            onDayClick(date, 'month')
        }
    }

    // Получаем дни текущего месяца
    const days = getMonthDays(displayDate.getFullYear(), displayDate.getMonth())

    return (
        <div className={styles.calendarWrapper}>
            <div className={styles.calendarHeader}>
                <span className={styles.monthTitle}>{getTitle(displayDate)}</span>
            </div>

            <div 
                ref={wrapperRef}
                className={styles.calendarGridWrapper}
                style={{
                    transform: `translateX(${translateX}px)`,
                    transition: isAnimating 
                        ? 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)' 
                        : 'none',
                    willChange: 'transform',
                    opacity: fadeState === 'fading' ? 0.6 : 1,
                    transition: isAnimating 
                        ? `transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease`
                        : 'none'
                }}
            >
                <div className={styles.calendarGrid}>
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                        <div key={day} className={styles.dayLabel}>{day}</div>
                    ))}
                    
                    {days.map((day, index) => {
                        if (day.empty) {
                            return <div key={`empty-${index}`} className={`${styles.dayCell} ${styles.empty}`}></div>
                        }

                        const dayShifts = getDayShifts(day.date)
                        const today = isToday(day.date)
                        const selected = isSelected(day.date)

                        return (
                            <DayCell
                                key={index}
                                day={day}
                                dayShifts={dayShifts}
                                isToday={today}
                                isSelected={selected}
                                sites={sites}
                                onClick={() => handleDayClick(day.date)}
                            />
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
