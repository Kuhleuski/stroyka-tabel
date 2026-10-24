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

// Проверка: каждое слово запроса встречается в названии ИЛИ адресе (в любом порядке)
const matchesQuery = (site, query) => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (words.length === 0) return true
    const haystack = `${site.name || ''} ${site.address || ''}`.toLowerCase()
    return words.every(w => haystack.includes(w))
}

export function SitesPage({ onAddSite }) {
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

    useEffect(() => {
        const t = setTimeout(() => setSearchQuery(searchInput), SEARCH_DEBOUNCE)
        return () => clearTimeout(t)
    }, [searchInput])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
                // клик по порталу не должен закрывать выпадашку
                if (e.target.closest && e.target.closest('[data-sites-suggestions]')) return
                setIsFocused(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Подсказки: по словам в названии ИЛИ адресе
    const suggestions = useMemo(() => {
        const q = searchInput.trim()
        if (!q) return []
        return sites
            .filter(s => matchesQuery(s, q))
            .slice(0, 6)
    }, [searchInput, sites])

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
            const stored = localStorage.getItem('siteLastOpened')
            const data = stored ? JSON.parse(stored) : {}
            data[siteId] = now
            localStorage.setItem('siteLastOpened', JSON.stringify(data))
        } catch (e) {
            console.warn('Ошибка сохранения даты открытия:', e)
        }
    }

    const handleSave = async (name, address, color) => {
        try {
            const newSite = await addSite(name, address, color)
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

    const handleUpdate = async (siteId, name, address, color, status) => {
        try {
            const updated = await updateSite(siteId, name, address, color, status)
            updateSiteInState(updated)
            if (selectedSite && selectedSite.id === siteId) {
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
                const stored = localStorage.getItem('siteLastOpened')
                if (stored) {
                    const data = JSON.parse(stored)
                    delete data[siteId]
                    localStorage.setItem('siteLastOpened', JSON.stringify(data))
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
        saveLastOpened(site.id)
        const container = document.querySelector('.sites-grid')
        if (container) {
            setScrollPosition(container.scrollTop)
        }
        setSelectedSite(site)
    }

    const handleCloseDetail = () => {
        setSelectedSite(null)
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

    // === ФИЛЬТРАЦИЯ СПИСКА ===
    const filteredSites = searchQuery.trim()
        ? sites.filter(site => matchesQuery(site, searchQuery))
        : sites

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
                        />
                    </>
                )}
            </div>

            {/* Подсказки — через портал, поверх всего */}
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