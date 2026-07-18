import { useState } from 'react'
import { WorkersList } from '../components/Workers/WorkersList'
import { AddWorkerPage } from './AddWorkerPage'
import { WorkerDetailPage } from './WorkerDetailPage'
import { addWorker, deleteWorker } from '../services/supabase'
import { useWorkers } from '../hooks/useWorkers'

export function WorkersPage() {
    const [showAddForm, setShowAddForm] = useState(false)
    const [selectedWorker, setSelectedWorker] = useState(null)
    const [scrollPosition, setScrollPosition] = useState(0)
    const { workers, loading, error, addWorkerToState, removeWorkerFromState } = useWorkers()

    const handleSave = async (name) => {
        try {
            const newWorker = await addWorker(name)
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
        const container = document.querySelector('.workers-list-container')
        if (container) {
            setScrollPosition(container.scrollTop)
        }
        setSelectedWorker(worker)
    }

    const handleCloseDetail = () => {
        setSelectedWorker(null)
        setTimeout(() => {
            const container = document.querySelector('.workers-list-container')
            if (container) {
                container.scrollTop = scrollPosition
            }
        }, 50)
    }

    if (loading) {
        return <div className="loading-text">⏳ Загрузка...</div>
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-icon">❌</div>
                <div className="error-text">Ошибка загрузки работников</div>
                <div className="error-detail">{error}</div>
            </div>
        )
    }

    if (selectedWorker) {
        return (
            <WorkerDetailPage 
                worker={selectedWorker}
                onClose={handleCloseDetail}
                onDelete={handleDelete}
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
            <div className="page-header">
                <div>
                    <div className="page-title">👷 Бригада</div>
                    <div className="page-subtitle">Все рабочие</div>
                </div>
                <button 
                    className="add-worker-btn"
                    onClick={() => setShowAddForm(true)}
                >
                    + Добавить работника
                </button>
            </div>
            <div className="workers-list-container">
                <WorkersList 
                    workers={workers} 
                    onWorkerClick={handleWorkerClick}
                />
            </div>
        </>
    )
}
