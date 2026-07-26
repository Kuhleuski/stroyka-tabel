import styles from '../styles/components.module.css'

export function ConfirmModal({ 
    title, 
    message, 
    confirmText = 'Удалить', 
    cancelText = 'Отмена', 
    onConfirm, 
    onCancel, 
    loading 
}) {
    return (
        <div className={styles.confirmOverlay}>
            <div className={styles.confirmModal}>
                <div className={styles.confirmIconWrapper}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                </div>
                <div className={styles.confirmTitle}>{title}</div>
                <div className={styles.confirmText}>{message}</div>
                <div className={styles.confirmButtons}>
                    <button 
                        className={`${styles.confirmBtn} ${styles.cancel}`}
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button 
                        className={`${styles.confirmBtn} ${styles.delete}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Удаление...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
