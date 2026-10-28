// src/pages/SiteDetailPage.jsx

import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useShifts } from '../hooks/useShifts'
import { useWorkers } from '../hooks/useWorkers'
import {
    Camera,
    ArrowLeft,
    Ellipsis,
    PersonPencil,
    TrashBin,
    Calendar as CalendarIcon,
    Wallet,
    Pencil,
} from '@gravity-ui/icons'
import SquareCheckIcon from '@gravity-ui/icons/SquareCheck'
import { updateSiteStatus, updateSite } from '../services/supabase'
import { MONTHS, getMonthDays, formatDateLocal, isToday as isTodayUtil } from '../utils/dateHelpers'
import styles from '../styles/sites.module.css'
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

const formatDateWithMonth = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })
}

const formatDateShort = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })
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
    const [showCostsSheet, setShowCostsSheet] = useState(false)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [archiving, setArchiving] = useState(false)
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [localStatus, setLocalStatus] = useState(site?.status || 'в работе')

    const [showSalaryModal, setShowSalaryModal] = useState(false)
    const [salaryInput, setSalaryInput] = useState('')
    const [salarySaving, setSalarySaving] = useState(false)
    const [salaryError, setSalaryError] = useState('')

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

    const MAX_AVATARS = 4
    const avatarsPreview = useMemo(() => {
        return workersStats.slice(0, MAX_AVATARS).map(stat => {
            const worker = workers.find(w => w.id === stat.workerId)
            return {
                workerId: stat.workerId,
                name: worker?.name || 'Неизвестный',
                avatar: worker?.avatar || null,
                initials: getInitials(worker?.name || ''),
                color: getColorFromName(worker?.name || '')
            }
        })
    }, [workersStats, workers])
    const avatarsRest = Math.max(0, uniqueWorkers - MAX_AVATARS)

    const daysTable = useMemo(() => {
        if (siteShifts.length === 0) return []
        const map = new Map()
        siteShifts.forEach(s => {
            if (!s.work_date || !s.worker_id) return
            if (!map.has(s.work_date)) {
                map.set(s.work_date, { date: s.work_date, workerIds: new Set() })
            }
            map.get(s.work_date).workerIds.add(s.worker_id)
        })
        return Array.from(map.values())
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(row => {
                const list = Array.from(row.workerIds).map(id => {
                    const w = workers.find(x => x.id === id)
                    return {
                        workerId: id,
                        name: w?.name || 'Неизвестный',
                        avatar: w?.avatar || null,
                        initials: getInitials(w?.name || ''),
                        color: getColorFromName(w?.name || '')
                    }
                })
                return { date: row.date, workers: list }
            })
    }, [siteShifts, workers])

    // === ДИНАМИКА ПО ДНЯМ ===
    const dynamics = useMemo(() => {
        if (daysTable.length === 0) {
            return { total: 0, max: 0, min: 0, isFlat: false, segments: [], flat: null }
        }

        const counts = daysTable.map(row => row.workers.length)
        const total = counts.length
        const max = Math.max(...counts)
        const min = Math.min(...counts)
        const isFlat = max === min

        if (isFlat) {
            return {
                total,
                max,
                min,
                isFlat: true,
                segments: [],
                flat: { days: total, perDay: max, percent: 100 }
            }
        }

        const half = Math.ceil(max / 2)

        let all = 0
        let most = 0
        let lessHalf = 0
        let minCount = 0

        counts.forEach(n => {
            if (n === max) { all += 1; return }
            if (n === min) { minCount += 1; return }
            if (n >= half) { most += 1; return }
            lessHalf += 1
        })

        const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0

        const raw = [
            { key: 'all', label: 'Все', color: '#86d617', days: all },
            { key: 'most', label: 'Большинство', color: '#5dbb45', days: most },
            { key: 'lessHalf', label: 'Меньше половины', color: '#f5a623', days: lessHalf },
            { key: 'min', label: 'Минимум', color: '#e57373', days: minCount }
        ]

        const segments = raw
            .filter(s => s.days > 0)
            .map(s => ({ ...s, percent: pct(s.days) }))

        return { total, max, min, isFlat: false, segments, flat: null }
    }, [daysTable])

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

    const getWorkerName = (workerId) => workers.find(w => w.id === workerId)?.name || 'Неизвестный'
    const getWorkerAvatar = (workerId) => workers.find(w => w.id === workerId)?.avatar || null
    const getWorkerInitials = (workerId) => getInitials(getWorkerName(workerId))

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

    return (
        <div className={styles.siteDetailPage}>

            <div className={styles.siteDetailBody}>

                <div className={styles.siteDetailTopBar}>
                    <div className={styles.siteDetailHeader}>
                        <button
                            type="button"
                            className={styles.siteDetailBackBtn}
                            onClick={onClose}
                            aria-label="Назад"
                        >
                            <span className={styles.siteDetailBackIcon}>
                                <ArrowLeft />
                            </span>
                        </button>

                        <div className={styles.siteDetailAvatarWrapper}>
                            <div className={styles.siteDetailAvatar}>
                                {hasPhoto ? (
                                    <img src={site.photo} alt={site.name} />
                                ) : (
                                    <span className={styles.siteDetailAvatarPlaceholder}>
                                        <Camera className={styles.siteDetailAvatarPlaceholderIcon} />
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className={styles.siteDetailInfo}>
                            <span className={styles.siteDetailHeroName}>{site.name}</span>
                            {site.address ? (
                                <span className={styles.siteDetailHeroAddress}>{site.address}</span>
                            ) : (
                                <span className={styles.siteDetailHeroAddressMuted}>Без адреса</span>
                            )}
                        </div>

                        <div className={styles.siteDetailMenuWrapper} ref={menuRef}>
                            <button
                                type="button"
                                className={styles.siteDetailMenuBtn}
                                onClick={() => setIsMenuOpen(prev => !prev)}
                                aria-label="Меню"
                                aria-haspopup="menu"
                                aria-expanded={isMenuOpen}
                            >
                                <span className={styles.siteDetailMenuIcon}>
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
                </div>

                {/* === НОВОЕ: «Статистика:» + плашка статуса в одну строку === */}
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
                {/* === /НОВОЕ === */}

                <div className={styles.siteDetailSummaryTwo}>
                    <div className={styles.siteDetailStatCard}>
                        <div className={styles.siteDetailStatValue}>{uniqueDays}</div>
                        <div className={styles.siteDetailStatLabel}>
                            {getWorkingDaysWord(uniqueDays)}
                        </div>
                    </div>

                    {/* === КАРТОЧКА «СТАВКА ЗА ДЕНЬ» — кликабельная (иконка карандаша) === */}
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

        <div className={styles.siteDetailSalaryMini}>
            <div className={styles.siteDetailSalaryMiniLabel}>
                Ставка за день
            </div>
            <div className={`${styles.siteDetailSalaryMiniValue} ${styles.siteDetailSalaryMiniValueLarge}`}>
                {formatMoney(ratePerDay).replace(/\s*BYN$/, '')}
                <span className={`${styles.siteDetailStatCurrency} ${styles.siteDetailStatCurrencyLarge}`}> BYN</span>
            </div>
        </div>
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



                    {/* === /КАРТОЧКА «СТАВКА ЗА ДЕНЬ» === */}
                </div>

                <div className={styles.siteDetailInfoTwo}>
                    <div className={styles.siteDetailInfoCard}>
                        <div className={styles.siteDetailInfoHalf}>
                            <div className={styles.siteDetailInfoLabel}>Начало работ</div>
                            <div className={styles.siteDetailInfoValue}>
                                {startDate ? formatDateWithMonth(startDate) : '—'}
                            </div>
                        </div>
                        <div className={styles.siteDetailInfoHalfDivider} />
                        <div className={styles.siteDetailInfoHalf}>
                            <div className={styles.siteDetailInfoLabel}>Окончание работ</div>
                            <div className={styles.siteDetailInfoValue}>
                                {isWorking ? (
                                    <span className={styles.siteDetailInfoValueWork}>
                                        Объект ещё в работе
                                    </span>
                                ) : endDate ? (
                                    formatDateWithMonth(endDate)
                                ) : (
                                    '—'
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        className={`${styles.siteDetailInfoCard} ${styles.siteDetailInfoCardClickable}`}
                        onClick={() => {
                            if (daysTable.length > 0) setShowDetailsModal(true)
                        }}
                        aria-label="Подробнее: даты смен и кто работал"
                    >
                        <div className={styles.siteDetailInfoHalf}>
                            <div className={styles.siteDetailInfoLabel}>Работники</div>
                            <div className={styles.siteDetailInfoCount}>
                                {uniqueWorkers} {getPeopleWord(uniqueWorkers)}
                            </div>
                        </div>
                        {uniqueWorkers > 0 ? (
                            <>
                                <div className={styles.siteDetailInfoAvatars}>
                                    {avatarsPreview.map((a) => (
                                        <div
                                            key={a.workerId}
                                            className={styles.siteDetailInfoAvatar}
                                            style={{ backgroundColor: a.color }}
                                            title={a.name}
                                        >
                                            {isBase64Image(a.avatar) ? (
                                                <img
                                                    src={a.avatar}
                                                    alt={a.name}
                                                    className={styles.siteDetailInfoAvatarImg}
                                                />
                                            ) : (
                                                <span>{a.initials}</span>
                                            )}
                                        </div>
                                    ))}
                                    {avatarsRest > 0 && (
                                        <div className={styles.siteDetailInfoMore}>
                                            +{avatarsRest}
                                        </div>
                                    )}
                                </div>
                                <span className={styles.siteDetailInfoMoreLink}>
                                    Подробнее
                                </span>
                            </>
                        ) : (
                            <div className={styles.siteDetailInfoMuted}>Пока никто не работал</div>
                        )}
                    </button>
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

                <div className={styles.siteDetailWorkersSection} ref={brigadeRef}>
                    <div className={styles.siteDetailSectionHeader}>
                        <span className={styles.siteDetailSectionTitle}>Бригада</span>
                        <span className={styles.siteDetailWorkersCount}>
                            {uniqueWorkers} {getPeopleWord(uniqueWorkers)}
                        </span>
                    </div>

                    {workersStats.length > 0 ? (
                        <div className={styles.siteDetailWorkersList}>
                            {workersStats.map((stat) => {
                                const workerName = getWorkerName(stat.workerId)
                                const avatar = getWorkerAvatar(stat.workerId)
                                const initials = getWorkerInitials(stat.workerId)
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

                <button
                    type="button"
                    className={styles.siteDetailCostsLinkBtn}
                    onClick={() => setShowCostsSheet(true)}
                >
                    <span className={styles.siteDetailCostsLinkIcon}>
                        <Wallet />
                    </span>
                    <span className={styles.siteDetailCostsLinkText}>Затраты</span>
                    <span className={styles.siteDetailCostsLinkChevron}>›</span>
                </button>
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

            {/* === МОДАЛКА «ПОДРОБНЕЕ»: ДИНАМИКА + ТАБЛИЦА === */}
            {showDetailsModal && createPortal(
                <div
                    className={styles.siteDetailDaysOverlay}
                    onClick={() => setShowDetailsModal(false)}
                >
                    <div
                        className={styles.siteDetailDaysSheet}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className={styles.siteDetailDaysHandleZone}>
                            <span className={styles.siteDetailDaysHandle} />
                        </div>

                        <div className={styles.siteDetailDaysHeader}>
                            <h2 className={styles.siteDetailDaysTitle}>Смены по дням</h2>
                            <button
                                type="button"
                                className={styles.siteDetailDaysCloseBtn}
                                onClick={() => setShowDetailsModal(false)}
                                aria-label="Закрыть"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className={styles.siteDetailDaysBody}>
                            {/* ДИНАМИКА */}
                            {dynamics.total > 0 && (
                                <div className={styles.siteDetailDynamics}>
                                    <div className={styles.siteDetailDynamicsHeader}>
                                        <span className={styles.siteDetailDynamicsTitle}>Динамика</span>
                                        <span className={styles.siteDetailDynamicsMeta}>
                                            макс {dynamics.max} · мин {dynamics.min}
                                        </span>
                                    </div>

                                    {dynamics.isFlat ? (
                                        <div className={styles.siteDetailDynamicsFlat}>
                                            <div className={styles.siteDetailDynamicsFlatBar} />
                                            <div className={styles.siteDetailDynamicsFlatText}>
                                                Ровная загрузка · {dynamics.flat.days}{' '}
                                                {getDaysWord(dynamics.flat.days)} по{' '}
                                                {dynamics.flat.perDay}{' '}
                                                {getPeopleWord(dynamics.flat.perDay)}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={styles.siteDetailDynamicsBar}>
                                                {dynamics.segments.map(s => (
                                                    <div
                                                        key={s.key}
                                                        className={styles.siteDetailDynamicsSegment}
                                                        style={{
                                                            flexGrow: s.days,
                                                            backgroundColor: s.color
                                                        }}
                                                        title={`${s.label}: ${s.days} (${s.percent}%)`}
                                                    />
                                                ))}
                                            </div>

                                            <div className={styles.siteDetailDynamicsLegend}>
                                                {dynamics.segments.map(s => (
                                                    <div key={s.key} className={styles.siteDetailDynamicsLegendRow}>
                                                        <span
                                                            className={styles.siteDetailDynamicsDot}
                                                            style={{ backgroundColor: s.color }}
                                                        />
                                                        <span className={styles.siteDetailDynamicsLegendLabel}>
                                                            {s.label}
                                                        </span>
                                                        <span className={styles.siteDetailDynamicsLegendValue}>
                                                            {s.days} {getDaysWord(s.days)} · {s.percent}%
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ТАБЛИЦА */}
                            {daysTable.length === 0 ? (
                                <div className={styles.siteDetailDaysEmpty}>
                                    Пока нет смен
                                </div>
                            ) : (
                                <div className={styles.siteDetailDaysTable}>
                                    {daysTable.map((row) => (
                                        <div key={row.date} className={styles.siteDetailDaysRow}>
                                            <div className={styles.siteDetailDaysDate}>
                                                {formatDateShort(row.date)}
                                            </div>
                                            <div className={styles.siteDetailDaysWorkers}>
                                                {row.workers.map(w => (
                                                    <div
                                                        key={w.workerId}
                                                        className={styles.siteDetailDaysAvatar}
                                                        style={{ backgroundColor: w.color }}
                                                        title={w.name}
                                                    >
                                                        {isBase64Image(w.avatar) ? (
                                                            <img
                                                                src={w.avatar}
                                                                alt={w.name}
                                                                className={styles.siteDetailDaysAvatarImg}
                                                            />
                                                        ) : (
                                                            <span>{w.initials}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.siteDetailDaysFooter}>
                            <button
                                type="button"
                                className={styles.siteDetailDaysCloseFooterBtn}
                                onClick={() => setShowDetailsModal(false)}
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* === МИНИ-ШИТ: УСТАНОВИТЬ ЗАРПЛАТНУЮ ЧАСТЬ === */}
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
                            <label className={styles.siteDetailSalaryLabel} htmlFor="salary-part-input">
                                Сумма на объект, BYN
                            </label>
                            <div className={styles.siteDetailSalaryInputWrap}>
                                <input
                                    id="salary-part-input"
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

            {showCostsSheet && createPortal(
                <div
                    className={archiveStyles.confirmSheetOverlay}
                    onClick={() => setShowCostsSheet(false)}
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
                            <h2 className={archiveStyles.confirmSheetTitle}>Затраты</h2>
                            <button
                                type="button"
                                className={archiveStyles.confirmSheetCloseBtn}
                                onClick={() => setShowCostsSheet(false)}
                                aria-label="Закрыть"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className={archiveStyles.confirmSheetBody}>
                            <div className={styles.siteDetailPlaceholder}>
                                <div className={styles.siteDetailPlaceholderIcon}>💰</div>
                                <div className={styles.siteDetailPlaceholderTitle}>Затраты</div>
                                <div className={styles.siteDetailPlaceholderText}>
                                    Информация о затратах появится позже
                                </div>
                            </div>
                        </div>

                        <div className={archiveStyles.confirmSheetFooter}>
                            <button
                                type="button"
                                className={archiveStyles.confirmSheetCancelBtn}
                                onClick={() => setShowCostsSheet(false)}
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