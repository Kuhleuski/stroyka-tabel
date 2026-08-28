import { useState } from 'react'
import { WorkersList } from '../components/Workers/WorkersList'
import { WorkerStatsPage } from './WorkerStatsPage'
import { AddWorkerModal } from '../components/AddWorkerModal'
import { EditWorkerModal } from '../components/EditWorkerModal'
import { addWorker, updateWorker } from '../services/supabase'
import { useWorkers } from '../hooks/useWorkers'
import { useSites } from '../hooks/useSites'
import { useAvatars } from '../context/AvatarContext'
import { Plus } from 'lucide-react'
import styles from '../styles/workers.module.css'
import globalsStyles from '../styles/globals.module.css'

// === ПЛОСКАЯ ИКОНКА ДЛЯ ЗАГОЛОВКА ===
const WorkersIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
)

// === ПРЕЛОАДЕР ===
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
    // ⭐ Состояние для фильтра
    const [filterStatus, setFilterStatus] = useState('all') // 'all' | 'active' | 'inactive'
    
    // ⭐ Для модалки архивации
    const [showArchiveModal, setShowArchiveModal] = useState(false)
    const [workerToArchive, setWorkerToArchive] = useState(null)
    
    const { workers, loading, error, addWorkerToState, removeWorkerFromState, updateWorkerInState, refreshWorkers, archiveWorkerInState } = useWorkers()
    const { sites, archivedSites } = useSites()  // ← ДОБАВЛЯЕМ archivedSites
    const { refreshAvatars } = useAvatars()

    // === СОХРАНЕНИЕ ДАТЫ ПОСЛЕДНЕГО ОТКРЫТИЯ ===
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

    // === ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ ===
    const forceRefresh = async () => {
        console.log('🔄 forceRefresh: обновление списка...')
        setRefreshKey(prev => prev + 1)
        await refreshWorkers()
        
        if (selectedWorker) {
            const updated = workers.find(w => w.id === selectedWorker.id)
            if (updated && updated.status !== selectedWorker.status) {
                console.log('🔄 forceRefresh: обновляем selectedWorker:', updated)
                setSelectedWorker(updated)
            }
        }
    }

const handleSave = async (name, avatarFile, phone) => {
    setIsSaving(true)
    
    try {
        const newWorker = await addWorker(name, avatarFile, phone)
        const workerData = newWorker[0] || newWorker
        
        console.log('📝 Создан работник:', workerData)
        
        try {
            localStorage.setItem('newWorkerId', String(workerData.id))
            console.log('📝 Сохранён ID нового работника:', workerData.id)
        } catch (e) {
            console.warn('Ошибка сохранения ID нового работника:', e)
        }
        
        addWorkerToState(workerData)
        await refreshAvatars()
        await forceRefresh()
        setShowAddModal(false)
        
        await new Promise(resolve => setTimeout(resolve, 200))
        
        console.log('🔄 Переход на страницу деталей нового работника:', workerData.name)
        setSelectedWorker(workerData)
        await new Promise(resolve => setTimeout(resolve, 150))
        
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
        
        console.log('📝 Обновлён работник:', updated)
        
        updateWorkerInState(updated)
        await refreshAvatars()
        await forceRefresh()
        
        if (selectedWorker && selectedWorker.id === workerId) {
            setSelectedWorker(updated)
        }
        
        setShowEditModal(false)
        await new Promise(resolve => setTimeout(resolve, 200))
        
    } catch (err) {
        console.error('❌ Ошибка при обновлении работника:', err)
        throw err
    } finally {
        setIsSaving(false)
    }
}

    // === АРХИВАЦИЯ ===
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
            } catch (e) {
                console.warn('Ошибка удаления даты открытия работника:', e)
            }
        } catch (error) {
            console.error('❌ Ошибка архивации:', error)
            alert('Не удалось архивировать работника: ' + error.message)
        }
    }

    const handleWorkerClick = (worker) => {
        saveLastOpened(worker.id)
        
        const container = document.querySelector('.workers-grid-container')
        if (container) {
            setScrollPosition(container.scrollTop)
        }
        setSelectedWorker(worker)
        
        if (onOpenWorkerStats) {
            onOpenWorkerStats()
        }
    }

    const handleCloseDetail = () => {
        setSelectedWorker(null)
        
        if (onCloseWorkerStats) {
            onCloseWorkerStats()
        }
        
        setTimeout(() => {
            const container = document.querySelector('.workers-grid-container')
            if (container) {
                container.scrollTop = scrollPosition
            }
        }, 50)
    }

    const handleOpenAddModal = () => {
        setShowAddModal(true)
    }

    const handleOpenEditModal = (worker) => {
        console.log('🔄 Открываем редактирование для:', worker.name)
        setEditingWorker(worker)
        setShowEditModal(true)
    }

    // ⭐ ОБРАБОТЧИКИ ДЛЯ МОДАЛКИ АРХИВАЦИИ
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
                        archivedSites={archivedSites}  // ← ДОБАВЛЯЕМ
                        onClose={handleCloseDetail}
                        onEdit={handleOpenEditModal}
                        onRefresh={forceRefresh}
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
                        <div>
                            <div className={styles.pageTitle}>
                                <WorkersIcon />
                                Бригада
                            </div>
                            <div className={styles.pageSubtitle}>
                                Список всех работников компании
                            </div>
                        </div>
                    </div>

                    {/* ⭐ ЧИПСЫ-ФИЛЬТРЫ */}
                    <div className={styles.filterWrapper}>
                        <span className={styles.filterLabel}>Показать:</span>
                        <div className={styles.filterButtons}>
                            <button 
                                className={`${styles.filterBtn} ${filterStatus === 'all' ? styles.filterActive : ''}`}
                                onClick={() => setFilterStatus('all')}
                            >
                                Все
                            </button>
                            <button 
                                className={`${styles.filterBtn} ${filterStatus === 'active' ? styles.filterActive : ''}`}
                                onClick={() => setFilterStatus('active')}
                            >
                                <span className={styles.filterDot} style={{ backgroundColor: '#2d7d46' }} />
                                Работают
                            </button>
                            <button 
                                className={`${styles.filterBtn} ${filterStatus === 'inactive' ? styles.filterActive : ''}`}
                                onClick={() => setFilterStatus('inactive')}
                            >
                                <span className={styles.filterDotGray} style={{ backgroundColor: '#888888' }} />
                                Не работают
                            </button>
                        </div>
                    </div>

                    <WorkersList 
                        key={refreshKey}
                        refreshKey={refreshKey}
                        workers={workers} 
                        filterStatus={filterStatus}
                        onWorkerClick={handleWorkerClick}
                        onArchiveClick={handleArchiveClick}
                    />

                    <button 
                        className={styles.fabAddWorker}
                        onClick={handleOpenAddModal}
                        aria-label="Добавить работника"
                    >
                        <Plus size={28} strokeWidth={2.5} />
                    </button>

                    <AddWorkerModal 
                        isOpen={showAddModal}
                        onClose={() => setShowAddModal(false)}
                        onSave={handleSave}
                    />

                    {/* ⭐ МОДАЛКА ПОДТВЕРЖДЕНИЯ АРХИВАЦИИ */}
                    {showArchiveModal && workerToArchive && (
                        <div className={styles.deleteModalOverlay} onClick={handleCancelArchive}>
                            <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
                                <div className={styles.deleteModalTitle}>
                                    Архивировать работника
                                </div>
                                <div className={styles.deleteModalText}>
                                    Вы уверены, что хотите архивировать <strong>{workerToArchive.name}</strong>?
                                    <br />
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
                                        Работник будет перемещён в архив.
                                    </span>
                                </div>
                                <div className={styles.deleteModalActions}>
                                    <button 
                                        className={styles.deleteModalCancelBtn}
                                        onClick={handleCancelArchive}
                                    >
                                        Отмена
                                    </button>
                                    <button 
                                        className={styles.deleteModalConfirmBtn}
                                        onClick={handleConfirmArchive}
                                    >
                                        Архивировать
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    )
}