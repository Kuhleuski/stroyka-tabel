import { useState, useEffect, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
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
    const [key, setKey] = useState(0)
    const [isSwiping, setIsSwiping] = useState(false)
    const isFirstRender = useRef(true)
    const swiperRef = useRef(null)
    const transitionTimer = useRef(null)

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
            setKey(key + 1)
        }
    }, [])

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

    const getPrevDate = () => {
        const date = new Date(displayDate)
        if (mode === 'month') {
            date.setMonth(date.getMonth() - 1)
        } else if (mode === 'week') {
            date.setDate(date.getDate() - 7)
        }
        return date
    }

    const getNextDate = () => {
        const date = new Date(displayDate)
        if (mode === 'month') {
            date.setMonth(date.getMonth() + 1)
        } else if (mode === 'week') {
            date.setDate(date.getDate() + 7)
        }
        return date
    }

    const prevDate = getPrevDate()
    const nextDate = getNextDate()

    const daysCurrent = getDays(displayDate)
    const daysPrev = getDays(prevDate)
    const daysNext = getDays(nextDate)

    const handleSlideChange = (swiper) => {
        const direction = swiper.activeIndex - 1
        
        if (direction === -1) {
            const newDate = new Date(displayDate)
            if (mode === 'month') {
                newDate.setMonth(newDate.getMonth() - 1)
            } else if (mode === 'week') {
                newDate.setDate(newDate.getDate() - 7)
            }
            
            // Плавно обновляем
            clearTimeout(transitionTimer.current)
            transitionTimer.current = setTimeout(() => {
                setDisplayDate(newDate)
                setCurrentDate(newDate)
                setKey(key + 1)
                
                if (mode === 'week') {
                    const weekDays = getWeekDays(newDate)
                    onDateSelect(weekDays[0].date)
                } else {
                    onDateSelect(new Date(selectedDate))
                }
                
                // Возвращаем на центральный слайд БЕЗ анимации
                setTimeout(() => {
                    if (swiperRef.current) {
                        swiperRef.current.slideTo(1, 0)
                    }
                }, 50)
            }, 200)
        } else if (direction === 1) {
            const newDate = new Date(displayDate)
            if (mode === 'month') {
                newDate.setMonth(newDate.getMonth() + 1)
            } else if (mode === 'week') {
                newDate.setDate(newDate.getDate() + 7)
            }
            
            clearTimeout(transitionTimer.current)
            transitionTimer.current = setTimeout(() => {
                setDisplayDate(newDate)
                setCurrentDate(newDate)
                setKey(key + 1)
                
                if (mode === 'week') {
                    const weekDays = getWeekDays(newDate)
                    onDateSelect(weekDays[0].date)
                } else {
                    onDateSelect(new Date(selectedDate))
                }
                
                setTimeout(() => {
                    if (swiperRef.current) {
                        swiperRef.current.slideTo(1, 0)
                    }
                }, 50)
            }, 200)
        }
    }

    const handleSlideChangeTransitionStart = () => {
        setIsSwiping(true)
    }

    const handleSlideChangeTransitionEnd = () => {
        setIsSwiping(false)
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
        setKey(key + 1)
    }

    const handleDayClick = (date) => {
        onDateSelect(date)
        if (onDayClick) {
            onDayClick(date, mode)
        }
    }

    const renderCalendarGrid = (days, isActive = true) => {
        return (
            <CalendarGrid
                days={days}
                selectedDate={selectedDate}
                onDayClick={isActive ? handleDayClick : () => {}}
                shifts={shifts}
                mode={mode}
                isGhost={!isActive}
            />
        )
    }

    return (
        <div className="calendar-wrapper" key={key}>
            <ViewModeButtons mode={mode} onChange={handleModeChange} />
            
            <div className="calendar-header">
                <button 
                    className="calendar-nav-btn" 
                    onClick={() => {
                        const newDate = new Date(displayDate)
                        if (mode === 'month') {
                            newDate.setMonth(newDate.getMonth() - 1)
                        } else if (mode === 'week') {
                            newDate.setDate(newDate.getDate() - 7)
                        }
                        setDisplayDate(newDate)
                        setCurrentDate(newDate)
                        if (mode === 'week') {
                            const weekDays = getWeekDays(newDate)
                            onDateSelect(weekDays[0].date)
                        } else {
                            onDateSelect(new Date(selectedDate))
                        }
                    }}
                >
                    ‹
                </button>
                <span className="month-title">{getTitle(displayDate)}</span>
                <button 
                    className="calendar-nav-btn" 
                    onClick={() => {
                        const newDate = new Date(displayDate)
                        if (mode === 'month') {
                            newDate.setMonth(newDate.getMonth() + 1)
                        } else if (mode === 'week') {
                            newDate.setDate(newDate.getDate() + 7)
                        }
                        setDisplayDate(newDate)
                        setCurrentDate(newDate)
                        if (mode === 'week') {
                            const weekDays = getWeekDays(newDate)
                            onDateSelect(weekDays[0].date)
                        } else {
                            onDateSelect(new Date(selectedDate))
                        }
                    }}
                >
                    ›
                </button>
            </div>

            <Swiper
                onSwiper={(swiper) => {
                    swiperRef.current = swiper
                }}
                slidesPerView={1}
                onSlideChange={handleSlideChange}
                onSlideChangeTransitionStart={handleSlideChangeTransitionStart}
                onSlideChangeTransitionEnd={handleSlideChangeTransitionEnd}
                initialSlide={1}
                // === КЛЮЧЕВЫЕ НАСТРОЙКИ ДЛЯ ПЛАВНОСТИ ===
                touchRatio={0.8}          // Чувствительность свайпа
                touchAngle={45}           // Угол для свайпа
                resistance={true}         // Сопротивление на краях
                resistanceRatio={0.5}     // Сила сопротивления
                speed={400}               // Скорость анимации (мс)
                threshold={3}             // Минимальное движение для активации
                followFinger={true}       // Следить за пальцем
                freeMode={false}          // Отключаем свободный режим
                freeModeMomentum={false}  // Отключаем инерцию
                className="calendar-swiper"
            >
                <SwiperSlide>
                    {renderCalendarGrid(daysPrev, false)}
                </SwiperSlide>
                <SwiperSlide>
                    {renderCalendarGrid(daysCurrent, true)}
                </SwiperSlide>
                <SwiperSlide>
                    {renderCalendarGrid(daysNext, false)}
                </SwiperSlide>
            </Swiper>
        </div>
    )
}
