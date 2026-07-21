import { useState } from 'react'

export function SiteDetailPage({ site, onClose, onDelete }) {
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
        console.log('🗑️ Начинаем удаление объекта:', site.id, site.name)
        try {
            await onDelete(site.id)
            console.log('✅ Объект удалён, закрываем детали')
            onClose()
        } catch (error) {
            console.error('❌ Ошибка удаления:', error)
            alert(`Не удалось удалить объект: ${error.message}`)
            setShowConfirm(false)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="site-detail-page">
            <div className="site-detail-header">
                <span className="site-detail-title">🏗️ {site.name}</span>
                <button className="site-detail-close" onClick={onClose}>
                    ✕
                </button>
            </div>
            
            <div className="site-detail-content">
                <div className="site-detail-field">
                    <span className="site-detail-label">Название</span>
                    <span className="site-detail-value">{site.name}</span>
                </div>
                
                {site.address && (
                    <div className="site-detail-field">
                        <span className="site-detail-label">Адрес</span>
                        <span className="site-detail-value">{site.address}</span>
                    </div>
                )}
                
                <div className="site-detail-field">
                    <span className="site-detail-label">Дата создания</span>
                    <span className="site-detail-value">{formatDate(site.created_at)}</span>
                </div>
                
                <div className="site-detail-hint">
                    Здесь будет статистика по объекту
                </div>

                <button 
                    className="site-detail-delete"
                    onClick={() => setShowConfirm(true)}
                    disabled={deleting}
                >
                    {deleting ? '⏳ Удаление...' : '🗑️ Удалить объект'}
                </button>
            </div>

            {showConfirm && (
                <div className="confirm-overlay">
                    <div className="confirm-modal">
                        <div className="confirm-icon">⚠️</div>
                        <div className="confirm-title">Удалить объект?</div>
                        <div className="confirm-text">
                            Вы уверены, что хотите удалить объект <strong>«{site.name}»</strong>?
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
