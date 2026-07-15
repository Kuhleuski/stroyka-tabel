import { useState, useEffect, useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ViewModeButtons } from './ViewModeButtons'
import { MONTHS, getMonthDays } from '../../utils/dateHelpers'

// Компонент одного дня в ленте (вынесен для производительности)
const FeedItem = ({ day, shifts, selectedDate, onDayClick, getDayShifts, isSelected, isToday }) => {
    const dayShifts = getDayShifts(day.date)
    const hasWork = dayShifts.length > 0
    const today = isToday(day.date)
    const selected = isSelected(day.date)
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    
    const dayName = dayNames[day.date.getDay()]
    const dateStr = `${String(day.date.getDate()).padStart(2, '0')}.${String(day.date.getMonth() + 1).padStart(2, '0')} ${dayName}`
    
    const sitesMap = {}
    dayShifts.forEach(s => {
        if (!sitesMap[s.site_name]) {
            sitesMap[s.site_name] = []
        }
        sitesMap[s.site_name].push(s.worker_name)
    })
    
    return (
        <div 
            className={`feed-item ${today ? 'today' : ''} ${selected ? 'selected' : ''}`}
            onClick={() => onDayClick(day.date)}
            data-date={day.date.toISOString().split('T')[0]}
        >
            <div className="feed-date">
                <div className="feed-date-full">{dateStr}</div>
                {today && <div className="feed-today-badge">Сегодня</div>}
            </div>
            
            <div className="feed-content">
                {hasWork ? (
                    Object.entries(sitesMap).map(([siteName, workers]) => (
                        <div key={siteName} className="feed-site">
                            <div className="feed-site-name">📍 {siteName}</div>
                            <div className="feed-workers">
                                {workers.map((w, idx) => (
                                    <span key={idx} className="feed-worker">👷 {w}</span>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="feed-empty">— нет смен</div>
                )}
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

export function Calendar({ 
    shifts, 
    selectedDate, 
    onDateSelect, 
    onDayClick,
    mode: externalMode,
    onModeChange,
    returnDate
}) {
    const [mode, setMode] = useState(externalMode || 'month')
    const [displayDate, setDisplayDate] = useState(new Date())
    const [allDays, setAllDays] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const containerRef = useRef(null)
    const isFirstRender = useRef(true)
    const savedIndex = useRef(null) // сохранённый индекс для восстановления
    
    // Генерация дней с учётом смещения
    const generateDays = useCallback((centerDate, count = 100) => {
        const days = []
        const half = Math.floor(count / 2)
        const startDate = new Date(centerDate)
        startDate.setDate(centerDate.getDate() - half)
        
        for (let i = 0; i < count; i++) {
            const d = new Date(startDate)
            d.setDate(startDate.getDate() + i)
            days.push({ 
                date: d, 
                day: d.getDate(), 
                month: d.getMonth(),
                year: d.getFullYear(),
                empty: false 
            })
        }
        return days
    }, [])

    // Инициализация ленты
    const initFeed = useCallback((centerDate, count = 100) => {
        const days = generateDays(centerDate, count)
        setAllDays(days)
    }, [generateDays])

    // Получение дня для виртуализации
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

    // Настройка виртуализатора
    const virtualizer = useVirtualizer({
        count: allDays.length,
        getScrollElement: () => containerRef.current,
        estimateSize: () => 46, // высота одного элемента
        overscan: 10,
        // Сохраняем позицию при скролле
        onChange: (instance) => {
            if (!isLoading) {
                const index = instance.scrollToIndex
                if (index !== undefined && index !== null) {
                    savedIndex.current = index
                }
            }
        }
    })

    // Инициализация при первом рендере
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            const today = new Date()
            onDateSelect(today)
            setDisplayDate(today)
            initFeed(today, 100)
        }
    }, [initFeed, onDateSelect])

    // Восстановление позиции при возврате
    useEffect(() => {
        if (mode === 'feed' && returnDate && allDays.length > 0) {
            // Находим индекс дня
            const dateStr = returnDate.toISOString().split('T')[0]
            const index = allDays.findIndex(d => 
                d.date.toISOString().split('T')[0] === dateStr
            )
            
            if (index !== -1) {
                savedIndex.current = index
                // Скроллим к сохранённому индексу без анимации
                setTimeout(() => {
                    virtualizer.scrollToIndex(index, { align: 'center', behavior: 'auto' })
                }, 50)
            }
        }
    }, [mode, returnDate, allDays, virtualizer])

    // Центрируем на сегодня при переключении на "День"
    useEffect(() => {
        if (mode === 'feed' && allDays.length > 0 && !returnDate) {
            const today = new Date()
            const dateStr = today.toISOString().split('T')[0]
            const index = allDays.findIndex(d => 
                d.date.toISOString().split('T')[0] === dateStr
            )
            
            if (index !== -1) {
                setTimeout(() => {
                    virtualizer.scrollToIndex(index, { align: 'center', behavior: 'auto' })
                }, 50)
            }
        }
    }, [mode, allDays, returnDate, virtualizer])

    // Бесконечная подгрузка
    useEffect(() => {
        const container = containerRef.current
        if (!container || mode !== 'feed') return

        const handleScroll = () => {
            if (isLoading) return
            
            const { scrollTop, scrollHeight, clientHeight } = container
            
            // Если дошли до верха
            if (scrollTop < 50) {
                setIsLoading(true)
                const firstDate = allDays[0]?.date
                if (firstDate) {
                    const newDate = new Date(firstDate)
                    newDate.setDate(newDate.getDate() - 30)
                    const newDays = generateDays(newDate, 30)
                    setAllDays(prev => [...newDays, ...prev])
                    // Корректируем скролл
                    setTimeout(() => {
                        const newHeight = newDays.length * 46
                        container.scrollTop = newHeight + 50
                        setIsLoading(false)
                    }, 50)
                }
                return
            }
            
            // Если дошли до низа
            if (scrollTop + clientHeight >= scrollHeight - 50) {
                setIsLoading(true)
                const lastDate = allDays[allDays.length - 1]?.date
                if (lastDate) {
                    const newDate = new Date(lastDate)
                    newDate.setDate(newDate.getDate() + 1)
                    const newDays = generateDays(newDate, 30)
                    setAllDays(prev => [...prev, ...newDays])
                    setTimeout(() => {
                        setIsLoading(false)
                    }, 50)
                }
            }
        }

        container.addEventListener('scroll', handleScroll)
        return () => container.removeEventListener('scroll', handleScroll)
    }, [allDays, generateDays, isLoading, mode])

    // Функция для определения, нужно ли показывать разделитель месяца
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
            initFeed(centerDate, 100)
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
        
        if (newMode === 'feed') {
            initFeed(today, 100)
        }
    }

    const handleDayClick = (date) => {
        onDateSelect(date)
        if (onDayClick) {
            onDayClick(date, mode)
        }
    }

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
