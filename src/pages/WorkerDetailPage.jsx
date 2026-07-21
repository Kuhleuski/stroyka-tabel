import { useState } from 'react'
import { WorkerCalendar } from '../components/Workers/WorkerCalendar'

export function WorkerDetailPage({ worker, onClose, onDelete, shifts }) {
    const [showConfirm, setShowConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)

    // Функция для получения цвета аватарки на основе имени
    const getAvatarColor = (name) => {
        const colors = ['#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#FDD835', '#FFB300', '#FB8C00', '#F4511E', '#6D4C41', '#78909C']
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return colors[index % colors.length]
    }

    // Функция для получения инициалов
    const getInitials = (name) => {
        if (!name) return '?'
        const parts = name.trim().split(' ')
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    }

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

    const hasPhoto = worker.avatar_url && worker.avatar_url.startsWith('http')
    const initials = getInitials(worker.name)
    const avatarColor = getAvatarColor(worker.name)

    return (
        <div className="worker-detail-page">
            <div className="worker-detail-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* АВАТАРКА */}
                    <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        backgroundColor: hasPhoto ? 'transparent' : avatarColor,
                        border: hasPhoto ? '2px solid #e8eaed' : 'none',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        fontWeight: 600,
                        color: 'white',
                        flexShrink: 0
                    }}>
                        {hasPhoto ? (
                            <img 
                                src={worker.avatar_url} 
                                alt={worker.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: '50%'
                                }}
                                onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.parentNode.style.backgroundColor = avatarColor
                                    e.target.parentNode.textContent = initials
                                }}
                            />
                        ) : (
                            initials
                        )}
                    </div>
                    <span className="worker-detail-title">👷 {worker.name}</span>
                </div>
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
