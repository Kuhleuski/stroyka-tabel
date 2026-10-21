import styles from '../styles/menu.module.css'

export function WorkersStatsPage() {
    return (
        <div className={styles.placeholderPage}>
            <div className={styles.placeholderIcon}>📅</div>
            <div className={styles.placeholderTitle}>Рабочие дни</div>
            <div className={styles.placeholderText}>
                Статистика по рабочим дням всех работников
            </div>
            <div className={styles.placeholderSubtext}>
                Скоро здесь появится полная статистика
            </div>
        </div>
    )
}