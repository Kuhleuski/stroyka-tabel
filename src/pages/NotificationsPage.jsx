import styles from '../styles/menu.module.css'

export function NotificationsPage({ onBack }) {
    return (
        <div className={styles.detailPage}>
            <div className={styles.detailTopBar}>
                <button 
                    className={styles.detailBackBtn} 
                    onClick={onBack}
                    aria-label="Назад"
                >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    <span className={styles.detailBackLabel}>Назад</span>
                </button>
            </div>

            <div className={styles.detailTitleCenter}>Уведомления</div>

            <div className={styles.placeholderPage}>
                <div className={styles.placeholderIcon}>🔔</div>
                <div className={styles.placeholderTitle}>Уведомления</div>
                <div className={styles.placeholderText}>
                    Здесь будут отображаться ваши уведомления
                </div>
                <div className={styles.placeholderSubtext}>
                    Скоро здесь появится что-то интересное
                </div>
            </div>
        </div>
    )
}