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
    const [status, setStatus] = useState(worker?.status || 'active')
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [periodStart, setPeriodStart] = useState(null)
    const [periodEnd, setPeriodEnd] = useState(null)
    const [selectedSiteId, setSelectedSiteId] = useState(null)
    
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [direction, setDirection] = useState(0)
    
    // Ключ для принудительного пересоздания motion.div только при свайпе месяца
    const monthKeyRef = useRef(0)
    const isFirstRenderRef = useRef(true)

    const avatarUrl = getAvatar(worker?.name)
    const hasPhoto = !!avatarUrl
    const initials = worker?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
    const avatarColor = useMemo(() => {
        const colors = ['#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#FDD835', '#FFB300', '#FB8C00', '#F4511E', '#6D4C41', '#78909C']
        const index = (worker?.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return colors[index % colors.length]
    }, [worker?.name])

    // После первого рендера отключаем флаг
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
    // ДАННЫЕ ДЛЯ ВЫБРАННОГО МЕСЯЦА
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
    // НАВИГАЦИЯ ПО МЕСЯЦАМ (только свайп)
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
        // Меняем ключ только при свайпе
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
        // Меняем ключ только при свайпе
        monthKeyRef.current += 1
    }

    const monthName = currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
        .replace(' г.', '')
        .split(' ')
        .map((word, index) => index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)
        .join(' ')

    const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() && 
                           currentMonth.getFullYear() === new Date().getFullYear()

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
                    dates: new Set()
                }
            }
            siteMap[site.id].dates.add(s.work_date)
        })

        return Object.values(siteMap).map(item => ({
            ...item,
            totalDays: item.dates.size
        })).sort((a, b) => b.totalDays - a.totalDays)
    }

    const siteStats = getSiteStats()
    const selectedSite = selectedSiteId 
        ? siteStats.find(s => s.siteId === selectedSiteId)
        : null

    // ============================================================
    // СТАТУС
    // ============================================================

    const handleStatusToggle = async () => {
        if (!worker) return
        const newStatus = status === 'active' ? 'inactive' : 'active'
        setIsUpdatingStatus(true)

        try {
            await updateWorkerStatus(worker.id, newStatus)
            setStatus(newStatus)
            if (onRefresh) onRefresh()
        } catch (error) {
            console.error('Ошибка обновления статуса:', error)
            alert('Не удалось обновить статус')
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    // ============================================================
    // КАЛЕНДАРЬ
    // ============================================================

    const isWorkDay = (date) => {
        const dateStr = formatDateLocal(date)
        return monthData.shifts.some(item => item.date === dateStr)
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

    const getSiteEnding = () => {
        return `объектах`
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

    // Флаг для отключения анимации при первом рендере
    const shouldAnimate = !isFirstRenderRef.current

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
                        <span className={`${styles.statusDot} ${status === 'active' ? styles.active : styles.inactive}`} />
                        <span>{status === 'active' ? 'Активен' : 'Неактивен'}</span>
                        <button 
                            className={styles.statusToggleBtn}
                            onClick={handleStatusToggle}
                            disabled={isUpdatingStatus}
                        >
                            {isUpdatingStatus ? '...' : 'Изменить'}
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
                    className={`${styles.workerStatsTab} ${activeTab === 'period' ? styles.active : ''}`}
                    onClick={() => setActiveTab('period')}
                >
                    Период
                </button>
                <button 
                    className={`${styles.workerStatsTab} ${activeTab === 'sites' ? styles.active : ''}`}
                    onClick={() => setActiveTab('sites')}
                >
                    Объекты
                </button>
            </div>

            {/* === КОНТЕНТ === */}
            <div className={styles.workerStatsContent}>
                {activeTab === 'month' && (
                    <div className={styles.tabContent}>
                        {/* Название месяца */}
                        <div className={styles.monthTitle}>
                            {monthName}
                        </div>

                        {/* Фраза "В этом месяце:" */}
                        <div className={styles.monthSubtitle}>В этом месяце:</div>

                        {/* Весь контент с нативным свайпом */}
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
                                {/* Статистика */}
                                <div className={styles.statsGrid}>
                                    <div className={styles.statsCard}>
                                        <div className={styles.statsCardNumber}>{monthData.totalDays}</div>
                                        <div className={styles.statsCardLabel}>рабочих дней</div>
                                    </div>
                                    <div className={styles.statsCard}>
                                        <div className={styles.statsCardNumber}>{monthData.totalSites}</div>
                                        <div className={styles.statsCardLabel}>
                                            работал на {getSiteEnding()}
                                        </div>
                                    </div>
                                </div>

                                {/* Календарь */}
                                <div className={styles.calendarWrapper}>
                                    <Calendar
                                        value={new Date()}
                                        tileClassName={tileClassName}
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

                                {/* Детальная статистика */}
                                {monthData.shifts.length > 0 && (
                                    <div className={styles.detailStats}>
                                        <div className={styles.detailStatsTitle}>Рабочие дни в этом месяце</div>
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
                                    <div className={styles.statsCard}>
                                        <div className={styles.statsCardNumber}>{periodStats.totalSites}</div>
                                        <div className={styles.statsCardLabel}>
                                            работал на {getSiteEnding()}
                                        </div>
                                    </div>
                                </div>

                                {periodStats.shifts.length > 0 ? (
                                    <div className={styles.detailStats}>
                                        <div className={styles.detailStatsTitle}>Рабочие дни в выбранный период</div>
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

                {activeTab === 'sites' && (
                    <div className={styles.tabContent}>
                        <div className={styles.siteSelector}>
                            <select 
                                value={selectedSiteId || ''}
                                onChange={(e) => setSelectedSiteId(Number(e.target.value) || null)}
                            >
                                <option value="">Выберите объект</option>
                                {sites?.map(site => (
                                    <option key={site.id} value={site.id}>
                                        {site.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedSiteId !== null ? (
                            selectedSite ? (
                                <div className={styles.siteResult}>
                                    <div 
                                        className={styles.siteResultDot}
                                        style={{ backgroundColor: selectedSite.color }}
                                    />
                                    <div className={styles.siteResultInfo}>
                                        <span className={styles.siteResultName}>{selectedSite.siteName}</span>
                                        <span className={styles.siteResultCount}>
                                            {selectedSite.totalDays} рабочих дней
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.emptyState}>На этом объекте работник не работал</div>
                            )
                        ) : (
                            <div className={styles.emptyState}>Выберите объект из списка</div>
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