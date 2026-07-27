// src/pages/WorkersPage.jsx

import { useState } from 'react'
import { WorkersList } from '../components/Workers/WorkersList'
import { WorkerDetailPage } from './WorkerDetailPage'
import { AddWorkerModal } from '../components/AddWorkerModal'
import { EditWorkerModal } from '../components/EditWorkerModal'
import { addWorker, deleteWorker, updateWorker } from '../services/supabase'
import { useWorkers } from '../hooks/useWorkers'
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

export function WorkersPage({ shifts }) {
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedWorker, setSelectedWorker] = useState(null)
    const [editingWorker, setEditingWorker] = useState(null)
    const [scrollPosition, setScrollPosition] = useState(0)
    const [refreshKey, setRefreshKey] = useState(0)
    const { workers, loading, error, addWorkerToState, removeWorkerFromState, updateWorkerInState } = useWorkers()
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
        try {
            const newWorker = await addWorker(name, avatarFile)
            const workerData = newWorker[0] || newWorker
            
            console.log('📝 Создан работник:', workerData)
            
            // === СОХРАНЯЕМ ДАТУ СОЗДАНИЯ НОВОГО РАБОТНИКА ===
            try {
                const now = new Date().toISOString()
                localStorage.setItem('newWorkerCreated', now)
                console.log('📝 Сохранена дата нового работника:', now)
            } catch (e) {
                console.warn('Ошибка сохранения даты нового работника:', e)
            }
            
            // Добавляем в состояние
            addWorkerToState(workerData)
            
            // Обновляем кеш аватарок
            await refreshAvatars()
            
            // Принудительно обновляем список
            forceRefresh()
            
            // Закрываем модалку
            setShowAddModal(false)
            
            // === ПЕРЕХОД НА СТРАНИЦУ ДЕТАЛЕЙ НОВОГО РАБОТНИКА ===
            setTimeout(() => {
                console.log('🔄 Переход на страницу деталей нового работника:', workerData.name)
                setSelectedWorker(workerData)
            }, 100)
        } catch (err) {
            console.error('❌ Ошибка при создании работника:', err)
            throw err
        }
    }

    const handleUpdate = async (workerId, name, avatarFile) => {
        try {
            const updated = await updateWorker(workerId, name, avatarFile)
            
            console.log('📝 Обновлён работник:', updated)
            
            // Обновляем в состоянии
            updateWorkerInState(updated)
            
            // Обновляем кеш аватарок
            await refreshAvatars()
            
            // Принудительно обновляем список
            forceRefresh()
            
            // Обновляем данные в детальной странице
            if (selectedWorker && selectedWorker.id === workerId) {
                setSelectedWorker(updated)
            }
            
            setShowEditModal(false)
        } catch (err) {
            console.error('❌ Ошибка при обновлении работника:', err)
            throw err
        }
    }

    const handleDelete = async (workerId) => {
        await deleteWorker(workerId)
        removeWorkerFromState(workerId)
        
        // Обновляем кеш аватарок
        await refreshAvatars()
        
        // Принудительно обновляем список
        forceRefresh()
        
        // Удаляем запись о последнем открытии
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
    }

    const handleWorkerClick = (worker) => {
        // Сохраняем дату открытия
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

    if (selectedWorker) {
        return (
            <>
                <WorkerDetailPage 
                    key={refreshKey}
                    worker={selectedWorker}
                    onClose={handleCloseDetail}
                    onDelete={handleDelete}
                    onEdit={handleOpenEditModal}
                    shifts={shifts}
                />
                <EditWorkerModal 
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleUpdate}
                    worker={editingWorker}
                />
            </>
        )
    }

    return (
        <>
            <div className={styles.pageHeader}>
                <div>
                    <div className={styles.pageTitle}>
                        <WorkersIcon />
                        Бригада
                    </div>
                    <div className={styles.pageSubtitle}>Все рабочие</div>
                </div>
            </div>

            <WorkersList 
                key={refreshKey}
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
    )
}
