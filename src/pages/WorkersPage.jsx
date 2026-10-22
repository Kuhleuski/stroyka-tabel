import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { WorkersList } from '../components/Workers/WorkersList'
import { WorkerStatsPage } from './WorkerStatsPage'
import { AddWorkerModal } from '../components/AddWorkerModal'
import { EditWorkerModal } from '../components/EditWorkerModal'
import { addWorker, updateWorker } from '../services/supabase'
import { useWorkers } from '../hooks/useWorkers'
import { useSites } from '../hooks/useSites'
import { useAvatars } from '../context/AvatarContext'
import { Plus } from 'lucide-react'
import Magnifier from '@gravity-ui/icons/Magnifier'
import Xmark from '@gravity-ui/icons/Xmark'
import styles from '../styles/workers.module.css'
import globalsStyles from '../styles/globals.module.css'

const SEARCH_DEBOUNCE = 250

const matchesQuery = (worker, query) => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (words.length === 0) return true
    const haystack = (worker.name || '').toLowerCase()
    return words.every(w => haystack.includes(w))
}

const SavingOverlay = () => (
    <div className={styles.savingOverlay}>
        <div className={styles.savingSpinner}></div>
        <div className={styles.savingText}>Сохранение...</div>
    </div>
)

export function WorkersPage({ shifts, onOpenWorkerStats, onCloseWorkerStats }) {
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedWorker, setSelectedWorker] = useState(null)
    const [editingWorker, setEditingWorker] = useState(null)
    const [scrollPosition, setScrollPosition] = useState(0)
    const [refreshKey, setRefreshKey] = useState(0)
    const [isSaving, setIsSaving] = useState(false)

    const [filterStatus, setFilterStatus] = useState('all')

    const [showArchiveModal, setShowArchiveModal] = useState(false)
    const [workerToArchive, setWorkerToArchive] = useState(null)

    const [searchInput, setSearchInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const [dropdownRect, setDropdownRect] = useState(null)
    const searchWrapRef = useRef(null)

    const { workers, loading, error, addWorkerToState, removeWorkerFromState, updateWorkerInState, refreshWorkers, archiveWorkerInState } = useWorkers()
    const { sites, archivedSites } = useSites()
    const { refreshAvatars } = useAvatars()

    useEffect(() => {
        const t = setTimeout(() => setSearchQuery(searchInput), SEARCH_DEBOUNCE)
        return () => clearTimeout(t)
    }, [searchInput])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
                if (e.target.closest && e.target.closest('[data-workers-suggestions]')) return
                setIsFocused(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const suggestions = useMemo(() => {
        const q = searchInput.trim()
        if (!q) return []
        return workers
            .filter(w => matchesQuery(w, q))
            .slice(0, 6)
    }, [searchInput, workers])

    const showSuggestions = isFocused && searchInput.trim().length > 0

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

    const handleClearSearch = () => {
        setSearchInput('')
        setSearchQuery('')
    }

    const handleSuggestionClick = (worker) => {
        setIsFocused(false)
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur()
        }
        handleWorkerClick(worker)
    }

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

    const saveLastOpened = (workerId) => {
        try {
            const now = new Date().toISOString()
            const stored = localStorage.getItem('workerLastOpened')
            const data = stored ? JSON.parse(stored) : {}
            data[workerId] = now
            localStorage.setItem('workerLastOpened', JSON.stringify(data))
        } catch (e) {
            console.warn('Ошибка сохранения даты открытия работника:', e)
        }
    }

    const forceRefresh = async () => {
        setRefreshKey(prev => prev + 1)
        await refreshWorkers()
        if (selectedWorker) {
            const updated = workers.find(w => w.id === selectedWorker.id)
            if (updated && updated.status !== selectedWorker.status) {
                setSelectedWorker(updated)
            }
        }
    }

    const handleSave = async (name, avatarFile, phone) => {
        setIsSaving(true)
        try {
            const newWorker = await addWorker(name, avatarFile, phone)
            const workerData = newWorker[0] || newWorker
            try { localStorage.setItem('newWorkerId', String(workerData.id)) } catch (e) {}
            addWorkerToState(workerData)
            await refreshAvatars()
            await forceRefresh()
            setShowAddModal(false)
            await new Promise(r => setTimeout(r, 200))
            setSelectedWorker(workerData)
            await new Promise(r => setTimeout(r, 150))
        } catch (err) {
            console.error('❌ Ошибка при создании работника:', err)
            throw err
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpdate = async (workerId, name, avatarFile, status, phone) => {
        setIsSaving(true)
        try {
            const updated = await updateWorker(workerId, name, avatarFile, status, phone)
            updateWorkerInState(updated)
            await refreshAvatars()
            await forceRefresh()
            if (selectedWorker && selectedWorker.id === workerId) {
                setSelectedWorker(updated)
            }
            setShowEditModal(false)
            await new Promise(r => setTimeout(r, 200))
        } catch (err) {
            console.error('❌ Ошибка при обновлении работника:', err)
            throw err
        } finally {
            setIsSaving(false)
        }
    }

    const handleArchive = async (workerId) => {
        try {
            await archiveWorkerInState(workerId)
            try {
                const stored = localStorage.getItem('workerLastOpened')
                if (stored) {
                    const data = JSON.parse(stored)
                    delete data[workerId]
                    localStorage.setItem('workerLastOpened', JSON.stringify(data))
                }
            } catch (e) {}
        } catch (error) {
            console.error('❌ Ошибка архивации:', error)
            alert('Не удалось архивировать работника: ' + error.message)
            throw error
        }
    }

    // Вызывается из WorkerStatsPage из пункта «Удалить работника».
    // После удаления закрываем страницу работника, чтобы вернуться к списку.
    const handleArchiveFromStats = async (workerId) => {
        await handleArchive(workerId)
        // Страница закроется в WorkerStatsPage после успеха, но на всякий случай
        // ничего тут дополнительно не делаем — onClose там уже вызовется.
    }

    const handleWorkerClick = (worker) => {
        saveLastOpened(worker.id)
        const container = document.querySelector('.workers-grid-container')
        if (container) setScrollPosition(container.scrollTop)
        setSelectedWorker(worker)
        if (onOpenWorkerStats) onOpenWorkerStats()
    }

    const handleCloseDetail = () => {
        setSelectedWorker(null)
        if (onCloseWorkerStats) onCloseWorkerStats()
        setTimeout(() => {
            const container = document.querySelector('.workers-grid-container')
            if (container) container.scrollTop = scrollPosition
        }, 50)
    }

    const handleOpenAddModal = () => setShowAddModal(true)
    const handleOpenEditModal = (worker) => {
        setEditingWorker(worker)
        setShowEditModal(true)
    }

    const handleArchiveClick = (worker) => {
        setWorkerToArchive(worker)
        setShowArchiveModal(true)
    }
    const handleConfirmArchive = async () => {
        if (workerToArchive) {
            await handleArchive(workerToArchive.id)
            setShowArchiveModal(false)
            setWorkerToArchive(null)
        }
    }
    const handleCancelArchive = () => {
        setShowArchiveModal(false)
        setWorkerToArchive(null)
    }

    const filteredWorkers = useMemo(() => {
        let list = workers || []
        if (searchQuery.trim()) {
            list = list.filter(w => matchesQuery(w, searchQuery))
        }
        return list
    }, [workers, searchQuery])

    if (loading) {
        return <div className={globalsStyles.loadingText}>⏳ Загрузка...</div>
    }

    if (error) {
        return (
            <div className={globalsStyles.errorContainer}>
                <div className={globalsStyles.errorIcon}>❌</div>
                <div className={globalsStyles.errorText}>Ошибка загрузки работников</div>
                <div className={globalsStyles.errorDetail}>{error}</div>
            </div>
        )
    }

    return (
        <>
            {isSaving && <SavingOverlay />}

            {selectedWorker ? (
                <>
                    <WorkerStatsPage
                        worker={selectedWorker}
                        shifts={shifts}
                        sites={sites}
                        archivedSites={archivedSites}
                        onClose={handleCloseDetail}
                        onEdit={handleOpenEditModal}
                        onRefresh={forceRefresh}
                        onArchive={handleArchiveFromStats}
                    />
                    <EditWorkerModal
                        isOpen={showEditModal}
                        onClose={() => setShowEditModal(false)}
                        onSave={handleUpdate}
                        worker={editingWorker}
                    />
                </>
            ) : (
                <>
                    <div className={styles.pageHeader}>
                        <h1 className={styles.pageTitle}>Бригада</h1>
                        <button
                            className={styles.addBtn}
                            onClick={handleOpenAddModal}
                            aria-label="Добавить работника"
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
                                    placeholder="Поиск по имени или фамилии"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
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
                                        className={`${styles.segment} ${filterStatus === 'all' ? styles.segmentActive : ''}`}
                                        onClick={() => setFilterStatus('all')}
                                    >
                                        Все
                                    </button>
                                    <button
                                        className={`${styles.segment} ${filterStatus === 'active' ? styles.segmentActive : ''}`}
                                        onClick={() => setFilterStatus('active')}
                                    >
                                        Работают
                                    </button>
                                    <button
                                        className={`${styles.segment} ${filterStatus === 'inactive' ? styles.segmentActive : ''}`}
                                        onClick={() => setFilterStatus('inactive')}
                                    >
                                        Не работают
                                    </button>
                                </div>

                                <WorkersList
                                    key={refreshKey}
                                    refreshKey={refreshKey}
                                    workers={filteredWorkers}
                                    filterStatus={filterStatus}
                                    onWorkerClick={handleWorkerClick}
                                    onArchiveClick={handleArchiveClick}
                                />
                            </>
                        )}
                    </div>

                    <AddWorkerModal
                        isOpen={showAddModal}
                        onClose={() => setShowAddModal(false)}
                        onSave={handleSave}
                    />

                    {showArchiveModal && workerToArchive && (
                        <div className={styles.deleteModalOverlay} onClick={handleCancelArchive}>
                            <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
                                <div className={styles.deleteModalTitle}>Архивировать работника</div>
                                <div className={styles.deleteModalText}>
                                    Вы уверены, что хотите архивировать <strong>{workerToArchive.name}</strong>?
                                    <br />
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
                                        Работник будет перемещён в архив.
                                    </span>
                                </div>
                                <div className={styles.deleteModalActions}>
                                    <button className={styles.deleteModalCancelBtn} onClick={handleCancelArchive}>
                                        Отмена
                                    </button>
                                    <button className={styles.deleteModalConfirmBtn} onClick={handleConfirmArchive}>
                                        Архивировать
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showSuggestions && dropdownRect && createPortal(
                        <div
                            data-workers-suggestions
                            className={styles.suggestions}
                            style={{
                                position: 'fixed',
                                top: dropdownRect.top,
                                left: dropdownRect.left,
                                width: dropdownRect.width
                            }}
                        >
                            {suggestions.length > 0 ? (
                                suggestions.map(worker => (
                                    <button
                                        key={worker.id}
                                        type="button"
                                        className={styles.suggestionItem}
                                        onClick={() => handleSuggestionClick(worker)}
                                    >
                                        <span className={styles.suggestionText}>
                                            {highlightMatch(worker.name, searchInput)}
                                        </span>
                                    </button>
                                ))
                            ) : (
                                <div className={styles.suggestionEmpty}>Ничего не найдено</div>
                            )}
                        </div>,
                        document.body
                    )}
                </>
            )}
        </>
    )
}