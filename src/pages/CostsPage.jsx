import styles from '../styles/components.module.css'

export function CostsPage() {
    return (
        <div className={styles.salaryPage}>
            <div className={styles.salaryHeader}>
                <span className={styles.salaryTitle}>💰 Затраты общ</span>
            </div>
            <div className={styles.salaryContent}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>💰</div>
                    <div className={styles.emptyText}>Общие затраты</div>
                    <div style={{ fontSize: '13px', color: '#999', marginTop: '8px' }}>
                        Здесь будут общие затраты по объектам
                    </div>
                </div>
            </div>
        </div>
    )
}
