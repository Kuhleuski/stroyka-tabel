import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAvatars } from '../context/AvatarContext'
import { updateWorkerStatus } from '../services/supabase'
import { formatDateLocal } from '../utils/dateHelpers'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import styles from '../styles/workerStats.module.css'

export function WorkerStatsPage({ worker, shifts, sites, onClose, onEdit, onRefresh }) {
    const { getAvatar } = useAvatars()
    const [activeTab, setActiveTab] = useState('month')
    
    // ✅ Локальный статус — НЕ синхронизируем с worker
    const [status, setStatus] = useState(worker?.status || 'active')
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [periodStart, setPeriodStart] = useState(null)
    const [periodEnd, setPeriodEnd] = useState(null)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [direction, setDirection] = useState(0)
    const [expandedSites, setExpandedSites] = useState(new Set())
    
    const monthKeyRef = useRef(0)
    const isFirstRenderRef = useRef(true)

    console.log('🏗️ [WorkerStatsPage] Монтирование, статус:', status)

    const avatarUrl = getAvatar(worker?.name)
    const hasPhoto = !!avatarUrl
    const initials = worker?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
    const avatarColor = useMemo(() => {
        const colors = ['#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#FDD835', '#FFB300', '#FB8C00', '#F4511E', '#6D4C41', '#78909C']
        const index = (worker?.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return colors[index % colors.length]
    }, [worker?.name])

    // ✅ Лог при изменении статуса
    useEffect(() => {
        console.log('📊 [WorkerStatsPage] status ИЗМЕНИЛСЯ на:', status)
    }, [status])

    // ✅ УБИРАЕМ СИНХРОНИЗАЦИЮ СТАТУСА ИЗ WORKER
    // Больше нет useEffect, который перезаписывает статус

    useEffect(() => {
        if (isFirstRenderRef.current) {
            const timer = setTimeout(() => {
                isFirstRenderRef.current = false
            }, 50)
            return () => clearTimeout(timer)
        }
    }, [])

    const workerShifts = useMemo(() => {
        if (!shifts || !worker) return []
        return shifts.filter(s => s.worker_id === worker.id)
    }, [shifts, worker])

    // ============================================================
    // СТАТУС (SWITCH)
    // ============================================================

    const handleStatusToggle = async () => {
        if (!worker) {
            console.warn('⚠️ [handleStatusToggle] worker отсутствует')
            return
        }
        
        const newStatus = status === 'active' ? 'inactive' : 'active'
        
        console.log('🔄 [handleStatusToggle] ===== НАЧАЛО =====')
        console.log('  📌 Текущий статус:', status)
        console.log('  📌 Новый статус:', newStatus)
        console.log('  📌 worker.id:', worker.id)
        console.log('  📌 worker.name:', worker.name)
        
        // ✅ Меняем статус МГНОВЕННО
        setStatus(newStatus)
        console.log('✅ [handleStatusToggle] Локальный статус обновлён на:', newStatus)
        
        setIsUpdatingStatus(true)

        try {
            console.log('📤 [handleStatusToggle] Отправка запроса в БД...')
            await updateWorkerStatus(worker.id, newStatus)
            console.log('✅ [handleStatusToggle] БД успешно обновлена на:', newStatus)
            
            if (onRefresh) {
                console.log('🔄 [handleStatusToggle] Вызов onRefresh()...')
                await onRefresh()
                console.log('✅ [handleStatusToggle] onRefresh() завершён')
            }
            
            console.log('🏁 [handleStatusToggle] ===== УСПЕШНО ЗАВЕРШЕНО =====')
        } catch (error) {
            console.error('❌ [handleStatusToggle] ОШИБКА:', error)
            setStatus(status)
            console.log('🔙 [handleStatusToggle] Статус откачен на:', status)
            alert('Не удалось обновить статус')
        } finally {
            setIsUpdatingStatus(false)
            console.log('🏁 [handleStatusToggle] isUpdatingStatus = false')
        }
    }

    const toggleSite = (siteId) => {
        const newSet = new Set(expandedSites)
        if (newSet.has(siteId)) {
            newSet.delete(siteId)
        } else {
            newSet.add(siteId)
        }
        setExpandedSites(newSet)
    }

    // ============================================================
    // ОСТАЛЬНОЙ КОД (БЕЗ ИЗМЕНЕНИЙ)
    // ============================================================

    const getMonthData = (monthDate) => {
        const year = monthDate.getFullYear()
        const month = monthDate.getMonth()
        
        const monthShifts = []

        workerShifts.forEach(s => {
            if (!s.work_date) return
            
            const dateStr = s.work_date
            const dateObj = new Date(dateStr + 'T00:00:00')
            
            if (dateObj.getMonth() === month && dateObj.getFullYear() === year) {
                const site = sites?.find(site => site.id === s.site_id)
                const siteName = site?.name || 'Неизвестный объект'
                
                const existing = monthShifts.find(item => item.date === dateStr)
                if (existing) {
                    if (!existing.sites.includes(siteName)) {
                        existing.sites.push(siteName)
                    }
                } else {
                    monthShifts.push({ 
                        date: dateStr, 
                        sites: [siteName],
                        dateObj: dateObj
                    })
                }
            }
        })

        monthShifts.sort((a, b) => a.dateObj - b.dateObj)

        const uniqueSites = new Set()
        monthShifts.forEach(item => {
            item.sites.forEach(site => uniqueSites.add(site))
        })

        return {
            totalDays: monthShifts.length,
            totalSites: uniqueSites.size,
            shifts: monthShifts,
            siteList: Array.from(uniqueSites),
            year,
            month
        }
    }

    const monthData = useMemo(() => {
        return getMonthData(currentMonth)
    }, [currentMonth, workerShifts, sites])

    // ============================================================
    // НАВИГАЦИЯ ПО МЕСЯЦАМ
    // ============================================================

    const canGoPrev = () => {
        const now = new Date()
        const prevMonth = new Date(currentMonth)
        prevMonth.setMonth(prevMonth.getMonth() - 1)
        const yearAgo = new Date(now)
        yearAgo.setFullYear(yearAgo.getFullYear() - 1)
        return prevMonth >= yearAgo
    }

    const goPrevMonth = () => {
        if (!canGoPrev()) return
        setDirection(-1)
        const newMonth = new Date(currentMonth)
        newMonth.setMonth(newMonth.getMonth() - 1)
        setCurrentMonth(newMonth)
        monthKeyRef.current += 1
    }

    const goNextMonth = () => {
        const now = new Date()
        const nextMonth = new Date(currentMonth)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        if (nextMonth > now) return
        setDirection(1)
        const newMonth = new Date(currentMonth)
        newMonth.setMonth(newMonth.getMonth() + 1)
        setCurrentMonth(newMonth)
        monthKeyRef.current += 1
    }

    const monthName = currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
        .replace(' г.', '')
        .split(' ')
        .map((word, index) => index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)
        .join(' ')

    // ============================================================
    // ВКЛАДКА: ПЕРИОД
    // ============================================================

    const getPeriodStats = () => {
        if (!periodStart || !periodEnd) return null

        const start = new Date(periodStart)
        start.setHours(0, 0, 0, 0)
        const end = new Date(periodEnd)
        end.setHours(23, 59, 59, 999)

        const periodShifts = []

        workerShifts.forEach(s => {
            if (!s.work_date) return
            
            const dateStr = s.work_date
            const dateObj = new Date(dateStr + 'T00:00:00')
            
            if (dateObj >= start && dateObj <= end) {
                const site = sites?.find(site => site.id === s.site_id)
                const siteName = site?.name || 'Неизвестный объект'
                
                const existing = periodShifts.find(item => item.date === dateStr)
                if (existing) {
                    if (!existing.sites.includes(siteName)) {
                        existing.sites.push(siteName)
                    }
                } else {
                    periodShifts.push({ 
                        date: dateStr, 
                        sites: [siteName],
                        dateObj: dateObj
                    })
                }
            }
        })

        periodShifts.sort((a, b) => a.dateObj - b.dateObj)

        const uniqueSites = new Set()
        periodShifts.forEach(item => {
            item.sites.forEach(site => uniqueSites.add(site))
        })

        return {
            totalDays: periodShifts.length,
            totalSites: uniqueSites.size,
            shifts: periodShifts,
            siteList: Array.from(uniqueSites)
        }
    }

    const periodStats = getPeriodStats()

    // ============================================================
    // ВКЛАДКА: ОБЪЕКТЫ
    // ============================================================

    const getSiteStats = () => {
        const siteMap = {}
        
        workerShifts.forEach(s => {
            if (!s.work_date) return
            const site = sites?.find(site => site.id === s.site_id)
            if (!site) return
            
            if (!siteMap[site.id]) {
                siteMap[site.id] = {
                    siteId: site.id,
                    siteName: site.name,
                    color: site.color || '#666',
                    dates: []
                }
            }
            siteMap[site.id].dates.push(s.work_date)
        })

        return Object.values(siteMap).map(item => {
            const sortedDates = item.dates.sort()
            const firstDate = sortedDates[0]
            const lastDate = sortedDates[sortedDates.length - 1]
            
            const formatMonthYear = (dateStr) => {
                const parts = dateStr.split('-')
                const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1)
                return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
            }
            
            let periodText = ''
            if (firstDate && lastDate) {
                const firstMonth = formatMonthYear(firstDate)
                const lastMonth = formatMonthYear(lastDate)
                if (firstMonth === lastMonth) {
                    periodText = `Период: ${firstMonth}`
                } else {
                    periodText = `Период: ${firstMonth} - ${lastMonth}`
                }
            }
            
            return {
                ...item,
                dates: sortedDates,
                periodText,
                totalDays: sortedDates.length
            }
        }).sort((a, b) => a.siteName.localeCompare(b.siteName))
    }

    const siteStats = getSiteStats()

    // ============================================================
    // КАЛЕНДАРЬ
    // ============================================================

    const isWorkDay = (date) => {
        const dateStr = formatDateLocal(date)
        return monthData.shifts.some(item => item.date === dateStr)
    }

    const getDaySites = (date) => {
        const dateStr = formatDateLocal(date)
        const dayShifts = monthData.shifts.find(item => item.date === dateStr)
        return dayShifts ? dayShifts.sites : []
    }

    const tileContent = ({ date: tileDate, view }) => {
        if (view !== 'month') return null
        
        const daySites = getDaySites(tileDate)
        if (daySites.length === 0) return null
        
        if (daySites.length > 1) {
            return (
                <div className={styles.extraSitesBadge}>
                    <span className={styles.extraSitesBadgeCircle}>+{daySites.length - 1}</span>
                </div>
            )
        }
        
        return null
    }

    const tileClassName = ({ date: tileDate, view }) => {
        if (view !== 'month') return null
        
        const isToday = formatDateLocal(tileDate) === formatDateLocal(new Date())
        const hasShift = isWorkDay(tileDate)
        
        const classes = []
        if (hasShift) classes.push('work-day')
        if (isToday) classes.push('today-day')
        
        return classes.length > 0 ? classes : null
    }

    const formatDateDisplay = (dateStr) => {
        const parts = dateStr.split('-')
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const formatDateDisplayFull = (dateStr) => {
        const parts = dateStr.split('-')
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    // ============================================================
    // СВАЙП
    // ============================================================

    const handleDragEnd = (event, info) => {
        const threshold = 30
        if (info.offset.x < -threshold) {
            goNextMonth()
        } else if (info.offset.x > threshold) {
            goPrevMonth()
        }
    }

    // ============================================================
    // АНИМАЦИЯ
    // ============================================================

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
            scale: 0.92,
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (direction) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0,
            scale: 0.92,
        }),
    }

    // ============================================================
    // РЕНДЕР
    // ============================================================

    if (!worker) return null

    const shouldAnimate = !isFirstRenderRef.current

    console.log('🎨 [WorkerStatsPage] Рендер, статус:', status, 'isUpdating:', isUpdatingStatus)

    return (
        <div className={styles.workerStatsPage}>
            {/* === ХЕДЕР === */}
            <div className={styles.workerStatsHeader}>
                <div className={styles.workerStatsAvatar}>
                    {hasPhoto ? (
                        <img src={avatarUrl} alt={worker.name} />
                    ) : (
                        <span style={{ background: avatarColor }}>{initials}</span>
                    )}
                </div>

                <div className={styles.workerStatsInfo}>
                    <span className={styles.workerStatsName}>{worker.name}</span>
                    <div className={styles.workerStatsStatus}>
                        <span className={styles.statusLabel}>
                            {status === 'active' ? 'Активен' : 'Не работает'}
                        </span>
                        <button 
                            className={`${styles.switch} ${status === 'active' ? styles.active : ''}`}
                            onClick={handleStatusToggle}
                            disabled={isUpdatingStatus}
                            aria-label="Переключить статус"
                        >
                            <span className={styles.switchSlider} />
                        </button>
                    </div>
                </div>
            </div>

            {/* === ВКЛАДКИ === */}
            <div className={styles.workerStatsTabs}>
                <button 
                    className={`${styles.workerStatsTab} ${activeTab === 'month' ? styles.active : ''}`}
                    onClick={() => setActiveTab('month')}
                >
                    Месяц
                </button>
                <button 
                    className={`${styles.workerStatsTab} ${activeTab === 'sites' ? styles.active : ''}`}
                    onClick={() => setActiveTab('sites')}
                >
                    Объекты
                </button>
                <button 
                    className={`${styles.workerStatsTab} ${activeTab === 'period' ? styles.active : ''}`}
                    onClick={() => setActiveTab('period')}
                >
                    Период
                </button>
            </div>

            {/* === КОНТЕНТ === */}
            <div className={styles.workerStatsContent}>
                {activeTab === 'month' && (
                    <div className={styles.tabContent}>
                        <div className={styles.monthTitle}>{monthName}</div>
                        <div className={styles.monthSubtitle}>В этом месяце:</div>

                        <AnimatePresence mode="popLayout" custom={direction}>
                            <motion.div
                                key={monthKeyRef.current}
                                custom={direction}
                                variants={variants}
                                initial={shouldAnimate ? "enter" : false}
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { 
                                        type: "spring", 
                                        stiffness: 500,
                                        damping: 35,
                                        mass: 0.5
                                    },
                                    opacity: { duration: 0.15 },
                                    scale: { duration: 0.15 }
                                }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.5}
                                dragMomentum={false}
                                onDragEnd={handleDragEnd}
                                className={styles.monthContentMotion}
                            >
                                <div className={styles.statsGrid}>
                                    <div className={styles.statsCard}>
                                        <div className={styles.statsCardNumber}>{monthData.totalDays}</div>
                                        <div className={styles.statsCardLabel}>рабочих дней</div>
                                    </div>
                                </div>

                                <div className={styles.calendarWrapper}>
                                    <Calendar
                                        value={new Date()}
                                        tileClassName={tileClassName}
                                        tileContent={tileContent}
                                        minDetail="month"
                                        maxDetail="month"
                                        prevLabel={null}
                                        nextLabel={null}
                                        next2Label={null}
                                        prev2Label={null}
                                        showNeighboringMonth={false}
                                        navigationLabel={null}
                                        activeStartDate={currentMonth}
                                    />
                                </div>

                                {monthData.shifts.length > 0 && (
                                    <div className={styles.detailStats}>
                                        <div className={styles.detailStatsTitle}>Рабочие дни в этом месяце:</div>
                                        <div className={styles.detailStatsList}>
                                            {monthData.shifts.map(({ date, sites }) => (
                                                <div key={date} className={styles.detailStatsItem}>
                                                    <span className={styles.detailStatsDate}>{formatDateDisplay(date)}</span>
                                                    <span className={styles.detailStatsSites}>{sites.join(', ')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}

                {activeTab === 'sites' && (
                    <div className={styles.tabContent}>
                        <div className={styles.sitesTitle}>
                            Объекты, на которых работал {worker.name} за весь период:
                        </div>
                        
                        {siteStats.length > 0 ? (
                            <div className={styles.sitesList}>
                                {siteStats.map((site) => {
                                    const dayText = site.totalDays === 1 ? 'рабочий день' : 'рабочих дней'
                                    return (
                                        <div key={site.siteId} className={styles.siteAccordion}>
                                            <button 
                                                className={styles.siteAccordionHeader}
                                                onClick={() => toggleSite(site.siteId)}
                                            >
                                                <div className={styles.siteAccordionLeft}>
                                                    <div 
                                                        className={styles.siteAccordionDot}
                                                        style={{ backgroundColor: site.color }}
                                                    />
                                                    <div>
                                                        <div className={styles.siteAccordionName}>{site.siteName}</div>
                                                        <div className={styles.siteAccordionPeriod}>{site.periodText}</div>
                                                        <div className={styles.siteAccordionSub}>
                                                            {site.totalDays} {dayText}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`${styles.siteAccordionArrow} ${expandedSites.has(site.siteId) ? styles.expanded : ''}`}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="6 9 12 15 18 9"/>
                                                    </svg>
                                                </span>
                                            </button>
                                            
                                            {expandedSites.has(site.siteId) && (
                                                <div className={styles.siteAccordionBody}>
                                                    {site.dates.map((date) => (
                                                        <div key={date} className={styles.siteAccordionDate}>
                                                            {formatDateDisplayFull(date)}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>Нет объектов</div>
                        )}
                    </div>
                )}

                {activeTab === 'period' && (
                    <div className={styles.tabContent}>
                        <div className={styles.periodSelector}>
                            <div className={styles.periodField}>
                                <label>С</label>
                                <input 
                                    type="date"
                                    value={periodStart || ''}
                                    onChange={(e) => setPeriodStart(e.target.value)}
                                />
                            </div>
                            <div className={styles.periodField}>
                                <label>По</label>
                                <input 
                                    type="date"
                                    value={periodEnd || ''}
                                    onChange={(e) => setPeriodEnd(e.target.value)}
                                />
                            </div>
                        </div>

                        {periodStats ? (
                            <div className={styles.periodResults}>
                                <div className={styles.statsGrid}>
                                    <div className={styles.statsCard}>
                                        <div className={styles.statsCardNumber}>{periodStats.totalDays}</div>
                                        <div className={styles.statsCardLabel}>рабочих дней</div>
                                    </div>
                                </div>

                                {periodStats.shifts.length > 0 ? (
                                    <div className={styles.detailStats}>
                                        <div className={styles.detailStatsTitle}>Рабочие дни в выбранный период:</div>
                                        <div className={styles.detailStatsList}>
                                            {periodStats.shifts.map(({ date, sites }) => (
                                                <div key={date} className={styles.detailStatsItem}>
                                                    <span className={styles.detailStatsDate}>{formatDateDisplay(date)}</span>
                                                    <span className={styles.detailStatsSites}>{sites.join(', ')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.emptyState}>Нет рабочих дней в выбранный период</div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>Выберите период</div>
                        )}
                    </div>
                )}
            </div>

            {/* === КНОПКИ ВНИЗУ === */}
            <div className={styles.workerStatsFooter}>
                <button 
                    className={styles.workerStatsProfileBtn}
                    onClick={() => onEdit(worker)}
                >
                    Профиль
                </button>
                <button 
                    className={styles.workerStatsCloseBtn}
                    onClick={onClose}
                >
                    Закрыть
                </button>
            </div>
        </div>
    )
}