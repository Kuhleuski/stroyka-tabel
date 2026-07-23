import styles from '../styles/components.module.css'

export function ExtraPage() {
    return (
        <div className={styles.extraPage}>
            <div className={styles.extraHeader}>
                <span className={styles.extraTitle}>📌 Пункт</span>
            </div>
            <div className={styles.extraContent}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📌</div>
                    <div className={styles.emptyText}>Дополнительная информация</div>
                    <div style={{ fontSize: '13px', color: '#999', marginTop: '8px' }}>
                        Здесь будет дополнительная информация
                    </div>
                </div>
            </div>
        </div>
    )
}
