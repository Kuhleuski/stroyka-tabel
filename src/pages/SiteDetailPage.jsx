import { useState } from 'react'
import styles from '../styles/sites.module.css'
import compStyles from '../styles/components.module.css'

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
        <div className={styles.siteDetailPage}>
            <div className={styles.siteDetailHeader}>
                <span className={styles.siteDetailTitle}>🏗️ {site.name}</span>
                <button className={styles.siteDetailClose} onClick={onClose}>
                    ✕
                </button>
            </div>
            
            <div className={styles.siteDetailContent}>
                <div className={styles.siteDetailField}>
                    <span className={styles.siteDetailLabel}>Название</span>
                    <span className={styles.siteDetailValue}>{site.name}</span>
                </div>
                
                {site.address && (
                    <div className={styles.siteDetailField}>
                        <span className={styles.siteDetailLabel}>Адрес</span>
                        <span className={styles.siteDetailValue}>{site.address}</span>
                    </div>
                )}
                
                <div className={styles.siteDetailField}>
                    <span className={styles.siteDetailLabel}>Дата создания</span>
                    <span className={styles.siteDetailValue}>{formatDate(site.created_at)}</span>
                </div>
                
                <div className={styles.siteDetailHint}>
                    Здесь будет статистика по объекту
                </div>

                <button 
                    className={styles.siteDetailDelete}
                    onClick={() => setShowConfirm(true)}
                    disabled={deleting}
                >
                    {deleting ? '⏳ Удаление...' : '🗑️ Удалить объект'}
                </button>
            </div>

            {showConfirm && (
                <div className={compStyles.confirmOverlay}>
                    <div className={compStyles.confirmModal}>
                        <div className={compStyles.confirmIcon}>⚠️</div>
                        <div className={compStyles.confirmTitle}>Удалить объект?</div>
                        <div className={compStyles.confirmText}>
                            Вы уверены, что хотите удалить объект <strong>«{site.name}»</strong>?
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
