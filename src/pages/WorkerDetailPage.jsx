import { useState } from 'react'
import { WorkerCalendar } from '../components/Workers/WorkerCalendar'
import styles from '../styles/workers.module.css'
import compStyles from '../styles/components.module.css'

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
        <div className={styles.workerDetailPage}>
            <div className={styles.workerDetailHeader}>
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
                    <span className={styles.workerDetailTitle}>👷 {worker.name}</span>
                </div>
                <button className={styles.workerDetailClose} onClick={onClose}>
                    ✕
                </button>
            </div>
            
            <div className={styles.workerDetailContent}>
                <div className={styles.workerDetailField}>
                    <span className={styles.workerDetailLabel}>Имя</span>
                    <span className={styles.workerDetailValue}>{worker.name}</span>
                </div>
                
                <div className={styles.workerDetailField}>
                    <span className={styles.workerDetailLabel}>Дата добавления</span>
                    <span className={styles.workerDetailValue}>{formatDate(worker.created_at)}</span>
                </div>

                {/* Календарь */}
                <div className={styles.workerDetailCalendarSection}>
                    <div className={styles.workerDetailSectionTitle}>📅 График работы</div>
                    <WorkerCalendar 
                        shifts={workerShifts} 
                        workerName={worker.name}
                    />
                </div>
                
                <div className={styles.workerDetailHint}>
                    Здесь будет статистика по работнику
                </div>

                <button 
                    className={styles.workerDetailDelete}
                    onClick={() => setShowConfirm(true)}
                    disabled={deleting}
                >
                    {deleting ? '⏳ Удаление...' : '🗑️ Удалить работника'}
                </button>
            </div>

            {showConfirm && (
                <div className={compStyles.confirmOverlay}>
                    <div className={compStyles.confirmModal}>
                        <div className={compStyles.confirmIcon}>⚠️</div>
                        <div className={compStyles.confirmTitle}>Удалить работника?</div>
                        <div className={compStyles.confirmText}>
                            Вы уверены, что хотите удалить работника <strong>«{worker.name}»</strong>?
                            <br />
                            <span style={{ fontSize: '13px', color: '#999' }}>
                                Это действие нельзя отменить.
                            </span>
                        </div>
                        <div className={compStyles.confirmButtons}>
                            <button 
                                className={`${compStyles.confirmBtn} ${compStyles.cancel}`}
                                onClick={() => setShowConfirm(false)}
                                disabled={deleting}
                            >
                                Отмена
                            </button>
                            <button 
                                className={`${compStyles.confirmBtn} ${compStyles.delete}`}
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
