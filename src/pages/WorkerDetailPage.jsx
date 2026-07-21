import { useState } from 'react'
import { WorkerCalendar } from '../components/Workers/WorkerCalendar'

export function WorkerDetailPage({ worker, onClose, onDelete, shifts }) {
    const [showConfirm, setShowConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await onDelete(worker.id)
            onClose()
        } catch (error) {
            console.error('Ошибка удаления:', error)
            alert('Не удалось удалить работника')
        } finally {
            setDeleting(false)
            setShowConfirm(false)
        }
    }

    // Фильтруем смены только для этого работника
    const workerShifts = shifts ? shifts.filter(s => s.worker_name === worker.name) : []

    return (
        <div className="worker-detail-page">
            <div className="worker-detail-header">
                <span className="worker-detail-title">👷 {worker.name}</span>
                <button className="worker-detail-close" onClick={onClose}>
                    ✕
                </button>
            </div>
            
            <div className="worker-detail-content">
                <div className="worker-detail-field">
                    <span className="worker-detail-label">Имя</span>
                    <span className="worker-detail-value">{worker.name}</span>
                </div>
                
                <div className="worker-detail-field">
                    <span className="worker-detail-label">Дата добавления</span>
                    <span className="worker-detail-value">{formatDate(worker.created_at)}</span>
                </div>

                {/* Календарь */}
                <div className="worker-detail-calendar-section">
                    <div className="worker-detail-section-title">📅 График работы</div>
                    <WorkerCalendar 
                        shifts={workerShifts} 
                        workerName={worker.name}
                    />
                </div>
                
                <div className="worker-detail-hint">
                    Здесь будет статистика по работнику
                </div>

                <button 
                    className="worker-detail-delete"
                    onClick={() => setShowConfirm(true)}
                    disabled={deleting}
                >
                    {deleting ? '⏳ Удаление...' : '🗑️ Удалить работника'}
                </button>
            </div>

            {showConfirm && (
                <div className="confirm-overlay">
                    <div className="confirm-modal">
                        <div className="confirm-icon">⚠️</div>
                        <div className="confirm-title">Удалить работника?</div>
                        <div className="confirm-text">
                            Вы уверены, что хотите удалить работника <strong>«{worker.name}»</strong>?
                            <br />
                            <span style={{ fontSize: '13px', color: '#999' }}>
                                Это действие нельзя отменить.
                            </span>
                        </div>
                        <div className="confirm-buttons">
                            <button 
                                className="confirm-btn cancel"
                                onClick={() => setShowConfirm(false)}
                                disabled={deleting}
                            >
                                Отмена
                            </button>
                            <button 
                                className="confirm-btn delete"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? 'Удаление...' : 'Удалить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
