import { useState } from 'react'
import { WorkersList } from '../components/Workers/WorkersList'
import { WorkerStatsPage } from './WorkerStatsPage'
import { AddWorkerModal } from '../components/AddWorkerModal'
import { EditWorkerModal } from '../components/EditWorkerModal'
import { addWorker, deleteWorker, updateWorker } from '../services/supabase'
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

export function WorkersPage({ shifts }) {
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedWorker, setSelectedWorker] = useState(null)
    const [editingWorker, setEditingWorker] = useState(null)
    const [scrollPosition, setScrollPosition] = useState(0)
    const [refreshKey, setRefreshKey] = useState(0)
    const [isSaving, setIsSaving] = useState(false)
    const { workers, loading, error, addWorkerToState, removeWorkerFromState, updateWorkerInState } = useWorkers()
    const { sites } = useSites()
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
    const forceRefresh = () => {
        setRefreshKey(prev => prev + 1)
    }

    const handleSave = async (name, avatarFile) => {
        setIsSaving(true)
        
        try {
            const newWorker = await addWorker(name, avatarFile)
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
            forceRefresh()
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

    const handleUpdate = async (workerId, name, avatarFile, status) => {
        setIsSaving(true)
        
        try {
            const updated = await updateWorker(workerId, name, avatarFile, status)
            
            console.log('📝 Обновлён работник:', updated)
            
            updateWorkerInState(updated)
            await refreshAvatars()
            forceRefresh()
            
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

    const handleDelete = async (workerId) => {
        setIsSaving(true)
        
        try {
            await deleteWorker(workerId)
            removeWorkerFromState(workerId)
            await refreshAvatars()
            forceRefresh()
            
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
            
            await new Promise(resolve => setTimeout(resolve, 200))
            
        } catch (err) {
            console.error('❌ Ошибка при удалении работника:', err)
            throw err
        } finally {
            setIsSaving(false)
        }
    }

    const handleWorkerClick = (worker) => {
        saveLastOpened(worker.id)
        
        const container = document.querySelector('.workers-grid-container')
        if (container) {
            setScrollPosition(container.scrollTop)
        }
        setSelectedWorker(worker)
    }

    const handleCloseDetail = () => {
        setSelectedWorker(null)
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
                        key={refreshKey}
                        worker={selectedWorker}
                        shifts={shifts}
                        sites={sites}
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
                        </div>
                    </div>

                    <WorkersList 
                        key={refreshKey}
                        refreshKey={refreshKey}
                        workers={workers} 
                        onWorkerClick={handleWorkerClick}
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
                </>
            )}
        </>
    )
}