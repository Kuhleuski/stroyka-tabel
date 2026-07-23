import styles from '../styles/components.module.css'

export function SalaryPage() {
    return (
        <div className={styles.salaryPage}>
            <div className={styles.salaryHeader}>
                <span className={styles.salaryTitle}>💰 Зарплата</span>
            </div>
            <div className={styles.salaryContent}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>💰</div>
                    <div className={styles.emptyText}>Информация о зарплате</div>
                    <div style={{ fontSize: '13px', color: '#999', marginTop: '8px' }}>
                        Здесь будет отображаться ваша зарплата
                    </div>
                </div>
            </div>
        </div>
    )
}
