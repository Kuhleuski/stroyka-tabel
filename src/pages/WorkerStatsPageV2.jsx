// src/pages/WorkerStatsPageV2.jsx

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAvatars } from '../context/AvatarContext'
import { updateWorkerStatus } from '../services/supabase'
import { formatDateLocal } from '../utils/dateHelpers'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import styles from '../styles/workerStatsV2.module.css'
import { WorkerStatsFooter } from '../components/WorkerStatsFooter'

export function WorkerStatsPageV2({ worker, shifts, sites, archivedSites = [], onClose, onEdit, onRefresh }) {
    const { getAvatar } = useAvatars()
    const [status, setStatus] = useState(worker?.status || 'active')
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [expandedSites, setExpandedSites] = useState(new Set())
    const [isDetailVisible, setIsDetailVisible] = useState(true)

    // Аккордеоны нижних секций
    const [openQuarter, setOpenQuarter] = useState(false)
    const [openAll, setOpenAll] = useState(false)
    const [openSalary, setOpenSalary] = useState(false)
    const [showAllPeriodInSites, setShowAllPeriodInSites] = useState(false)

    // Меню действий
    const [showActions, setShowActions] = useState(false)
    const actionsRef = useRef(null)

    const [direction, setDirection] = useState(0)
    const monthKeyRef = useRef(0)
    const isFirstRenderRef = useRef(true)
    const detailTimerRef = useRef(null)

    const avatarUrl = getAvatar(worker?.name)
    const hasPhoto = !!avatarUrl
    const initials = worker?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
    const avatarColor = useMemo(() => {
        const colors = ['#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#FDD835', '#FFB300', '#FB8C00', '#F4511E', '#6D4C41', '#78909C']
        const index = (worker?.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return colors[index % colors.length]
    }, [worker?.name])

    const allSites = useMemo(() => [...sites, ...archivedSites], [sites, archivedSites])

    const workerShifts = useMemo(() => {
        if (!shifts || !worker) return []
        return shifts.filter(s => s.worker_id === worker.id)
    }, [shifts, worker])

    // Закрытие меню действий по клику вне
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (actionsRef.current && !actionsRef.current.contains(e.target)) {
                setShowActions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (isFirstRenderRef.current) {
            const t = setTimeout(() => { isFirstRenderRef.current = false }, 50)
            return () => clearTimeout(t)
        }
    }, [])

    useEffect(() => {
        return () => {
            if (detailTimerRef.current) clearTimeout(detailTimerRef.current)
        }
    }, [])

    const getDaysLabel = (count) => {
        if (count === 0) return 'рабочих дней'
        const d = count % 10
        const dd = count % 100
        if (dd >= 11 && dd <= 19) return 'рабочих дней'
        if (d === 1) return 'рабочий день'
        if (d >= 2 && d <= 4) return 'рабочих дня'
        return 'рабочих дней'
    }

    const formatDateShort = (dateStr) => {
        if (!dateStr) return ''
        const d = new Date(dateStr + 'T00:00:00')
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    const getMonthPrepositional = (date) => {
        const months = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре']
        return months[date.getMonth()]
    }

    // === МЕСЯЦ ===
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1, 0, 0, 0, 0)
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999)

    const monthShifts = useMemo(() => {
        const map = {}
        workerShifts.forEach(s => {
            if (!s.work_date) return
            const d = new Date(s.work_date + 'T00:00:00')
            if (d < monthStart || d > monthEnd) return
            const site = allSites.find(x => x.id === s.site_id)
            if (!map[s.work_date]) map[s.work_date] = []
            map[s.work_date].push({
                siteId: site?.id || null,
                siteName: site?.name || 'Неизвестный объект',
                color: site?.color || '#666'
            })
        })
        return map
    }, [workerShifts, allSites, currentMonth])

    const monthTotalDays = Object.keys(monthShifts).length

    const monthSiteStats = useMemo(() => {
        const map = {}
        Object.entries(monthShifts).forEach(([date, items]) => {
            items.forEach(item => {
                const key = item.siteId || item.siteName
                if (!map[key]) map[key] = { siteId: item.siteId, siteName: item.siteName, color: item.color, dates: [] }
                map[key].dates.push(date)
            })
        })
        return Object.values(map)
            .map(item => ({ ...item, dates: [...new Set(item.dates)].sort(), totalDays: new Set(item.dates).size }))
            .sort((a, b) => b.totalDays - a.totalDays)
    }, [monthShifts])

    // === КВАРТАЛ ===
    const quarterStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 2, 1, 0, 0, 0, 0)
    const quarterEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999)

    const quarterSiteStats = useMemo(() => {
        const map = {}
        workerShifts.forEach(s => {
            if (!s.work_date) return
            const d = new Date(s.work_date + 'T00:00:00')
            if (d < quarterStart || d > quarterEnd) return
            const site = allSites.find(x => x.id === s.site_id)
            const key = site?.id || site?.name || 'unknown'
            if (!map[key]) map[key] = { siteId: site?.id, siteName: site?.name || 'Неизвестный объект', color: site?.color || '#666', dates: [] }
            map[key].dates.push(s.work_date)
        })
        return Object.values(map)
            .map(item => ({ ...item, dates: [...new Set(item.dates)].sort(), totalDays: new Set(item.dates).size }))
            .sort((a, b) => b.totalDays - a.totalDays)
    }, [workerShifts, allSites, currentMonth])

    const quarterTotalDays = quarterSiteStats.reduce((acc, s) => acc + s.totalDays, 0)

    const quarterLabel = useMemo(() => {
        const start = quarterStart.toLocaleDateString('ru-RU', { month: 'long' })
        const end = quarterEnd.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
        return `${start} — ${end}`.replace(' г.', '')
    }, [currentMonth])

    // === ВЕСЬ ПЕРИОД ===
    const allSiteStats = useMemo(() => {
        const map = {}
        workerShifts.forEach(s => {
            if (!s.work_date) return
            const site = allSites.find(x => x.id === s.site_id)
            const key = site?.id || site?.name || 'unknown'
            if (!map[key]) map[key] = { siteId: site?.id, siteName: site?.name || 'Неизвестный объект', color: site?.color || '#666', dates: [] }
            map[key].dates.push(s.work_date)
        })
        return Object.values(map)
            .map(item => ({ ...item, dates: [...new Set(item.dates)].sort(), totalDays: new Set(item.dates).size }))
            .sort((a, b) => b.totalDays - a.totalDays)
    }, [workerShifts, allSites])

    const allTotalDays = allSiteStats.reduce((acc, s) => acc + s.totalDays, 0)

    const allUniqueDays = useMemo(() => {
        const set = new Set()
        workerShifts.forEach(s => { if (s.work_date) set.add(s.work_date) })
        return set.size
    }, [workerShifts])

    const lastShiftDate = useMemo(() => {
        if (workerShifts.length === 0) return null
        const dates = workerShifts.map(s => s.work_date).filter(Boolean).sort()
        return dates[dates.length - 1] || null
    }, [workerShifts])

    // === КАЛЕНДАРЬ ===
    const tileClassName = ({ date, view }) => {
        if (view !== 'month') return null
        const key = formatDateLocal(date)
        const classes = []
        if (key === formatDateLocal(new Date())) classes.push('v2-today')
        if (monthShifts[key]?.length) classes.push('v2-colored')
        return classes.length ? classes : null
    }

    const tileContent = ({ date, view }) => {
        if (view !== 'month') return null
        const key = formatDateLocal(date)
        const items = monthShifts[key]
        if (!items || items.length === 0) return null
        const unique = [...new Set(items.map(i => i.color))].slice(0, 3)
        let bg = unique[0]
        if (unique.length === 2) bg = `linear-gradient(to right, ${unique[0]} 50%, ${unique[1]} 50%)`
        else if (unique.length === 3) bg = `linear-gradient(to right, ${unique[0]} 33.33%, ${unique[1]} 33.33%, ${unique[1]} 66.66%, ${unique[2]} 66.66%)`
        return <div className={styles.tileBg} style={{ background: bg }} />
    }

    const goPrevMonth = () => {
        setDirection(-1)
        setIsDetailVisible(false)
        const d = new Date(currentMonth)
        d.setMonth(d.getMonth() - 1)
        setCurrentMonth(d)
        monthKeyRef.current += 1
        if (detailTimerRef.current) clearTimeout(detailTimerRef.current)
        detailTimerRef.current = setTimeout(() => setIsDetailVisible(true), 300)
    }

    const goNextMonth = () => {
        setDirection(1)
        setIsDetailVisible(false)
        const d = new Date(currentMonth)
        d.setMonth(d.getMonth() + 1)
        setCurrentMonth(d)
        monthKeyRef.current += 1
        if (detailTimerRef.current) clearTimeout(detailTimerRef.current)
        detailTimerRef.current = setTimeout(() => setIsDetailVisible(true), 300)
    }

    const handleDragEnd = (event, info) => {
        if (Math.abs(info.offset.y) > Math.abs(info.offset.x)) return
        const threshold = 30
        if (info.offset.x < -threshold) goNextMonth()
        else if (info.offset.x > threshold) goPrevMonth()
    }

    const monthName = currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(' г.', '')

    const handleStatusToggle = async () => {
        if (!worker) return
        const next = status === 'active' ? 'inactive' : 'active'
        setStatus(next)
        setIsUpdatingStatus(true)
        setShowActions(false)
        try {
            await updateWorkerStatus(worker.id, next)
            if (onRefresh) await onRefresh()
        } catch (e) {
            console.error(e)
            setStatus(status)
            alert('Не удалось обновить статус')
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const toggleSite = (key) => {
        const next = new Set(expandedSites)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        setExpandedSites(next)
    }

    const variants = {
        enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({ x: dir < 0 ? 300 : -300, opacity: 0 })
    }

    if (!worker) return null

    const shouldAnimate = !isFirstRenderRef.current

    return (
        <div className={styles.page}>
            {/* === СТРОКА "НАЗАД" === */}
            <button className={styles.backRow} onClick={onClose} aria-label="Назад">
                <span className={styles.backRowIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </span>
                <span className={styles.backRowLabel}>Назад</span>
            </button>

            {/* === ШАПКА: аватар, имя, статус текстом, ⋯ === */}
            <div className={styles.header}>
                <div className={styles.avatarWrap} onClick={() => onEdit(worker)}>
                    <div className={styles.avatar}>
                        {hasPhoto ? <img src={avatarUrl} alt={worker.name} /> : <span style={{ background: avatarColor }}>{initials}</span>}
                    </div>
                    <div className={styles.editBadge}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </div>
                </div>

                <div className={styles.headerInfo}>
                    <span className={styles.headerName}>{worker.name}</span>
                    <span className={`${styles.headerStatus} ${status === 'active' ? styles.statusActive : styles.statusInactive}`}>
                        {status === 'active' ? 'Работает' : 'Не работает'}
                    </span>
                </div>

                <div className={styles.actionsWrap} ref={actionsRef}>
                    <button className={styles.actionsBtn} onClick={() => setShowActions(v => !v)} aria-label="Действия">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                        </svg>
                    </button>
                    {showActions && (
                        <div className={styles.actionsMenu}>
                            <button className={styles.actionsItem} onClick={() => { setShowActions(false); onEdit(worker) }}>
                                Редактировать профиль
                            </button>
                            <button className={styles.actionsItem} onClick={handleStatusToggle} disabled={isUpdatingStatus}>
                                {status === 'active' ? 'Сделать «Не работает»' : 'Сделать «Работает»'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* === СВОДКА: 3 цифры === */}
            <div className={styles.summaryRow}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryValue}>{monthTotalDays}</span>
                    <span className={styles.summaryCaption}>дней за месяц</span>
                </div>
                <div className={styles.summaryDivider} />
                <div className={styles.summaryItem}>
                    <span className={styles.summaryValue}>{allUniqueDays}</span>
                    <span className={styles.summaryCaption}>дней всего</span>
                </div>
                <div className={styles.summaryDivider} />
                <div className={styles.summaryItem}>
                    <span className={styles.summaryValue}>{lastShiftDate ? formatDateShort(lastShiftDate) : '—'}</span>
                    <span className={styles.summaryCaption}>последняя смена</span>
                </div>
            </div>

            {/* === СЕКЦИЯ: ГРАФИК (МЕСЯЦ) === */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>График</h2>
                    <div className={styles.monthNav}>
                        <button className={styles.monthNavBtn} onClick={goPrevMonth} aria-label="Предыдущий месяц">‹</button>
                        <span className={styles.monthNavLabel}>{monthName}</span>
                        <button className={styles.monthNavBtn} onClick={goNextMonth} aria-label="Следующий месяц">›</button>
                    </div>
                </div>

                <div className={styles.calendarWrap}>
                    <AnimatePresence mode="popLayout" custom={direction}>
                        <motion.div
                            key={monthKeyRef.current}
                            custom={direction}
                            variants={variants}
                            initial={shouldAnimate ? 'enter' : false}
                            animate="center"
                            exit="exit"
                            transition={{ x: { type: 'spring', stiffness: 500, damping: 35, mass: 0.5 }, opacity: { duration: 0.15 } }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.5}
                            dragMomentum={false}
                            onDragEnd={handleDragEnd}
                            style={{ width: '100%' }}
                        >
                            <Calendar
                                key={currentMonth.getMonth() + '-' + currentMonth.getFullYear()}
                                value={null}
                                tileClassName={tileClassName}
                                tileContent={tileContent}
                                minDetail="month"
                                maxDetail="month"
                                prevLabel={null}
                                nextLabel={null}
                                next2Label={null}
                                prev2Label={null}
                                showNeighboringMonth={true}
                                navigationLabel={null}
                                activeStartDate={currentMonth}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className={styles.monthSummary}>
                    <span className={styles.monthSummaryNumber}>{monthTotalDays}</span>
                    <span className={styles.monthSummaryLabel}>
                        {getDaysLabel(monthTotalDays)} в {getMonthPrepositional(currentMonth)}
                    </span>
                </div>
            </section>

            {/* === СЕКЦИЯ: ПО ОБЪЕКТАМ (МЕСЯЦ) === */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>По объектам</h2>
                    <span className={styles.sectionHint}>за месяц</span>
                </div>

                {monthSiteStats.length > 0 ? (
                    <div className={styles.siteList}>
                        {monthSiteStats.map(site => (
                            <div key={site.siteId || site.siteName} className={styles.siteCard}>
                                <button className={styles.siteHeader} onClick={() => toggleSite(site.siteId || site.siteName)}>
                                    <span className={styles.siteDot} style={{ backgroundColor: site.color }} />
                                    <span className={styles.siteName}>{site.siteName}</span>
                                    <span className={styles.siteDays}>{site.totalDays} {getDaysLabel(site.totalDays)}</span>
                                    <span className={`${styles.siteArrow} ${expandedSites.has(site.siteId || site.siteName) ? styles.expanded : ''}`}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9"/>
                                        </svg>
                                    </span>
                                </button>
                                {expandedSites.has(site.siteId || site.siteName) && (
                                    <div className={styles.siteBody}>
                                        {site.dates.map(date => (
                                            <div key={date} className={styles.siteDate}>{formatDateShort(date)}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>Нет объектов за этот месяц</div>
                )}

                {/* Ссылка "показать за весь период" */}
                <button
                    className={styles.moreLink}
                    onClick={() => setShowAllPeriodInSites(v => !v)}
                >
                    {showAllPeriodInSites ? 'Скрыть объекты за всё время' : 'Показать объекты за всё время →'}
                </button>

                {showAllPeriodInSites && (
                    <div className={styles.siteList} style={{ marginTop: 10 }}>
                        {allSiteStats.length > 0 ? allSiteStats.map(site => (
                            <div key={site.siteId || site.siteName} className={styles.siteCard}>
                                <button className={styles.siteHeader} onClick={() => toggleSite('all-' + (site.siteId || site.siteName))}>
                                    <span className={styles.siteDot} style={{ backgroundColor: site.color }} />
                                    <span className={styles.siteName}>{site.siteName}</span>
                                    <span className={styles.siteDays}>{site.totalDays} {getDaysLabel(site.totalDays)}</span>
                                    <span className={`${styles.siteArrow} ${expandedSites.has('all-' + (site.siteId || site.siteName)) ? styles.expanded : ''}`}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9"/>
                                        </svg>
                                    </span>
                                </button>
                                {expandedSites.has('all-' + (site.siteId || site.siteName)) && (
                                    <div className={styles.siteBody}>
                                        {site.dates.map(date => (
                                            <div key={date} className={styles.siteDate}>{formatDateShort(date)}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className={styles.emptyState}>Нет объектов за всё время</div>
                        )}
                    </div>
                )}
            </section>

            {/* === СЕКЦИЯ: КВАРТАЛ (свёрнута) === */}
            <section className={styles.section}>
                <button className={styles.accordionToggle} onClick={() => setOpenQuarter(v => !v)}>
                    <span className={styles.accordionToggleLabel}>Квартал</span>
                    <span className={styles.accordionToggleMeta}>{quarterLabel} · {quarterTotalDays} {getDaysLabel(quarterTotalDays)}</span>
                    <span className={`${styles.accordionToggleArrow} ${openQuarter ? styles.expanded : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </span>
                </button>
                {openQuarter && (
                    <div className={styles.accordionBody}>
                        {quarterSiteStats.length > 0 ? quarterSiteStats.map(site => (
                            <div key={site.siteId || site.siteName} className={styles.siteCard}>
                                <button className={styles.siteHeader} onClick={() => toggleSite('q-' + (site.siteId || site.siteName))}>
                                    <span className={styles.siteDot} style={{ backgroundColor: site.color }} />
                                    <span className={styles.siteName}>{site.siteName}</span>
                                    <span className={styles.siteDays}>{site.totalDays} {getDaysLabel(site.totalDays)}</span>
                                    <span className={`${styles.siteArrow} ${expandedSites.has('q-' + (site.siteId || site.siteName)) ? styles.expanded : ''}`}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9"/>
                                        </svg>
                                    </span>
                                </button>
                                {expandedSites.has('q-' + (site.siteId || site.siteName)) && (
                                    <div className={styles.siteBody}>
                                        {site.dates.map(date => (
                                            <div key={date} className={styles.siteDate}>{formatDateShort(date)}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className={styles.emptyState}>Нет объектов за квартал</div>
                        )}
                    </div>
                )}
            </section>

            {/* === СЕКЦИЯ: ВЕСЬ ПЕРИОД (свёрнута) === */}
            <section className={styles.section}>
                <button className={styles.accordionToggle} onClick={() => setOpenAll(v => !v)}>
                    <span className={styles.accordionToggleLabel}>Весь период</span>
                    <span className={styles.accordionToggleMeta}>{allUniqueDays} {getDaysLabel(allUniqueDays)}</span>
                    <span className={`${styles.accordionToggleArrow} ${openAll ? styles.expanded : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </span>
                </button>
                {openAll && (
                    <div className={styles.accordionBody}>
                        {allSiteStats.length > 0 ? allSiteStats.map(site => (
                            <div key={site.siteId || site.siteName} className={styles.siteCard}>
                                <button className={styles.siteHeader} onClick={() => toggleSite('a-' + (site.siteId || site.siteName))}>
                                    <span className={styles.siteDot} style={{ backgroundColor: site.color }} />
                                    <span className={styles.siteName}>{site.siteName}</span>
                                    <span className={styles.siteDays}>{site.totalDays} {getDaysLabel(site.totalDays)}</span>
                                    <span className={`${styles.siteArrow} ${expandedSites.has('a-' + (site.siteId || site.siteName)) ? styles.expanded : ''}`}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9"/>
                                        </svg>
                                    </span>
                                </button>
                                {expandedSites.has('a-' + (site.siteId || site.siteName)) && (
                                    <div className={styles.siteBody}>
                                        {site.dates.map(date => (
                                            <div key={date} className={styles.siteDate}>{formatDateShort(date)}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className={styles.emptyState}>Нет объектов за всё время</div>
                        )}
                    </div>
                )}
            </section>

            {/* === СЕКЦИЯ: ЗАРПЛАТА (свёрнута) === */}
            <section className={styles.section}>
                <button className={styles.accordionToggle} onClick={() => setOpenSalary(v => !v)}>
                    <span className={styles.accordionToggleLabel}>Зарплата</span>
                    <span className={styles.accordionToggleMeta}>выплаты</span>
                    <span className={`${styles.accordionToggleArrow} ${openSalary ? styles.expanded : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </span>
                </button>
                {openSalary && (
                    <div className={styles.accordionBody}>
                        <div className={styles.emptyState}>Информация о зарплате появится позже</div>
                    </div>
                )}
            </section>

            <WorkerStatsFooter onEdit={onEdit} onClose={onClose} worker={worker} />
        </div>
    )
}