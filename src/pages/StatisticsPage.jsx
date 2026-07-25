import styles from '../styles/components.module.css'

export function StatisticsPage() {
    return (
        <div className={styles.salaryPage}>
            <div className={styles.salaryHeader}>
                <span className={styles.salaryTitle}>📊 Статистика</span>
            </div>
            <div className={styles.salaryContent}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📊</div>
                    <div className={styles.emptyText}>Статистика</div>
                    <div style={{ fontSize: '13px', color: '#999', marginTop: '8px' }}>
                        Здесь будет статистика по объектам и работникам
                    </div>
                </div>
            </div>
        </div>
    )
}
