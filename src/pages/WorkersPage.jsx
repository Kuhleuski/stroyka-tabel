import { useState } from 'react'
import { WorkersList } from '../components/Workers/WorkersList'
import { AddWorkerPage } from './AddWorkerPage'
import { WorkerDetailPage } from './WorkerDetailPage'
import { addWorker, deleteWorker } from '../services/supabase'
import { useWorkers } from '../hooks/useWorkers'
import { Plus } from 'lucide-react'
import styles from '../styles/workers.module.css'
import globalsStyles from '../styles/globals.module.css'
import compStyles from '../styles/components.module.css'

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
    const [showAddForm, setShowAddForm] = useState(false)
    const [selectedWorker, setSelectedWorker] = useState(null)
    const [scrollPosition, setScrollPosition] = useState(0)
    const { workers, loading, error, addWorkerToState, removeWorkerFromState } = useWorkers()

    const handleSave = async (name, avatarFile) => {
        try {
            const newWorker = await addWorker(name, avatarFile)
            const workerData = newWorker[0] || newWorker
            addWorkerToState(workerData)
            setShowAddForm(false)
        } catch (err) {
            throw err
        }
    }

    const handleDelete = async (workerId) => {
        await deleteWorker(workerId)
        removeWorkerFromState(workerId)
    }

    const handleWorkerClick = (worker) => {
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

    const handleOpenAddForm = () => {
        setShowAddForm(true)
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
            <WorkerDetailPage 
                worker={selectedWorker}
                onClose={handleCloseDetail}
                onDelete={handleDelete}
                shifts={shifts}
            />
        )
    }

    if (showAddForm) {
        return (
            <AddWorkerPage 
                onSave={handleSave}
                onCancel={() => setShowAddForm(false)}
            />
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
                <button 
                    className={styles.addWorkerBtn}
                    onClick={handleOpenAddForm}
                >
                    + Добавить рабочего
                </button>
            </div>

            <WorkersList 
                workers={workers} 
                onWorkerClick={handleWorkerClick}
            />

            {/* ПЛАВАЮЩАЯ КНОПКА (FAB) — дублирует "Добавить работника" */}
            <button 
                className={styles.fabAddWorker}
                onClick={handleOpenAddForm}
                aria-label="Добавить работника"
            >
                <Plus size={28} strokeWidth={2.5} />
            </button>
        </>
    )
}
