// src/pages/CalendarTestPage.jsx

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSites } from '../hooks/useSites'
import { useShifts } from '../hooks/useShifts'
import { useWorkers } from '../hooks/useWorkers'
import { MONTHS, getMonthDays, formatDateLocal, isToday as isTodayUtil } from '../utils/dateHelpers'
import styles from '../styles/calendarTest.module.css'

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

// ============================================================
// РАСЧЁТ ВИДИМОСТИ СТРОК МЕСЯЦА
// Строки:
//   - 'hidden'  — display: none (не занимает место)
//   - 'fadeTop' — полупрозрачная сверху (градиент: снизу 1, сверху 0)
//   - 'fadeBottom' — полупрозрачная снизу (градиент: сверху 1, снизу 0)
//   - 'normal'  — как есть
// ============================================================

const computeRowVisibility = (rows, firstMarkedRow, lastMarkedRow) => {
    const result = new Array(rows).fill('normal')

    // Исключение: смены в первой и последней строках → весь месяц как есть
    if (firstMarkedRow === 0 && lastMarkedRow === rows - 1) {
        return result
    }

    // Сверху: пустые строки 0 … firstMarkedRow-1
    for (let r = 0; r < firstMarkedRow; r++) {
        if (r === firstMarkedRow - 1) {
            result[r] = 'fadeTop'
        } else {
            result[r] = 'hidden'
        }
    }

    // Снизу: пустые строки lastMarkedRow+1 … rows-1
    for (let r = lastMarkedRow + 1; r < rows; r++) {
        if (r === lastMarkedRow + 1) {
            result[r] = 'fadeBottom'
        } else {
            result[r] = 'hidden'
        }
    }

    return result
}

function MonthCalendar({ year, month, dayWorkersMap, color, workers }) {
    const days = getMonthDays(year, month)
    const weekLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

    // Группируем дни по 7 (строки-недели).
    // ВАЖНО: первая строка может быть неполной (пустые ячейки перед 1-м числом)
    // — они уже приходят как { empty: true } из getMonthDays.
    // Добиваем последнюю строку пустыми ячейками до 7.
    const rows = useMemo(() => {
        const result = []
        let current = []
        days.forEach((d) => {
            current.push(d)
            if (current.length === 7) {
                result.push(current)
                current = []
            }
        })
        if (current.length > 0) {
            while (current.length < 7) {
                current.push({ empty: true })
            }
            result.push(current)
        }
        return result
    }, [days])

    // В каких строках есть хотя бы одна смена
    const rowHasShift = rows.map((row) =>
        row.some((d) => {
            if (d.empty) return false
            const dateStr = formatDateLocal(d.date)
            const ids = dayWorkersMap.get(dateStr)
            return ids && ids.length > 0
        })
    )

    const firstMarkedRow = rowHasShift.indexOf(true)
    const lastMarkedRow = rowHasShift.lastIndexOf(true)
    const hasAnyShift = firstMarkedRow !== -1

    // Если смен в месяце нет — показываем всё как есть (родитель такое не рендерит, но на всякий)
    const visibility = hasAnyShift
        ? computeRowVisibility(rows.length, firstMarkedRow, lastMarkedRow)
        : new Array(rows.length).fill('normal')

    return (
        <div className={styles.monthBlock}>
            <div className={styles.monthTitle}>{MONTHS[month]} {year}</div>

            {/* Шапка Пн..Вс — вне строк, всегда видна */}
            <div className={styles.monthWeekHeader}>
                {weekLabels.map((w) => (
                    <div key={w} className={styles.monthWeekday}>{w}</div>
                ))}
            </div>

            {/* Строки-недели */}
            {rows.map((row, rowIdx) => {
                const vis = visibility[rowIdx]
                if (vis === 'hidden') return null

                const rowClass =
                    `${styles.monthWeek} ` +
                    (vis === 'fadeTop' ? `${styles.monthWeekFadeTop} ` : '') +
                    (vis === 'fadeBottom' ? `${styles.monthWeekFadeBottom} ` : '')

                return (
                    <div key={rowIdx} className={rowClass}>
                        {row.map((d, cellIdx) => {
                            if (d.empty) {
                                return <div key={`e-${rowIdx}-${cellIdx}`} className={styles.monthDayEmpty} />
                            }
                            const dateStr = formatDateLocal(d.date)
                            const workerIds = dayWorkersMap.get(dateStr) || null
                            const marked = !!workerIds && workerIds.length > 0
                            const today = isTodayUtil(d.date)

                            return (
                                <div
                                    key={dateStr}
                                    className={
                                        `${styles.monthDay} ` +
                                        `${marked ? styles.monthDayMarked : ''} ` +
                                        `${today ? styles.monthDayToday : ''}`
                                    }
                                    style={marked ? { backgroundColor: color, color: '#121212' } : undefined}
                                >
                                    <span className={styles.monthDayNumber}>{d.day}</span>
                                    {marked && (
                                        <WorkerAvatars workerIds={workerIds} workers={workers} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )
}
// ============================================================
// АВАТАРКИ РАБОТНИКОВ В ЯЧЕЙКЕ ДНЯ (максимум 6)
// ============================================================

const MAX_DAY_AVATARS = 6

function WorkerAvatars({ workerIds, workers }) {
    if (!workerIds || workerIds.length === 0) return null

    const visible = workerIds.slice(0, MAX_DAY_AVATARS)

    return (
        <div className={styles.monthDayAvatars}>
            {visible.map(workerId => {
                const worker = workers.find(w => w.id === workerId)
                const workerName = worker?.name || '?'
                const avatar = worker?.avatar || null
                const initials = getInitials(workerName)
                const bgColor = getColorFromName(workerName)

                return (
                    <span key={workerId} className={styles.monthDayAvatarSlot}>
                        <span
                            className={styles.monthDayAvatar}
                            style={{ backgroundColor: bgColor }}
                            title={workerName}
                        >
                            {isBase64Image(avatar) ? (
                                <img
                                    src={avatar}
                                    alt={workerName}
                                    className={styles.monthDayAvatarImg}
                                />
                            ) : (
                                initials
                            )}
                        </span>
                    </span>
                )
            })}
        </div>
    )
}
// ============================================================
// СТРАНИЦА
// ============================================================

export function CalendarTestPage({ onBack }) {
    const { sites, archivedSites } = useSites()
    const { shifts } = useShifts()
    const { workers } = useWorkers()

    const [selectedSiteId, setSelectedSiteId] = useState(null)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Закрытие дропдауна по клику снаружи
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Все объекты (активные + архивные) — для селектора
    const allSites = useMemo(() => {
        const active = (sites || []).filter(s => s.deleted !== true)
        const archived = (archivedSites || []).filter(s => s.deleted !== true)
        return [
            ...active,
            ...archived.map(s => ({ ...s, _archived: true }))
        ]
    }, [sites, archivedSites])

    const selectedSite = useMemo(
        () => allSites.find(s => s.id === selectedSiteId) || null,
        [allSites, selectedSiteId]
    )

    // Смены выбранного объекта
    const siteShifts = useMemo(() => {
        if (!shifts || !selectedSite) return []
        return shifts.filter(s => s.site_id === selectedSite.id)
    }, [shifts, selectedSite])

      // Месяцы (все, где были смены) — вертикально, один под другим.
    // Для каждого дня — массив worker_id, кто работал (для аватарок).
    const monthsList = useMemo(() => {
        if (siteShifts.length === 0) return []
        const map = new Map()
        siteShifts.forEach(s => {
            if (!s.work_date) return
            const [y, m] = s.work_date.split('-').map(Number)
            const key = `${y}-${m}`
            if (!map.has(key)) {
                map.set(key, { year: y, month: m - 1, dayWorkersMap: new Map() })
            }
            const monthData = map.get(key)
            if (!monthData.dayWorkersMap.has(s.work_date)) {
                monthData.dayWorkersMap.set(s.work_date, [])
            }
            if (s.worker_id) {
                monthData.dayWorkersMap.get(s.work_date).push(s.worker_id)
            }
        })
        return Array.from(map.values()).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year
            return a.month - b.month
        })
    }, [siteShifts])

    // Бригада: [{ workerId, days }]
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

    const siteColor = selectedSite?.color || '#86d617'

    const handleSelectSite = (siteId) => {
        setSelectedSiteId(siteId)
        setIsDropdownOpen(false)
    }

    return (
        <div className={styles.calendarTestPage}>
            <div className={styles.calendarTestHeader}>
                <button
                    type="button"
                    className={styles.calendarTestBackBtn}
                    onClick={onBack}
                    aria-label="Назад"
                >
                    ←
                </button>
                <span className={styles.calendarTestTitle}>Календарь</span>
            </div>

            <div className={styles.calendarTestBody}>

                {/* === СЕЛЕКТОР ОБЪЕКТА === */}
                <div className={styles.siteSelector} ref={dropdownRef}>
                    <button
                        type="button"
                        className={styles.siteSelectorBtn}
                        onClick={() => setIsDropdownOpen(prev => !prev)}
                        aria-haspopup="listbox"
                        aria-expanded={isDropdownOpen}
                    >
                        {selectedSite ? (
                            <span className={styles.siteSelectorValue}>
                                <span
                                    className={styles.siteSelectorDot}
                                    style={{ backgroundColor: selectedSite.color || '#86d617' }}
                                />
                                <span className={styles.siteSelectorName}>
                                    {selectedSite.name}
                                </span>
                            </span>
                        ) : (
                            <span className={styles.siteSelectorPlaceholder}>
                                Выберите объект
                            </span>
                        )}
                        <span className={`${styles.siteSelectorChevron} ${isDropdownOpen ? styles.siteSelectorChevronOpen : ''}`}>
                            ▾
                        </span>
                    </button>

                    {isDropdownOpen && (
                        <div className={styles.siteSelectorDropdown} role="listbox">
                            {allSites.length === 0 ? (
                                <div className={styles.siteSelectorEmpty}>
                                    Нет объектов
                                </div>
                            ) : (
                                allSites.map(site => (
                                    <button
                                        key={site.id}
                                        type="button"
                                        className={
                                            `${styles.siteSelectorItem} ` +
                                            `${site.id === selectedSiteId ? styles.siteSelectorItemActive : ''}`
                                        }
                                        onClick={() => handleSelectSite(site.id)}
                                        role="option"
                                        aria-selected={site.id === selectedSiteId}
                                    >
                                        <span
                                            className={styles.siteSelectorDot}
                                            style={{ backgroundColor: site.color || '#86d617' }}
                                        />
                                        <span className={styles.siteSelectorItemName}>
                                            {site.name}
                                        </span>
                                        {site._archived && (
                                            <span className={styles.siteSelectorItemTag}>
                                                в архиве
                                            </span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* === КАЛЕНДАРЬ === */}
                {!selectedSite ? (
                    <div className={styles.calendarEmptyState}>
                        Выберите объект, чтобы увидеть календарь
                    </div>
                ) : monthsList.length === 0 ? (
                    <div className={styles.calendarEmptyState}>
                        На этом объекте ещё не было смен
                    </div>
                ) : (
                    <div className={styles.monthsList}>
                                               {monthsList.map(m => (
                            <MonthCalendar
                                key={`${m.year}-${m.month}`}
                                year={m.year}
                                month={m.month}
                                dayWorkersMap={m.dayWorkersMap}
                                workers={workers}
                                color={siteColor}
                            />
                        ))}
                    </div>
                )}

                {/* === БРИГАДА === */}
                {selectedSite && workersStats.length > 0 && (
                    <div className={styles.brigadeSection}>
                        <div className={styles.brigadeTitle}>Бригада</div>
                        <div className={styles.brigadeList}>
                            {workersStats.map(stat => {
                                const workerName = workers.find(w => w.id === stat.workerId)?.name || 'Неизвестный'
                                const avatar = workers.find(w => w.id === stat.workerId)?.avatar || null
                                const initials = getInitials(workerName)
                                const color = getColorFromName(workerName)
                                return (
                                    <div key={stat.workerId} className={styles.brigadeItem}>
                                        <div
                                            className={styles.brigadeAvatar}
                                            style={{ backgroundColor: color }}
                                        >
                                            {isBase64Image(avatar) ? (
                                                <img
                                                    src={avatar}
                                                    alt={workerName}
                                                    className={styles.brigadeAvatarImg}
                                                />
                                            ) : (
                                                initials
                                            )}
                                        </div>
                                        <span className={styles.brigadeName}>{workerName}</span>
                                        <span className={styles.brigadeDays}>
                                            {stat.days} {getDaysWord(stat.days)}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}