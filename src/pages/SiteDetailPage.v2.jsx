// src/pages/SiteDetailPage.v2.jsx

import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useShifts } from '../hooks/useShifts'
import { useWorkers } from '../hooks/useWorkers'
import {
    ArrowLeft,
    Ellipsis,
    PersonPencil,
    TrashBin,
    Pencil,
    CircleQuestion,
} from '@gravity-ui/icons'
import SquareCheckIcon from '@gravity-ui/icons/SquareCheck'
import { updateSiteStatus, updateSite } from '../services/supabase'
import { MONTHS, getMonthDays, formatDateLocal, isToday as isTodayUtil } from '../utils/dateHelpers'
import styles from '../styles/sites.v2.module.css'
import archiveStyles from '../styles/archive.module.css'

// ============================================================
// ХЕЛПЕРЫ
// ============================================================

const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const getColorFromName = (name) => {
    const colors = [
        '#2d7d46', '#1976D2', '#D32F2F', '#F57C00',
        '#7B1FA2', '#00897B', '#C2185B', '#303F9F',
        '#E64A19', '#388E3C', '#1565C0', '#6D4C41'
    ]
    if (!name) return '#666'
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
}

const isBase64Image = (str) => str && str.startsWith('data:image')

const getDaysWord = (count) => {
    if (count === 0) return 'дней'
    const lastDigit = count % 10
    const lastTwoDigits = count % 100
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'дней'
    if (lastDigit === 1) return 'день'
    if (lastDigit >= 2 && lastDigit <= 4) return 'дня'
    return 'дней'
}

const getWorkingDaysWord = (count) => {
    if (count === 0) return 'рабочих дней'
    const lastDigit = count % 10
    const lastTwoDigits = count % 100
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'рабочих дней'
    if (lastDigit === 1) return 'рабочий день'
    if (lastDigit >= 2 && lastDigit <= 4) return 'рабочих дня'
    return 'рабочих дней'
}

const getPeopleWord = (count) => {
    if (count === 0) return 'человек'
    const lastDigit = count % 10
    const lastTwoDigits = count % 100
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'человек'
    if (lastDigit === 1) return 'человек'
    if (lastDigit >= 2 && lastDigit <= 4) return 'человека'
    return 'человек'
}

const formatDateDots = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString + 'T00:00:00')
    if (isNaN(date.getTime())) return '—'
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const yyyy = date.getFullYear()
    return `${dd}.${mm}.${yyyy}`
}

const formatMoney = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '—'
    const rounded = Math.round(value)
    return rounded.toLocaleString('ru-RU').replace(/\u00A0/g, ' ').replace(/,/g, ' ') + ' BYN'
}

// ============================================================
// МИНИ-КАЛЕНДАРЬ ОДНОГО МЕСЯЦА
// ============================================================

function MonthCalendar({ year, month, markedDates, color }) {
    const days = getMonthDays(year, month)
    const weekLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

    return (
        <div className={styles.siteDetailMonthBlock}>
            <div className={styles.siteDetailMonthTitle}>
                {MONTHS[month]} {year}
            </div>

            <div className={styles.siteDetailMonthGrid}>
                {weekLabels.map((w) => (
                    <div key={w} className={styles.siteDetailMonthWeekday}>{w}</div>
                ))}

                {days.map((d, idx) => {
                    if (d.empty) {
                        return <div key={`e-${idx}`} className={styles.siteDetailMonthDayEmpty} />
                    }
                    const dateStr = formatDateLocal(d.date)
                    const marked = markedDates.has(dateStr)
                    const today = isTodayUtil(d.date)

                    return (
                        <div
                            key={dateStr}
                            className={
                                `${styles.siteDetailMonthDay} ` +
                                `${marked ? styles.siteDetailMonthDayMarked : ''} ` +
                                `${today ? styles.siteDetailMonthDayToday : ''}`
                            }
                            style={marked ? { backgroundColor: color, color: '#121212' } : undefined}
                        >
                            {d.day}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ============================================================
// СТРАНИЦА
// ============================================================

export function SiteDetailPage({ site, onClose, onArchive, onEdit, onUpdate }) {
    const { shifts } = useShifts()
    const { workers } = useWorkers()

    const [showConfirm, setShowConfirm] = useState(false)
    const [archiving, setArchiving] = useState(false)
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [localStatus, setLocalStatus] = useState(site?.status || 'в работе')

    const [showSalaryModal, setShowSalaryModal] = useState(false)
    const [salaryInput, setSalaryInput] = useState('')
    const [salarySaving, setSalarySaving] = useState(false)
    const [salaryError, setSalaryError] = useState('')

    const [showRateHelp, setShowRateHelp] = useState(false)

    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const menuRef = useRef(null)

    const monthsScrollRef = useRef(null)
    const [activeMonthIdx, setActiveMonthIdx] = useState(0)

    const brigadeRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        setLocalStatus(site?.status || 'в работе')
    }, [site?.id, site?.status])

    const siteShifts = useMemo(() => {
        if (!shifts || !site) return []
        return shifts.filter(shift => shift.site_id === site.id)
    }, [shifts, site?.id])

    const startDate = useMemo(() => {
        if (siteShifts.length === 0) return null
        const dates = siteShifts
            .map(shift => shift.work_date)
            .filter(Boolean)
            .sort()
        return dates.length > 0 ? dates[0] : null
    }, [siteShifts])

    const endDate = useMemo(() => {
        if (!site || site.status !== 'завершен') return null
        if (siteShifts.length === 0) return null
        const dates = siteShifts
            .map(shift => shift.work_date)
            .filter(Boolean)
            .sort()
        return dates.length > 0 ? dates[dates.length - 1] : null
    }, [siteShifts, site?.status])

    const uniqueDays = useMemo(() => {
        const set = new Set()
        siteShifts.forEach(s => { if (s.work_date) set.add(s.work_date) })
        return set.size
    }, [siteShifts])

    const workersStats = useMemo(() => {
        if (siteShifts.length === 0) return []
        const statsMap = new Map()
        siteShifts.forEach(shift => {
            if (!shift.worker_id) return
            const workerId = shift.worker_id
            if (!statsMap.has(workerId)) {
                statsMap.set(workerId, { workerId, dates: new Set() })
            }
            if (shift.work_date) {
                statsMap.get(workerId).dates.add(shift.work_date)
            }
        })
        const arr = Array.from(statsMap.entries()).map(([workerId, data]) => ({
            workerId,
            days: data.dates.size
        }))
        return arr.sort((a, b) => {
            const nameA = workers.find(w => w.id === a.workerId)?.name || ''
            const nameB = workers.find(w => w.id === b.workerId)?.name || ''
            return nameA.localeCompare(nameB, 'ru')
        })
    }, [siteShifts, workers])

    const uniqueWorkers = workersStats.length

    const totalWorkerDays = useMemo(
        () => workersStats.reduce((sum, w) => sum + w.days, 0),
        [workersStats]
    )

    const salaryPart = (site && site.salary_part != null && Number(site.salary_part) > 0)
        ? Number(site.salary_part)
        : null

    const ratePerDay = (salaryPart && totalWorkerDays > 0)
        ? salaryPart / totalWorkerDays
        : null

    const getEarned = (days) => {
        if (ratePerDay === null) return null
        return Math.round(days * ratePerDay)
    }

    const monthsList = useMemo(() => {
        if (siteShifts.length === 0) return []
        const map = new Map()
        siteShifts.forEach(s => {
            if (!s.work_date) return
            const [y, m] = s.work_date.split('-').map(Number)
            const key = `${y}-${m}`
            if (!map.has(key)) {
                map.set(key, { year: y, month: m - 1, dates: new Set() })
            }
            map.get(key).dates.add(s.work_date)
        })
        return Array.from(map.values()).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year
            return a.month - b.month
        })
    }, [siteShifts])

    useEffect(() => {
        setActiveMonthIdx(0)
        if (monthsScrollRef.current) {
            monthsScrollRef.current.scrollTo({ left: 0, behavior: 'auto' })
        }
    }, [site?.id])

    const scrollToMonth = (idx) => {
        setActiveMonthIdx(idx)
        const el = monthsScrollRef.current
        if (!el) return
        const child = el.children[idx]
        if (child) {
            el.scrollTo({ left: child.offsetLeft, behavior: 'smooth' })
        }
    }

    const handleMonthsScroll = () => {
        const el = monthsScrollRef.current
        if (!el) return
        const scrollLeft = el.scrollLeft
        let bestIdx = 0
        let bestDelta = Infinity
        Array.from(el.children).forEach((child, idx) => {
            const delta = Math.abs(child.offsetLeft - scrollLeft)
            if (delta < bestDelta) {
                bestDelta = delta
                bestIdx = idx
            }
        })
        if (bestIdx !== activeMonthIdx) setActiveMonthIdx(bestIdx)
    }

    const isWorking = localStatus === 'в работе'

    const handleStatusToggle = async () => {
        if (updatingStatus || !site) return
        const newStatus = isWorking ? 'завершен' : 'в работе'
        const prevStatus = localStatus
        setLocalStatus(newStatus)
        setUpdatingStatus(true)
        try {
            await updateSiteStatus(site.id, newStatus)
            if (onUpdate) {
                onUpdate({ ...site, status: newStatus })
            }
        } catch (e) {
            console.error('❌ Ошибка обновления статуса:', e)
            setLocalStatus(prevStatus)
            alert('Не удалось обновить статус: ' + (e?.message || 'неизвестная ошибка'))
        } finally {
            setUpdatingStatus(false)
        }
    }

    const openSalaryModal = () => {
        setSalaryInput(site?.salary_part != null ? String(site.salary_part) : '')
        setSalaryError('')
        setShowSalaryModal(true)
    }

    const closeSalaryModal = () => {
        if (salarySaving) return
        setShowSalaryModal(false)
        setSalaryError('')
    }

    const handleSaveSalary = async () => {
        if (salarySaving || !site) return
        const raw = String(salaryInput).replace(/\s/g, '').replace(',', '.')
        const num = Number(raw)

        if (!raw || Number.isNaN(num) || num <= 0) {
            setSalaryError('Введите сумму больше нуля')
            return
        }

        setSalarySaving(true)
        setSalaryError('')
        try {
            const updated = await updateSite({
                siteId: site.id,
                name: site.name,
                address: site.address || '',
                color: site.color,
                status: site.status,
                salaryPart: num
            })
            const merged = { ...site, ...(updated || {}), salary_part: num }
            if (onUpdate) onUpdate(merged)
            setShowSalaryModal(false)
        } catch (e) {
            console.error('❌ Ошибка сохранения зарплатной части:', e)
            setSalaryError('Не удалось сохранить: ' + (e?.message || 'неизвестная ошибка'))
        } finally {
            setSalarySaving(false)
        }
    }

    const handleArchive = async () => {
        if (archiving) return
        setArchiving(true)
        try {
            await onArchive(site.id)
            onClose()
        } catch (e) {
            console.error('❌ Ошибка удаления:', e)
            alert(`Не удалось удалить: ${e?.message || 'неизвестная ошибка'}`)
            setArchiving(false)
            setShowConfirm(false)
        }
    }

    const handleEdit = () => {
        setIsMenuOpen(false)
        if (onEdit) onEdit(site)
    }

    const handleOpenDeleteModal = () => {
        setIsMenuOpen(false)
        setShowConfirm(true)
    }

    if (!site) return null

    const hasPhoto = isBase64Image(site.photo)
    const siteColor = site.color || '#86d617'

    const heroBgStyle = hasPhoto
        ? { backgroundImage: `url(${site.photo})` }
        : { background: `linear-gradient(135deg, ${siteColor} 0%, rgba(18,18,18,0.9) 100%)` }

    return (
        <div className={styles.siteDetailPage}>

            <div className={styles.siteDetailBody}>

                {/* === V2: HERO-ШАПКА === */}
                <div className={styles.siteDetailHero}>
                    <div className={styles.siteDetailHeroBg} style={heroBgStyle} />
                    <div className={styles.siteDetailHeroOverlay} />

                    <div className={styles.siteDetailHeroTopRow}>
                        <button
                            type="button"
                            className={styles.siteDetailHeroBackBtn}
                            onClick={onClose}
                            aria-label="Назад"
                        >
                            <span className={styles.siteDetailHeroBackIcon}>
                                <ArrowLeft />
                            </span>
                        </button>

                        <div className={styles.siteDetailHeroMenuWrapper} ref={menuRef}>
                            <button
                                type="button"
                                className={styles.siteDetailHeroMenuBtn}
                                onClick={() => setIsMenuOpen(prev => !prev)}
                                aria-label="Меню"
                                aria-haspopup="menu"
                                aria-expanded={isMenuOpen}
                            >
                                <span className={styles.siteDetailHeroMenuIcon}>
                                    <Ellipsis />
                                </span>
                            </button>

                            {isMenuOpen && (
                                <div className={styles.siteDetailDropdown} role="menu">
                                    <button
                                        type="button"
                                        className={styles.siteDetailDropdownItem}
                                        onClick={handleEdit}
                                        role="menuitem"
                                    >
                                        <span className={styles.siteDetailDropdownItemIcon}>
                                            <PersonPencil />
                                        </span>
                                        <span className={styles.siteDetailDropdownItemText}>
                                            Редактировать
                                        </span>
                                    </button>

                                    <div className={styles.siteDetailDropdownDivider} />

                                    <button
                                        type="button"
                                        className={`${styles.siteDetailDropdownItem} ${styles.siteDetailDropdownItemDanger}`}
                                        onClick={handleOpenDeleteModal}
                                        role="menuitem"
                                    >
                                        <span className={styles.siteDetailDropdownItemIcon}>
                                            <TrashBin />
                                        </span>
                                        <span className={styles.siteDetailDropdownItemText}>
                                            Удалить
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.siteDetailHeroBottom}>
                        <h1 className={styles.siteDetailHeroName}>{site.name}</h1>
                        {site.address ? (
                            <p className={styles.siteDetailHeroAddress}>{site.address}</p>
                        ) : (
                            <p className={styles.siteDetailHeroAddressMuted}>Без адреса</p>
                        )}
                    </div>
                </div>
                {/* === /V2: HERO-ШАПКА === */}

                {/* === «Статистика:» + плашка статуса === */}
                <div className={styles.siteDetailDetailsRow}>
                    <span className={styles.siteDetailDetailsTitle}>Статистика:</span>

                    <div className={styles.siteDetailStatusPill}>
                        {isWorking ? (
                            <span className={styles.siteDetailStatusLabelWork}>
                                Объект в работе
                            </span>
                        ) : (
                            <span className={styles.siteDetailStatusLabelDone}>
                                <span className={styles.siteDetailStatusLabelDoneText}>
                                    Объект завершён
                                </span>
                                <SquareCheckIcon className={styles.siteDetailStatusCheck} />
                            </span>
                        )}

                        <button
                            type="button"
                            className={`${styles.siteDetailSwitch} ${isWorking ? styles.siteDetailSwitchOn : ''}`}
                            onClick={handleStatusToggle}
                            disabled={updatingStatus}
                            aria-label="Изменить статус"
                            role="switch"
                            aria-checked={isWorking}
                        >
                            <span className={styles.siteDetailSwitchThumb} />
                        </button>
                    </div>
                </div>

                <div className={styles.siteDetailSummaryTwo}>
                    <div className={`${styles.siteDetailStatCard} ${styles.siteDetailStatCardSplit}`}>
                        {/* Верхняя половина: Начало / Конец */}
                        <div className={styles.siteDetailStatDatesHalf}>
                            <div className={styles.siteDetailStatDatesCol}>
                                <div className={styles.siteDetailStatDatesKey}>Начало</div>
                                <div className={styles.siteDetailStatDatesVal}>
                                    {formatDateDots(startDate)}
                                </div>
                            </div>

                            <div className={styles.siteDetailStatDatesDivider} />

                            <div className={styles.siteDetailStatDatesCol}>
                                <div className={styles.siteDetailStatDatesKey}>Конец</div>
                                <div className={styles.siteDetailStatDatesVal}>
                                    {formatDateDots(endDate)}
                                </div>
                            </div>
                        </div>

                        
                        {/* Нижняя половина: счётчик дней + декоративный паттерн-«шум» */}
<div className={styles.siteDetailStatDaysHalf}>
   <div
    className={styles.siteDetailStatDaysPattern}
    style={{ '--pattern-color': siteColor }}
    aria-hidden="true"
>
    {Array.from({ length: 192 }).map((_, i) => {
        const cols = 32
        const row = Math.floor(i / cols)             // 0..5 (сверху вниз)
        const col = i % cols

        // Плотность закраски по строкам, % (сверху пусто, книзу плотнее)
        const densityByRow = [0, 14, 32, 54, 74, 88]
        const threshold = densityByRow[row] ?? 0

        // Детерминированный «шум» — не мигает при ререндере
        const hash = (i * 37 + 11) % 100

        // Гарантированные «дырки» в нижней строке (позиции в 32-колоночной сетке)
        const bottomHoles = row === 5 && (col === 8 || col === 23)

        const filled = !bottomHoles && hash < threshold

        return (
            <span
                key={i}
                className={
                    `${styles.siteDetailStatDaysSquare}` +
                    (filled ? ` ${styles.siteDetailStatDaysSquareFilled}` : '')
                }
            />
        )
    })}
</div>

    <div className={styles.siteDetailStatDaysContent}>
        <div className={styles.siteDetailStatValue}>{uniqueDays}</div>
        <div className={styles.siteDetailStatLabel}>
            {getWorkingDaysWord(uniqueDays)}
        </div>
    </div>
</div>
                    </div>

                    {salaryPart !== null ? (
                        <div className={styles.siteDetailSalaryStack}>
                            <button
                                type="button"
                                className={`${styles.siteDetailSalaryMini} ${styles.siteDetailSalaryMiniClickable}`}
                                onClick={openSalaryModal}
                                aria-label="Изменить зарплатную часть"
                            >
                                <div className={styles.siteDetailSalaryMiniLabel}>
                                    Зарплатная часть:
                                </div>
                                <div className={`${styles.siteDetailSalaryMiniValue} ${styles.siteDetailSalaryMiniValueSmall}`}>
                                    {formatMoney(salaryPart).replace(/\s*BYN$/, '')}
                                    <span className={`${styles.siteDetailStatCurrency} ${styles.siteDetailStatCurrencySmall}`}> BYN</span>
                                </div>

                                <span className={styles.siteDetailSalaryMiniPencil} aria-hidden="true">
                                    <Pencil />
                                </span>
                            </button>

                            <button
                                type="button"
                                className={`${styles.siteDetailSalaryMini} ${styles.siteDetailSalaryMiniRate} ${styles.siteDetailSalaryMiniClickable}`}
                                onClick={() => setShowRateHelp(true)}
                                aria-label="Как рассчитывается ставка за день"
                            >
                                <div className={styles.siteDetailSalaryMiniLabel}>
                                    Ставка за день
                                </div>
                                <div className={`${styles.siteDetailSalaryMiniValue} ${styles.siteDetailSalaryMiniValueLarge}`}>
                                    {formatMoney(ratePerDay).replace(/\s*BYN$/, '')}
                                    <span className={`${styles.siteDetailStatCurrency} ${styles.siteDetailStatCurrencyLarge}`}> BYN</span>
                                </div>

                                <span className={styles.siteDetailSalaryMiniPencil} aria-hidden="true">
                                    <CircleQuestion />
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className={styles.siteDetailStatCard}>
                            <div className={styles.siteDetailSalaryEmpty}>
                                <div className={styles.siteDetailSalaryEmptyText}>
                                    Зарплатная часть не установлена
                                </div>
                                <button
                                    type="button"
                                    className={styles.siteDetailSalarySetBtn}
                                    onClick={openSalaryModal}
                                >
                                    Установить
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* === БРИГАДА (без шапки) === */}
                <div className={styles.siteDetailWorkersSection} ref={brigadeRef}>
                    {workersStats.length > 0 ? (
                        <div className={styles.siteDetailWorkersList}>
                            {workersStats.map((stat) => {
                                const workerName = workers.find(w => w.id === stat.workerId)?.name || 'Неизвестный'
                                const avatar = workers.find(w => w.id === stat.workerId)?.avatar || null
                                const initials = getInitials(workerName)
                                const color = getColorFromName(workerName)
                                const earned = getEarned(stat.days)
                                return (
                                    <div key={stat.workerId} className={styles.siteDetailWorkerItem}>
                                        <div
                                            className={styles.siteDetailWorkerAvatar}
                                            style={{ backgroundColor: color }}
                                        >
                                            {isBase64Image(avatar) ? (
                                                <img
                                                    src={avatar}
                                                    alt={workerName}
                                                    className={styles.siteDetailWorkerAvatarImg}
                                                />
                                            ) : (
                                                initials
                                            )}
                                        </div>
                                        <div className={styles.siteDetailWorkerInfo}>
                                            <span className={styles.siteDetailWorkerName}>
                                                {workerName}
                                            </span>
                                            <span className={styles.siteDetailWorkerMeta}>
                                                <span className={styles.siteDetailWorkerDays}>
                                                    {stat.days} {getDaysWord(stat.days)}
                                                </span>
                                                {earned !== null && (
                                                    <span className={styles.siteDetailWorkerEarned}>
                                                        {formatMoney(earned)}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className={styles.siteDetailEmptyWorkers}>
                            <div className={styles.siteDetailEmptyIconWrap}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <div className={styles.siteDetailEmptyTitle}>
                                На этом объекте ещё никто не работал
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.siteDetailCalendarSection}>
                    <div className={styles.siteDetailSectionHeader}>
                        <span className={styles.siteDetailSectionTitle}>Календарь</span>
                    </div>

                    {monthsList.length === 0 ? (
                        <div className={styles.siteDetailEmptyWorkers}>
                            <div className={styles.siteDetailEmptyTitle}>
                                На этом объекте ещё не было смен
                            </div>
                        </div>
                    ) : (
                        <>
                            {monthsList.length > 1 && (
                                <div className={styles.siteDetailMonthsNav}>
                                    {monthsList.map((m, idx) => (
                                        <button
                                            key={`${m.year}-${m.month}`}
                                            type="button"
                                            className={
                                                `${styles.siteDetailMonthChip} ` +
                                                `${idx === activeMonthIdx ? styles.siteDetailMonthChipActive : ''}`
                                            }
                                            onClick={() => scrollToMonth(idx)}
                                        >
                                            {MONTHS[m.month].slice(0, 3)} {m.year}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div
                                ref={monthsScrollRef}
                                className={styles.siteDetailMonthsScroll}
                                onScroll={handleMonthsScroll}
                            >
                                {monthsList.map((m) => (
                                    <MonthCalendar
                                        key={`${m.year}-${m.month}`}
                                        year={m.year}
                                        month={m.month}
                                        markedDates={m.dates}
                                        color={siteColor}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className={styles.siteDetailFooter}>
                <button
                    type="button"
                    className={styles.siteDetailCloseBtn}
                    onClick={onClose}
                >
                    Назад
                </button>
            </div>

            {/* === МИНИ-ШИТ ЗАРПЛАТНОЙ ЧАСТИ === */}
            {showSalaryModal && createPortal(
                <div
                    className={styles.siteDetailSalaryOverlay}
                    onClick={closeSalaryModal}
                >
                    <div
                        className={styles.siteDetailSalarySheet}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className={styles.siteDetailSalaryHandleZone}>
                            <span className={styles.siteDetailSalaryHandle} />
                        </div>

                        <div className={styles.siteDetailSalaryHeader}>
                            <h2 className={styles.siteDetailSalaryTitle}>Зарплатная часть</h2>
                            <button
                                type="button"
                                className={styles.siteDetailSalaryCloseBtn}
                                onClick={closeSalaryModal}
                                aria-label="Закрыть"
                                disabled={salarySaving}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className={styles.siteDetailSalaryBody}>
                            <label className={styles.siteDetailSalaryLabel} htmlFor="salary-part-input-v2">
                                Сумма на объект, BYN
                            </label>
                            <div className={styles.siteDetailSalaryInputWrap}>
                                <input
                                    id="salary-part-input-v2"
                                    type="number"
                                    inputMode="decimal"
                                    min="0"
                                    step="any"
                                    className={styles.siteDetailSalaryInput}
                                    value={salaryInput}
                                    onChange={(e) => {
                                        setSalaryInput(e.target.value)
                                        if (salaryError) setSalaryError('')
                                    }}
                                    placeholder="0"
                                    autoFocus
                                    disabled={salarySaving}
                                />
                                <span className={styles.siteDetailSalarySuffix}>BYN</span>
                            </div>
                            {salaryError && (
                                <div className={styles.siteDetailSalaryError}>{salaryError}</div>
                            )}
                        </div>

                        <div className={styles.siteDetailSalaryFooter}>
                            <button
                                type="button"
                                className={styles.siteDetailSalaryCancelBtn}
                                onClick={closeSalaryModal}
                                disabled={salarySaving}
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                className={styles.siteDetailSalarySaveBtn}
                                onClick={handleSaveSalary}
                                disabled={salarySaving}
                            >
                                {salarySaving ? 'Сохраняем…' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* === МИНИ-ШИТ: КАК СЧИТАЕТСЯ СТАВКА === */}
            {showRateHelp && createPortal(
                <div
                    className={styles.siteDetailSalaryOverlay}
                    onClick={() => setShowRateHelp(false)}
                >
                    <div
                        className={styles.siteDetailSalarySheet}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className={styles.siteDetailSalaryHandleZone}>
                            <span className={styles.siteDetailSalaryHandle} />
                        </div>

                        <div className={styles.siteDetailSalaryHeader}>
                            <h2 className={styles.siteDetailSalaryTitle}>Как считается ставка</h2>
                            <button
                                type="button"
                                className={styles.siteDetailSalaryCloseBtn}
                                onClick={() => setShowRateHelp(false)}
                                aria-label="Закрыть"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className={styles.siteDetailSalaryBody}>
                            <div className={styles.rateHelpFormula}>
                                <div className={styles.rateHelpLine}>
                                    <span className={styles.rateHelpKey}>Зарплатная часть</span>
                                    <span className={styles.rateHelpVal}>{formatMoney(salaryPart)}</span>
                                </div>
                                <div className={styles.rateHelpLine}>
                                    <span className={styles.rateHelpKey}>Человеко-дни</span>
                                    <span className={styles.rateHelpVal}>{totalWorkerDays}</span>
                                </div>
                                <div className={styles.rateHelpDivider} />
                                <div className={styles.rateHelpLine}>
                                    <span className={styles.rateHelpKey}>Ставка за день</span>
                                    <span className={styles.rateHelpValGreen}>{formatMoney(ratePerDay)}</span>
                                </div>

                                <div className={styles.rateHelpFormulaLine}>
                                    {formatMoney(salaryPart)} ÷ {totalWorkerDays} = {formatMoney(ratePerDay)}
                                </div>
                            </div>

                            {workersStats.length > 0 && (
                                <div className={styles.rateHelpList}>
                                    <div className={styles.rateHelpListTitle}>Расшифровка человеко-дней</div>
                                    {workersStats.map((stat) => {
                                        const workerName = workers.find(w => w.id === stat.workerId)?.name || 'Неизвестный'
                                        return (
                                            <div key={stat.workerId} className={styles.rateHelpListRow}>
                                                <span className={styles.rateHelpListName}>{workerName}</span>
                                                <span className={styles.rateHelpListVal}>
                                                    {stat.days} {getDaysWord(stat.days)}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <div className={styles.siteDetailSalaryFooter}>
                            <button
                                type="button"
                                className={styles.siteDetailSalaryCancelBtn}
                                onClick={() => setShowRateHelp(false)}
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showConfirm && createPortal(
                <div
                    className={archiveStyles.confirmSheetOverlay}
                    onClick={() => !archiving && setShowConfirm(false)}
                >
                    <div
                        className={archiveStyles.confirmSheet}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className={archiveStyles.confirmSheetHandleZone}>
                            <span className={archiveStyles.confirmSheetHandle} />
                        </div>

                        <div className={archiveStyles.confirmSheetHeader}>
                            <h2 className={archiveStyles.confirmSheetTitle}>Удалить объект?</h2>
                            <button
                                type="button"
                                className={archiveStyles.confirmSheetCloseBtn}
                                onClick={() => setShowConfirm(false)}
                                aria-label="Закрыть"
                                disabled={archiving}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className={archiveStyles.confirmSheetBody}>
                            <p className={archiveStyles.confirmSheetText}>
                                Объект <strong>«{site.name}»</strong> будет удалён.
                                Вы сможете восстановить его из архива.
                            </p>
                        </div>

                        <div className={archiveStyles.confirmSheetFooter}>
                            <button
                                type="button"
                                className={archiveStyles.confirmSheetCancelBtn}
                                onClick={() => setShowConfirm(false)}
                                disabled={archiving}
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                className={archiveStyles.confirmSheetDeleteBtn}
                                onClick={handleArchive}
                                disabled={archiving}
                            >
                                {archiving ? 'Удаляем…' : 'Удалить'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}