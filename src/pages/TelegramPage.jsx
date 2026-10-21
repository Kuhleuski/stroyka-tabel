import styles from '../styles/menu.module.css'

export function TelegramPage({ onBack }) {
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

            <div className={styles.detailTitleCenter}>Telegram</div>

            <div className={styles.placeholderPage}>
                <div className={styles.placeholderIcon}>📱</div>
                <div className={styles.placeholderTitle}>Telegram</div>
                <div className={styles.placeholderText}>
                    Подключение к Telegram боту
                </div>
                <div className={styles.placeholderSubtext}>
                    Здесь будет настройка Telegram интеграции
                </div>
            </div>
        </div>
    )
}