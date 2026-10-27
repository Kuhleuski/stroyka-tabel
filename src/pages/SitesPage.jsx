// src/pages/SitesPage.jsx

import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { SitesList } from '../components/Sites/SitesList'
import { SiteDetailPage } from './SiteDetailPage'
import { AddSiteModal } from '../components/AddSiteModal'
import { EditSiteModal } from '../components/EditSiteModal'
import { addSite, updateSite } from '../services/supabase'
import { useSites } from '../hooks/useSites'
import { Plus } from 'lucide-react'
import Magnifier from '@gravity-ui/icons/Magnifier'
import Xmark from '@gravity-ui/icons/Xmark'
import styles from '../styles/sites.module.css'
import globalsStyles from '../styles/globals.module.css'

const SEARCH_DEBOUNCE = 250
const RECENT_LIMIT = 5

// Проверка: каждое слово запроса встречается в названии ИЛИ адресе (в любом порядке)
const matchesQuery = (site, query) => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (words.length === 0) return true
    const haystack = `${site.name || ''} ${site.address || ''}`.toLowerCase()
    return words.every(w => haystack.includes(w))
}

// Чтение дат открытия из localStorage
const readLastOpened = () => {
    try {
        const stored = localStorage.getItem('siteLastOpened')
        if (!stored) return {}
        const data = JSON.parse(stored)
        return data && typeof data === 'object' ? data : {}
    } catch (e) {
        return {}
    }
}

// Сортировка по календарю:
// 1. Объекты БЕЗ смен — первыми, среди них по created_at (новые сверху).
// 2. Объекты СО сменами — по max(work_date) (свежие сверху).
const sortSitesByCalendar = (sites, shifts) => {
    const shiftsBySite = new Map()
    ;(shifts || []).forEach(shift => {
        if (!shift.site_id || !shift.work_date) return
        const prev = shiftsBySite.get(shift.site_id)
        if (!prev || shift.work_date > prev) {
            shiftsBySite.set(shift.site_id, shift.work_date)
        }
    })

    return [...(sites || [])].sort((a, b) => {
        const aLast = shiftsBySite.get(a.id) || null
        const bLast = shiftsBySite.get(b.id) || null

        if (!aLast && !bLast) {
            const da = new Date(a.created_at || 0).getTime()
            const db = new Date(b.created_at || 0).getTime()
            return db - da
        }
        if (!aLast) return -1
        if (!bLast) return 1
        return bLast.localeCompare(aLast)
    })
}

export function SitesPage({ onAddSite, shifts = [] }) {
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedSite, setSelectedSite] = useState(null)
    const [editingSite, setEditingSite] = useState(null)
    const [scrollPosition, setScrollPosition] = useState(0)
    const { sites, loading, error, addSiteToState, removeSiteFromState, updateSiteInState, archiveSiteInState } = useSites()

    // === ПОИСК ===
    const [searchInput, setSearchInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const [dropdownRect, setDropdownRect] = useState(null)
    const searchWrapRef = useRef(null)

    // === НЕДАВНИЕ ===
    const [lastOpened, setLastOpened] = useState(() => readLastOpened())
    const [isRecentOpen, setIsRecentOpen] = useState(false)
    const recentChipsRef = useRef(null)

    useEffect(() => {
        const t = setTimeout(() => setSearchQuery(searchInput), SEARCH_DEBOUNCE)
        return () => clearTimeout(t)
    }, [searchInput])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
                if (e.target.closest && e.target.closest('[data-sites-suggestions]')) return
                setIsFocused(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // === Маски для чипсов «Недавние» ===
    const updateRecentMasks = () => {
        const el = recentChipsRef.current
        if (!el) return
        const hasLeft = el.scrollLeft > 1
        const hasRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1
        el.classList.toggle(styles.recentChipsFadeLeft, hasLeft)
        el.classList.toggle(styles.recentChipsNoFadeRight, !hasRight)
    }

    useEffect(() => {
        if (!isRecentOpen) return
        const id = requestAnimationFrame(updateRecentMasks)
        const el = recentChipsRef.current
        if (!el) return () => cancelAnimationFrame(id)

        el.addEventListener('scroll', updateRecentMasks, { passive: true })
        const ro = new ResizeObserver(updateRecentMasks)
        ro.observe(el)

        return () => {
            cancelAnimationFrame(id)
            el.removeEventListener('scroll', updateRecentMasks)
            ro.disconnect()
        }
    }, [isRecentOpen])

    // === ВИДИМЫЕ ОБЪЕКТЫ (без удалённых навсегда) ===
    // deleted=true остаются в памяти хука для календаря, но в списке скрыты.
    const visibleSites = useMemo(
        () => (sites || []).filter(s => s.deleted !== true),
        [sites]
    )

    // Подсказки: по словам в названии ИЛИ адресе (только среди видимых)
    const suggestions = useMemo(() => {
        const q = searchInput.trim()
        if (!q) return []
        return visibleSites
            .filter(s => matchesQuery(s, q))
            .slice(0, 6)
    }, [searchInput, visibleSites])

    const showSuggestions = isFocused && searchInput.trim().length > 0

    // Позиция выпадашки для портала
    useEffect(() => {
        if (!showSuggestions) {
            setDropdownRect(null)
            return
        }
        const update = () => {
            const el = searchWrapRef.current
            if (!el) return
            const r = el.getBoundingClientRect()
            setDropdownRect({ top: r.bottom + 6, left: r.left, width: r.width })
        }
        update()
        window.addEventListener('resize', update)
        window.addEventListener('scroll', update, true)
        return () => {
            window.removeEventListener('resize', update)
            window.removeEventListener('scroll', update, true)
        }
    }, [showSuggestions, searchInput])

    const handleSearchChange = (e) => {
        setSearchInput(e.target.value)
    }

    const handleClearSearch = () => {
        setSearchInput('')
        setSearchQuery('')
    }

    const handleSuggestionClick = (site) => {
        setIsFocused(false)
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur()
        }
        handleSiteClick(site)
    }

    // Подсветка всех вхождений всех слов запроса
    const highlightMatch = (text, query) => {
        if (!text) return text
        const q = query.trim()
        if (!q) return text
        const words = q.toLowerCase().split(/\s+/).filter(Boolean)
        if (words.length === 0) return text

        const lower = text.toLowerCase()
        const ranges = []
        words.forEach(w => {
            let from = 0
            while (true) {
                const idx = lower.indexOf(w, from)
                if (idx === -1) break
                ranges.push([idx, idx + w.length])
                from = idx + w.length
            }
        })
        if (ranges.length === 0) return text

        ranges.sort((a, b) => a[0] - b[0])
        const merged = []
        for (const r of ranges) {
            const last = merged[merged.length - 1]
            if (last && r[0] <= last[1]) {
                last[1] = Math.max(last[1], r[1])
            } else {
                merged.push([...r])
            }
        }

        const parts = []
        let cursor = 0
        merged.forEach(([start, end], i) => {
            if (cursor < start) parts.push(text.slice(cursor, start))
            parts.push(
                <span key={i} className={styles.suggestionMatch}>
                    {text.slice(start, end)}
                </span>
            )
            cursor = end
        })
        if (cursor < text.length) parts.push(text.slice(cursor))
        return <>{parts}</>
    }

    // === ФИЛЬТР ===
    const [filter, setFilter] = useState(() => {
        return localStorage.getItem('sitesFilter') || 'all'
    })

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter)
        localStorage.setItem('sitesFilter', newFilter)
    }

    // === СОХРАНЕНИЕ ДАТЫ ОТКРЫТИЯ ===
    const saveLastOpened = (siteId) => {
        try {
            const now = new Date().toISOString()
            const data = readLastOpened()
            data[siteId] = now
            localStorage.setItem('siteLastOpened', JSON.stringify(data))
            setLastOpened(data)
        } catch (e) {
            console.warn('Ошибка сохранения даты открытия:', e)
        }
    }

    const handleSave = async ({ name, address, color, salaryPart, photo }) => {
        try {
            const newSite = await addSite({ name, address, color, salaryPart, photo })
            const siteData = newSite[0] || newSite
            addSiteToState(siteData)
            if (onAddSite) {
                onAddSite(siteData)
            }
            setShowAddModal(false)
        } catch (err) {
            throw err
        }
    }

    const handleUpdate = async (payload) => {
        try {
            const updated = await updateSite(payload)
            updateSiteInState(updated)
            if (selectedSite && selectedSite.id === updated.id) {
                setSelectedSite(updated)
            }
            setShowEditModal(false)
        } catch (err) {
            console.error('❌ Ошибка обновления:', err)
            throw err
        }
    }

    const handleArchive = async (siteId) => {
        try {
            await archiveSiteInState(siteId)
            try {
                const data = readLastOpened()
                if (data[siteId]) {
                    delete data[siteId]
                    localStorage.setItem('siteLastOpened', JSON.stringify(data))
                    setLastOpened(data)
                }
            } catch (e) {
                console.warn('Ошибка удаления даты открытия:', e)
            }
        } catch (error) {
            console.error('❌ Ошибка архивации:', error)
            alert('Не удалось архивировать объект: ' + error.message)
        }
    }

    const handleSiteClick = (site) => {
        setIsRecentOpen(false)
        saveLastOpened(site.id)
        const container = document.querySelector('.sites-grid')
        if (container) {
            setScrollPosition(container.scrollTop)
        }
        setSelectedSite(site)
    }

    const handleCloseDetail = () => {
        setSelectedSite(null)
        setIsRecentOpen(false)
        setTimeout(() => {
            const container = document.querySelector('.sites-grid')
            if (container) {
                container.scrollTop = scrollPosition
            }
        }, 50)
    }

    const handleOpenAddModal = () => {
        setShowAddModal(true)
    }

    const handleOpenEditModal = (site) => {
        setEditingSite(site)
        setShowEditModal(true)
    }

    // === ОТСОРТИРОВАННЫЙ + ОТФИЛЬТРОВАННЫЙ СПИСОК ===
    // sortSitesByCalendar работает по visibleSites (без удалённых)
    const sortedSites = useMemo(
        () => sortSitesByCalendar(visibleSites, shifts),
        [visibleSites, shifts]
    )

    const filteredSites = searchQuery.trim()
        ? sortedSites.filter(site => matchesQuery(site, searchQuery))
        : sortedSites

    // === НЕДАВНИЕ: 5 последних открытых, по убыванию даты (только видимые) ===
    const recentSites = useMemo(() => {
        return visibleSites
            .map(site => ({ site, openedAt: lastOpened[site.id] }))
            .filter(item => item.openedAt)
            .sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt))
            .slice(0, RECENT_LIMIT)
            .map(item => item.site)
    }, [visibleSites, lastOpened])

    if (loading) {
        return <div className={globalsStyles.loadingText}>⏳ Загрузка...</div>
    }

    if (error) {
        return (
            <div className={globalsStyles.errorContainer}>
                <div className={globalsStyles.errorIcon}>❌</div>
                <div className={globalsStyles.errorText}>Ошибка загрузки объектов</div>
                <div className={globalsStyles.errorDetail}>{error}</div>
            </div>
        )
    }

    if (selectedSite) {
        return (
            <>
                <SiteDetailPage
                    site={selectedSite}
                    onClose={handleCloseDetail}
                    onArchive={handleArchive}
                    onEdit={handleOpenEditModal}
                />
                <EditSiteModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleUpdate}
                    site={editingSite}
                />
            </>
        )
    }

    return (
        <>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Объекты</h1>
                <button
                    className={styles.addBtn}
                    onClick={handleOpenAddModal}
                    aria-label="Добавить объект"
                >
                    <Plus size={20} strokeWidth={2.5} />
                    <span className={styles.addBtnLabel}>Добавить</span>
                </button>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrap} ref={searchWrapRef}>
                    <div className={styles.searchField}>
                        <Magnifier className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Поиск по названию или адресу"
                            value={searchInput}
                            onChange={handleSearchChange}
                            onFocus={() => setIsFocused(true)}
                            autoComplete="off"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                className={styles.searchClearBtn}
                                onClick={handleClearSearch}
                                aria-label="Очистить поиск"
                            >
                                <Xmark />
                            </button>
                        )}
                    </div>
                </div>

                {!showSuggestions && (
                    <>
                        {/* === НЕДАВНИЕ: сворачиваемые === */}
                        {recentSites.length > 0 && (
                            <div className={styles.recentSection}>
                                <button
                                    type="button"
                                    className={`${styles.recentToggle} ${isRecentOpen ? styles.recentToggleOpen : ''}`}
                                    onClick={() => setIsRecentOpen(v => !v)}
                                >
                                    <span className={styles.recentTitle}>
                                        {isRecentOpen ? 'Скрыть недавние' : 'Открыть недавние'}
                                    </span>
                                    <span className={styles.recentChevron}>›</span>
                                </button>

                                <div
                                    className={`${styles.recentChipsWrap} ${isRecentOpen ? styles.recentChipsWrapOpen : ''}`}
                                >
                                    <div
                                        className={styles.recentChipsScroll}
                                        ref={recentChipsRef}
                                    >
                                        {recentSites.map(site => (
                                            <button
                                                key={`recent-${site.id}`}
                                                type="button"
                                                className={styles.recentChip}
                                                onClick={() => handleSiteClick(site)}
                                            >
                                                <span
                                                    className={styles.recentChipDot}
                                                    style={{ backgroundColor: site.color || '#2d7d46' }}
                                                />
                                                <span className={styles.recentChipName}>{site.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={styles.segmented}>
                            <button
                                className={`${styles.segment} ${filter === 'all' ? styles.segmentActive : ''}`}
                                onClick={() => handleFilterChange('all')}
                            >
                                Все
                            </button>
                            <button
                                className={`${styles.segment} ${filter === 'active' ? styles.segmentActive : ''}`}
                                onClick={() => handleFilterChange('active')}
                            >
                                В работе
                            </button>
                            <button
                                className={`${styles.segment} ${filter === 'completed' ? styles.segmentActive : ''}`}
                                onClick={() => handleFilterChange('completed')}
                            >
                                Завершенные
                            </button>
                        </div>

                        <SitesList
                            sites={filteredSites}
                            filter={filter}
                            onSiteClick={handleSiteClick}
                            onCreate={handleOpenAddModal}
                            hasAnySites={visibleSites.length > 0}
                            searchQuery={searchQuery}
                        />
                    </>
                )}
            </div>

            {showSuggestions && dropdownRect && createPortal(
                <div
                    data-sites-suggestions
                    className={styles.suggestions}
                    style={{
                        position: 'fixed',
                        top: dropdownRect.top,
                        left: dropdownRect.left,
                        width: dropdownRect.width
                    }}
                >
                    {suggestions.length > 0 ? (
                        suggestions.map(site => (
                            <button
                                key={site.id}
                                type="button"
                                className={styles.suggestionItem}
                                onClick={() => handleSuggestionClick(site)}
                            >
                                <span className={styles.suggestionText}>
                                    {highlightMatch(site.name, searchInput)}
                                </span>
                                {site.address && (
                                    <span className={styles.suggestionAddress}>
                                        {highlightMatch(site.address, searchInput)}
                                    </span>
                                )}
                            </button>
                        ))
                    ) : (
                        <div className={styles.suggestionEmpty}>Ничего не найдено</div>
                    )}
                </div>,
                document.body
            )}

            <AddSiteModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={handleSave}
                usedColors={sites.map(s => s.color).filter(Boolean)}
            />
        </>
    )
}