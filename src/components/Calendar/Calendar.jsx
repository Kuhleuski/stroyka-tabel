import { useState, useEffect, useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ViewModeButtons } from './ViewModeButtons'
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
    
    // Группируем по объектам
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
    
    // Формируем HTML с каждой строкой
    let rowsHtml = ''
    if (hasWork) {
        const siteEntries = Object.entries(sitesMap)
        siteEntries.forEach(([siteName, workers]) => {
            const workersStr = workers.map(w => `${w.name}(${w.hours}ч)`).join(' ')
            rowsHtml += `<div class="feed-site-row">📍 ${siteName}: ${workersStr}</div>`
        })
    } else {
        rowsHtml = `<div class="feed-site-row feed-empty">— нет смен</div>`
    }
    
    return (
        <div 
            className={`feed-item ${today ? 'today' : ''} ${selected ? 'selected' : ''}`}
            onClick={() => onDayClick(day.date)}
            data-date={day.date.toISOString().split('T')[0]}
        >
            <div className="feed-date-block">
                <div className="feed-date-full">{dateStr}</div>
                {today && <div className="feed-today-badge">Сегодня</div>}
            </div>
            <div 
                className="feed-info-block"
                dangerouslySetInnerHTML={{ __html: rowsHtml }}
            />
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

export function Calendar({ 
    shifts, 
    selectedDate, 
    onDateSelect, 
    onDayClick,
    mode: externalMode,
    onModeChange,
    isReturning,
    savedScrollTop
}) {
    const [mode, setMode] = useState(externalMode || 'month')
    const [displayDate, setDisplayDate] = useState(new Date())
    const [allDays, setAllDays] = useState([])
    const containerRef = useRef(null)
    const isFirstRender = useRef(true)
    const isRestoring = useRef(false)
    const virtualizerRef = useRef(null)
    const [shouldShowToday, setShouldShowToday] = useState(true)
    const [hasRestored, setHasRestored] = useState(false)

    // === КОНСТАНТЫ: 5 лет назад + 3 года вперёд = 8 лет ===
    const YEARS_BACK = 5
    const YEARS_FORWARD = 3

    // === ГЕНЕРАЦИЯ ДНЕЙ ===
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
        if (index === 0) return 44 + 20
        const prevDay = allDays[index - 1]
        const hasDivider = day.month !== prevDay.month || day.year !== prevDay.year
        return hasDivider ? 44 + 20 : 44
    }, [allDays])

    const virtualizer = useVirtualizer({
        count: allDays.length,
        getScrollElement: () => containerRef.current,
        estimateSize: (index) => getItemHeight(index),
        overscan: 30,
        onChange: (instance) => {
            virtualizerRef.current = instance
        }
    })

    // === ИНИЦИАЛИЗАЦИЯ ===
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            const today = new Date()
            onDateSelect(today)
            setDisplayDate(today)
            initFeed(today)
        }
    }, [initFeed, onDateSelect])

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

    // === ПОКАЗАТЬ СЕГОДНЯ ПО ЦЕНТРУ (только при первом переходе) ===
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

    // === СБРОС ФЛАГОВ ПРИ ПЕРЕКЛЮЧЕНИИ ===
    useEffect(() => {
        if (mode !== 'feed') {
            setShouldShowToday(true)
            setHasRestored(false)
        }
    }, [mode])

    // === СОХРАНЯЕМ ИНДЕКС ПРИ СКРОЛЛЕ ===
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
        } else if (mode === 'feed') {
            const centerDate = new Date(displayDate)
            centerDate.setDate(centerDate.getDate() + direction * 30)
            initFeed(centerDate)
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
            onModeChange(newMode, null)
        }
        const today = new Date()
        onDateSelect(today)
        setDisplayDate(today)
        isRestoring.current = false
        
        if (newMode === 'feed') {
            initFeed(today)
            setShouldShowToday(true)
        }
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
                            const hasWork = dayShifts.length > 0
                            const today = isToday(day.date)
                            const selected = isSelected(day.date)

                            return (
                                <div
                                    key={index}
                                    className={`day-cell ${today ? 'today' : ''} ${selected ? 'selected' : ''} ${hasWork ? 'has-work' : ''}`}
                                    onClick={() => handleDayClick(day.date)}
                                >
                                    <div className="day-number">{day.day}</div>
                                    {hasWork && <div className="day-dot"></div>}
                                    {dayShifts.length > 0 && (
                                        <div className="day-count">{dayShifts.length}</div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </>
    )
}
