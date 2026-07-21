import { useState, useEffect, useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { MONTHS, getMonthDays } from '../../utils/dateHelpers'

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
            className={`feed-item ${today ? 'today' : ''} ${selected ? 'selected' : ''}`}
            onClick={() => onDayClick(day.date)}
            data-date={day.date.toISOString().split('T')[0]}
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
        <div className="feed-month-divider">
            <span className="feed-month-label">{monthNames[month]} {year}</span>
        </div>
    )
}

// ============================================================
// КОМПОНЕНТ ДНЯ С ЦВЕТАМИ (ЧЕТКИЕ СЕКЦИИ)
// ============================================================
const DayCell = ({ day, dayShifts, isToday, isSelected, onClick, sites }) => {
    // Получаем уникальные site_id из смен за этот день
    const siteIds = [...new Set(dayShifts.map(s => s.site_id))]
    
    // Получаем цвета для каждого объекта
    const colors = siteIds
        .map(id => {
            const site = sites.find(s => s.id === id)
            return site ? site.color : null
        })
        .filter(c => c !== null)
    
    const hasWork = colors.length > 0
    const showPlus = colors.length > 4
    const displayColors = colors.slice(0, 4)
    
    // Строим CSS для четких секций
    let backgroundStyle = {}
    let numberColor = '#1a1a1a'
    let numberWeight = '500'
    let isSelectedStyle = {}
    
    if (hasWork && !showPlus) {
        const count = displayColors.length
        
        // Если день выбран — делаем цвета очень прозрачными
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
    
    // Если день выбран — добавляем зеленую рамку
    if (isSelected) {
        isSelectedStyle = {
            border: '3px solid #2d7d46'
        }
        numberWeight = '900'  // жирный шрифт
    }

    return (
        <div
            className={`day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
            style={{ ...backgroundStyle, ...isSelectedStyle }}
        >
            <div className="day-number" style={{ color: numberColor, fontWeight: numberWeight }}>{day.day}</div>
            {hasWork && showPlus && (
                <div className="day-plus" style={{ color: '#1a1a1a' }}>+</div>
            )}
            {dayShifts.length > 0 && !hasWork && (
                <div className="day-count">{dayShifts.length}</div>
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

    const YEARS_BACK = 5
    const YEARS_FORWARD = 3

    const generateDays = useCallback((centerDate) => {
        const days = []
        const startDate = new Date(centerDate)
        startDate.setFullYear(startDate.getFullYear() - YEARS_BACK)
        startDate.setDate(startDate.getDate() - 1)
        
        const endDate = new Date(centerDate)
        endDate.setFullYear(endDate.getFullYear() + YEARS_FORWARD)
        endDate.setDate(endDate.getDate() + 1)
        
        let currentDate = new Date(startDate)
        while (currentDate <= endDate) {
            days.push({ 
                date: new Date(currentDate), 
                day: currentDate.getDate(), 
                month: currentDate.getMonth(),
                year: currentDate.getFullYear(),
                empty: false 
            })
            currentDate.setDate(currentDate.getDate() + 1)
        }
        return days
    }, [])

    const initFeed = useCallback((centerDate) => {
        const days = generateDays(centerDate)
        setAllDays(days)
        setHasRestored(false)
    }, [generateDays])

    const getDayShifts = useCallback((date) => {
        const dateStr = date.toISOString().split('T')[0]
        return shifts.filter(s => s.work_date === dateStr)
    }, [shifts])

    const isToday = useCallback((date) => {
        const today = new Date()
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear()
    }, [])

    const isSelected = useCallback((date) => {
        if (!selectedDate) return false
        return date.getDate() === selectedDate.getDate() &&
               date.getMonth() === selectedDate.getMonth() &&
               date.getFullYear() === selectedDate.getFullYear()
    }, [selectedDate])

    const getItemHeight = useCallback((index) => {
        const day = allDays[index]
        if (!day) return 44
        const dayShifts = shifts.filter(s => s.work_date === day.date.toISOString().split('T')[0])
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

    // ИНИЦИАЛИЗАЦИЯ FEED ПРИ ПЕРВОМ РЕНДЕРЕ
    useEffect(() => {
        const initialDate = selectedDate || new Date()
        setDisplayDate(initialDate)
        initFeed(initialDate)
    }, [])

    // ОБНОВЛЕНИЕ ПРИ ИЗМЕНЕНИИ selectedDate ИЗВНЕ
    useEffect(() => {
        if (selectedDate) {
            setDisplayDate(selectedDate)
            if (mode === 'feed') {
                initFeed(selectedDate)
            }
        }
    }, [selectedDate, mode])

    // === ВОССТАНОВЛЕНИЕ ПОЗИЦИИ ===
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

    // === ПОКАЗАТЬ СЕГОДНЯ ПО ЦЕНТРУ ===
    useEffect(() => {
        if (mode !== 'feed' || allDays.length === 0) return
        if (!shouldShowToday || isReturning) return
        if (hasRestored) return

        const today = new Date()
        const dateStr = today.toISOString().split('T')[0]
        const index = allDays.findIndex(d => 
            d.date.toISOString().split('T')[0] === dateStr
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

    // === СБРОС ФЛАГОВ ===
    useEffect(() => {
        if (mode !== 'feed') {
            setShouldShowToday(true)
            setHasRestored(false)
        }
    }, [mode])

    // === СОХРАНЯЕМ ИНДЕКС ===
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

    const changeMonth = (direction) => {
        const newDate = new Date(displayDate)
        if (mode === 'month') {
            newDate.setMonth(newDate.getMonth() + direction)
            setDisplayDate(newDate)
        } else if (mode === 'feed') {
            const centerDate = new Date(displayDate)
            centerDate.setDate(centerDate.getDate() + direction * 30)
            initFeed(centerDate)
            setDisplayDate(centerDate)
        }
    }

    const handlePrev = () => changeMonth(-1)
    const handleNext = () => changeMonth(1)

    const handleModeChange = (newMode) => {
        setMode(newMode)
        if (onModeChange) {
            onModeChange(newMode, null)
        }
        if (selectedDate) {
            setDisplayDate(selectedDate)
            if (newMode === 'feed') {
                initFeed(selectedDate)
            }
        } else {
            const today = new Date()
            onDateSelect(today)
            setDisplayDate(today)
            if (newMode === 'feed') {
                initFeed(today)
            }
        }
        setShouldShowToday(true)
        isRestoring.current = false
    }

    const handleDayClick = (date) => {
        onDateSelect(date)
        if (onDayClick) {
            onDayClick(date, mode)
        }
    }

    const feedKey = `feed-${mode}-${allDays.length}`

    return (
        <>
            {/* Временно скрыто — чипсы переключения режимов */}
            {/* 
            <div className="view-mode-wrapper">
                <ViewModeButtons mode={mode} onChange={handleModeChange} />
            </div>
            */}

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
                
                {mode === 'feed' ? (
                    <div 
                        key={feedKey}
                        ref={containerRef}
                        className="feed-container"
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
                    <div className="calendar-grid">
                        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                            <div key={day} className="day-label">{day}</div>
                        ))}
                        
                        {getMonthDays(displayDate.getFullYear(), displayDate.getMonth()).map((day, index) => {
                            if (day.empty) {
                                return <div key={`empty-${index}`} className="day-cell empty"></div>
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
                )}
            </div>
        </>
    )
}
