// src/components/Calendar/Calendar.jsx

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { MONTHS, getMonthDays, formatDateLocal, isToday as isTodayUtil } from '../../utils/dateHelpers'
import styles from '../../styles/calendar.module.css'

// Компонент одного дня в ленте
const FeedItem = ({ day, shifts, selectedDate, onDayClick, getDayShifts, isSelected, isToday }) => {
    const dayShifts = getDayShifts(day.date)
    const hasWork = dayShifts.length > 0
    const today = isToday(day.date)
    const selected = isSelected(day.date)
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    
    const dayName = dayNames[day.date.getDay()]
    const dateStr = `${String(day.date.getDate()).padStart(2, '0')}.${String(day.date.getMonth() + 1).padStart(2, '0')} ${dayName}`
    
    const sitesMap = {}
    dayShifts.forEach(s => {
        if (!sitesMap[s.site_name]) {
            sitesMap[s.site_name] = []
        }
        sitesMap[s.site_name].push({
            name: s.worker_name,
            hours: s.hours
        })
    })
    
    return (
        <div 
            className={`${styles.feedItem} ${today ? styles.today : ''} ${selected ? styles.selected : ''}`}
            onClick={() => onDayClick(day.date)}
            data-date={formatDateLocal(day.date)}
            style={{ display: 'block', width: '100%' }}
        >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ 
                    minWidth: '52px', 
                    paddingRight: '8px', 
                    borderRight: '1px solid #e8eaed',
                    textAlign: 'center',
                    flexShrink: 0
                }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: today ? '#2d7d46' : '#1a1a1a' }}>
                        {dateStr}
                    </div>
                    {today && <div style={{ fontSize: '7px', background: '#2d7d46', color: 'white', padding: '0px 5px', borderRadius: '8px', fontWeight: '700', marginTop: '2px' }}>Сегодня</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    {hasWork ? (
                        Object.entries(sitesMap).map(([siteName, workers]) => {
                            const workersStr = workers.map(w => `${w.name}(${w.hours}ч)`).join(' ')
                            return (
                                <div key={siteName} style={{ 
                                    fontSize: '12px', 
                                    color: '#333', 
                                    padding: '2px 0',
                                    lineHeight: '1.5',
                                    borderBottom: '0px solid #f0f0f0',
                                    wordBreak: 'break-word'
                                }}>
                                    📍 {siteName}: {workersStr}
                                </div>
                            )
                        })
                    ) : (
                        <div style={{ fontSize: '12px', color: '#ccc', padding: '2px 0' }}>— нет смен</div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Разделитель месяцев
const MonthDivider = ({ month, year }) => {
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    return (
        <div className={styles.feedMonthDivider}>
            <span className={styles.feedMonthLabel}>{monthNames[month]} {year}</span>
        </div>
    )
}

// ============================================================
// КОМПОНЕНТ ДНЯ С ЦВЕТАМИ (ЧЕТКИЕ СЕКЦИИ)
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
    onDayClick,
    mode: externalMode,
    onModeChange,
    isReturning,
    savedScrollTop
}) {
    const [mode, setMode] = useState(externalMode || 'month')
    const [displayDate, setDisplayDate] = useState(selectedDate || new Date())
    const [allDays, setAllDays] = useState([])
    const containerRef = useRef(null)
    const isRestoring = useRef(false)
    const virtualizerRef = useRef(null)
    const [shouldShowToday, setShouldShowToday] = useState(true)
    const [hasRestored, setHasRestored] = useState(false)
    
    // === ДЛЯ СВАЙПА ===
    const touchStartX = useRef(0)
    const touchStartY = useRef(0)
    const isSwiping = useRef(false)
    const [translateX, setTranslateX] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)

    // === КЕШ МЕСЯЦЕВ ===
    const monthsCache = useRef({})
    
    // === КОМПОНЕНТ МЕСЯЦА ДЛЯ СЛАЙДЕРА ===
    const MonthView = ({ year, month, isVisible }) => {
        const days = getMonthDays(year, month)
        
        return (
            <div className={`${styles.monthSlide} ${isVisible ? styles.monthSlideActive : ''}`}>
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
        )
    }

    // === ПРЕДЗАГРУЗКА МЕСЯЦЕВ ===
    const preloadMonths = useCallback((centerYear, centerMonth) => {
        const months = []
        const range = 2 // 2 месяца вперёд и назад
        
        for (let i = -range; i <= range; i++) {
            const date = new Date(centerYear, centerMonth + i, 1)
            const key = `${date.getFullYear()}-${date.getMonth()}`
            
            // Генерируем и кешируем
            if (!monthsCache.current[key]) {
                monthsCache.current[key] = {
                    year: date.getFullYear(),
                    month: date.getMonth(),
                    days: getMonthDays(date.getFullYear(), date.getMonth())
                }
            }
            
            months.push(monthsCache.current[key])
        }
        
        return months
    }, [])

    // === СОСТОЯНИЕ ДЛЯ СЛАЙДЕРА ===
    const [months, setMonths] = useState([])
    const [currentIndex, setCurrentIndex] = useState(2) // Индекс текущего месяца (всегда 2, т.к. 2 месяца назад)

    // === ИНИЦИАЛИЗАЦИЯ ===
    useEffect(() => {
        const initialDate = selectedDate || new Date()
        const year = initialDate.getFullYear()
        const month = initialDate.getMonth()
        
        setDisplayDate(initialDate)
        const preloaded = preloadMonths(year, month)
        setMonths(preloaded)
        setCurrentIndex(2)
    }, [])

    // === ОБНОВЛЕНИЕ ПРИ СМЕНЕ ДАТЫ ===
    useEffect(() => {
        if (selectedDate) {
            const year = selectedDate.getFullYear()
            const month = selectedDate.getMonth()
            
            setDisplayDate(selectedDate)
            if (mode === 'month') {
                const preloaded = preloadMonths(year, month)
                setMonths(preloaded)
                setCurrentIndex(2)
            }
        }
    }, [selectedDate, mode, preloadMonths])

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

    const getItemHeight = useCallback((index) => {
        const day = allDays[index]
        if (!day) return 44
        const dayShifts = shifts.filter(s => s.work_date === formatDateLocal(day.date))
        const rows = dayShifts.length > 0 ? Object.keys(dayShifts.reduce((acc, s) => {
            acc[s.site_name] = true
            return acc
        }, {})).length : 1
        const baseHeight = 36
        const rowHeight = 24
        const dividerHeight = 20
        if (index === 0) return baseHeight + rows * rowHeight + dividerHeight
        const prevDay = allDays[index - 1]
        const hasDivider = day.month !== prevDay.month || day.year !== prevDay.year
        return baseHeight + rows * rowHeight + (hasDivider ? dividerHeight : 0)
    }, [allDays, shifts])

    const virtualizer = useVirtualizer({
        count: allDays.length,
        getScrollElement: () => containerRef.current,
        estimateSize: (index) => getItemHeight(index),
        overscan: 30,
        onChange: (instance) => {
            virtualizerRef.current = instance
        }
    })

    useEffect(() => {
        if (mode !== 'feed' || allDays.length === 0) return
        if (!isReturning || savedScrollTop === undefined || savedScrollTop === null || hasRestored) return

        const container = containerRef.current
        if (!container) return

        isRestoring.current = true
        container.scrollTop = savedScrollTop
        setHasRestored(true)
        
        setTimeout(() => {
            isRestoring.current = false
        }, 100)
    }, [mode, allDays, isReturning, savedScrollTop, hasRestored])

    useEffect(() => {
        if (mode !== 'feed' || allDays.length === 0) return
        if (!shouldShowToday || isReturning) return
        if (hasRestored) return

        const today = new Date()
        const dateStr = formatDateLocal(today)
        const index = allDays.findIndex(d => 
            formatDateLocal(d.date) === dateStr
        )
        
        if (index !== -1) {
            isRestoring.current = true
            virtualizer.scrollToIndex(index, { align: 'center', behavior: 'auto' })
            setTimeout(() => {
                isRestoring.current = false
                setShouldShowToday(false)
            }, 150)
        }
    }, [mode, allDays, shouldShowToday, isReturning, virtualizer, hasRestored])

    useEffect(() => {
        if (mode !== 'feed') {
            setShouldShowToday(true)
            setHasRestored(false)
        }
    }, [mode])

    const handleScroll = useCallback(() => {
        if (!virtualizerRef.current || isRestoring.current) return
        
        const virtualItems = virtualizerRef.current.getVirtualItems()
        if (virtualItems.length > 0) {
            const firstVisibleIndex = virtualItems[0].index
            if (onModeChange) {
                onModeChange(mode, firstVisibleIndex)
            }
        }
    }, [mode, onModeChange])

    useEffect(() => {
        const container = containerRef.current
        if (!container || mode !== 'feed') return

        container.addEventListener('scroll', handleScroll)
        return () => container.removeEventListener('scroll', handleScroll)
    }, [mode, handleScroll])

    const shouldShowMonthDivider = (day, index) => {
        if (index === 0) return true
        const prevDay = allDays[index - 1]
        return day.month !== prevDay.month || day.year !== prevDay.year
    }

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

    // === ПЕРЕКЛЮЧЕНИЕ МЕСЯЦА В СЛАЙДЕРЕ ===
    const changeMonth = useCallback((direction) => {
        if (isAnimating) return
        
        // Получаем текущий месяц
        const currentMonth = months[currentIndex]
        if (!currentMonth) return
        
        // Вычисляем новый месяц
        const newDate = new Date(currentMonth.year, currentMonth.month + direction, 1)
        const newYear = newDate.getFullYear()
        const newMonth = newDate.getMonth()
        
        // Проверяем, есть ли уже в кеше
        const key = `${newYear}-${newMonth}`
        if (!monthsCache.current[key]) {
            monthsCache.current[key] = {
                year: newYear,
                month: newMonth,
                days: getMonthDays(newYear, newMonth)
            }
        }
        
        // Обновляем массив месяцев
        const newMonths = [...months]
        if (direction === 1) {
            // Вперёд — добавляем справа, удаляем слева
            newMonths.shift()
            newMonths.push(monthsCache.current[key])
        } else {
            // Назад — добавляем слева, удаляем справа
            newMonths.pop()
            newMonths.unshift(monthsCache.current[key])
        }
        
        setMonths(newMonths)
        // currentIndex всегда 2 (индекс текущего месяца в центре)
    }, [months, currentIndex, isAnimating])

    // === ОБРАБОТЧИКИ СВАЙПА ===
    const handleTouchStart = (e) => {
        if (isAnimating || mode === 'feed') return
        touchStartX.current = e.touches[0].clientX
        touchStartY.current = e.touches[0].clientY
        isSwiping.current = false
        setTranslateX(0)
    }

    const handleTouchMove = (e) => {
        if (!touchStartX.current || isAnimating || mode === 'feed') return
        
        const deltaX = e.touches[0].clientX - touchStartX.current
        const deltaY = e.touches[0].clientY - touchStartY.current
        
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            isSwiping.current = true
            e.preventDefault()
            
            const maxOffset = window.innerWidth * 0.4
            const offset = Math.max(-maxOffset, Math.min(maxOffset, deltaX))
            setTranslateX(offset)
        }
    }

    const handleTouchEnd = (e) => {
        if (isAnimating || mode === 'feed') return
        
        const deltaX = e.changedTouches[0].clientX - touchStartX.current
        
        if (Math.abs(deltaX) > 50 && isSwiping.current) {
            setIsAnimating(true)
            const direction = deltaX < 0 ? 1 : -1
            
            // Анимация улетания
            const offset = deltaX < 0 ? -window.innerWidth * 0.3 : window.innerWidth * 0.3
            setTranslateX(offset)
            
            setTimeout(() => {
                changeMonth(direction)
                setTranslateX(0)
                setIsAnimating(false)
            }, 250)
        } else {
            setTranslateX(0)
        }
        
        touchStartX.current = 0
        touchStartY.current = 0
        isSwiping.current = false
    }

    const handleModeChange = (newMode) => {
        setMode(newMode)
        if (onModeChange) {
            onModeChange(newMode, null)
        }
        if (selectedDate) {
            setDisplayDate(selectedDate)
            if (newMode === 'feed') {
                const year = selectedDate.getFullYear()
                const month = selectedDate.getMonth()
                const days = buildFeed(year, month)
                setAllDays(days)
            } else {
                // Для режима месяца — обновляем слайдер
                const year = selectedDate.getFullYear()
                const month = selectedDate.getMonth()
                const preloaded = preloadMonths(year, month)
                setMonths(preloaded)
                setCurrentIndex(2)
            }
        } else {
            const today = new Date()
            onDateSelect(today)
            setDisplayDate(today)
            if (newMode === 'feed') {
                const year = today.getFullYear()
                const month = today.getMonth()
                const days = buildFeed(year, month)
                setAllDays(days)
            } else {
                const year = today.getFullYear()
                const month = today.getMonth()
                const preloaded = preloadMonths(year, month)
                setMonths(preloaded)
                setCurrentIndex(2)
            }
        }
        setShouldShowToday(true)
        isRestoring.current = false
        setTranslateX(0)
        setIsAnimating(false)
    }

    const handleDayClick = (date) => {
        onDateSelect(date)
        if (onDayClick) {
            onDayClick(date, mode)
        }
    }

    // === ПОСТРОЕНИЕ ЛЕНТЫ ДЛЯ FEED ===
    const buildFeed = useCallback((year, month) => {
        const days = []
        const range = 2
        
        for (let i = -range; i <= range; i++) {
            const date = new Date(year, month + i, 1)
            const monthDays = getMonthDays(date.getFullYear(), date.getMonth())
            
            monthDays.forEach(day => {
                if (!day.empty) {
                    days.push({
                        date: day.date,
                        day: day.date.getDate(),
                        month: day.date.getMonth(),
                        year: day.date.getFullYear(),
                        empty: false
                    })
                }
            })
        }
        
        return days
    }, [])

    const feedKey = `feed-${mode}-${allDays.length}`

    return (
        <>
            <div className={`${styles.calendarWrapper} ${mode === 'feed' ? styles.feedMode : ''}`}>
                <div className={styles.calendarHeader}>
                    {mode !== 'feed' && months[currentIndex] && (
                        <span className={styles.monthTitle}>
                            {MONTHS[months[currentIndex].month]} {months[currentIndex].year}
                        </span>
                    )}
                    {mode === 'feed' && (
                        <span className={styles.monthTitle} style={{ visibility: 'hidden' }}>—</span>
                    )}
                </div>
                
                {mode === 'feed' ? (
                    <div 
                        key={feedKey}
                        ref={containerRef}
                        className={styles.feedContainer}
                        style={{ height: '65vh', overflowY: 'auto' }}
                    >
                        <div
                            style={{
                                height: `${virtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {virtualizer.getVirtualItems().map((virtualRow) => {
                                const day = allDays[virtualRow.index]
                                if (!day) return null
                                
                                const showDivider = shouldShowMonthDivider(day, virtualRow.index)
                                
                                return (
                                    <div
                                        key={virtualRow.key}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        {showDivider && (
                                            <MonthDivider month={day.month} year={day.year} />
                                        )}
                                        <FeedItem
                                            day={day}
                                            shifts={shifts}
                                            selectedDate={selectedDate}
                                            onDayClick={handleDayClick}
                                            getDayShifts={getDayShifts}
                                            isSelected={isSelected}
                                            isToday={isToday}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <div 
                        className={styles.calendarSlider}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{
                            transform: `translateX(${translateX}px)`,
                            transition: isAnimating ? 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                            willChange: 'transform'
                        }}
                    >
                        {months.map((monthData, index) => (
                            <div 
                                key={`${monthData.year}-${monthData.month}`}
                                className={`${styles.monthSlide} ${index === currentIndex ? styles.monthSlideCenter : ''}`}
                            >
                                <div className={styles.calendarGrid}>
                                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                                        <div key={day} className={styles.dayLabel}>{day}</div>
                                    ))}
                                    
                                    {monthData.days.map((day, idx) => {
                                        if (day.empty) {
                                            return <div key={`empty-${idx}`} className={`${styles.dayCell} ${styles.empty}`}></div>
                                        }

                                        const dayShifts = getDayShifts(day.date)
                                        const today = isToday(day.date)
                                        const selected = isSelected(day.date)

                                        return (
                                            <DayCell
                                                key={idx}
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
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
