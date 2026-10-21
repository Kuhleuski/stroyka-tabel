import { useNavigate } from 'react-router-dom'
import styles from '../styles/statistics.module.css'

const StatisticsIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12v-2a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v2"/>
        <circle cx="12" cy="16" r="5"/>
        <path d="M12 11v5"/>
        <path d="M9 16h6"/>
    </svg>
)

export function StatisticsPage({ onNavigate }) {
    return (
        <div className={styles.statisticsPage}>
            <div className={styles.statisticsHeader}>
                <div className={styles.statisticsTitle}>
                    <StatisticsIcon />
                    Статистика
                </div>
                <div className={styles.statisticsSubtitle}>
                    Выберите раздел статистики
                </div>
            </div>

            <div className={styles.statisticsGrid}>
                {/* 1. Зарплата */}
                <div 
                    className={styles.statisticsCard}
                    onClick={() => window.location.hash = '#/salary'}
                >
                    <div className={styles.statisticsCardIcon}>💰</div>
                    <div className={styles.statisticsCardTitle}>Зарплата</div>
                    <div className={styles.statisticsCardDesc}>Все выплаты работникам</div>
                </div>

                {/* 2. Рабочие дни */}
                <div 
                    className={styles.statisticsCard}
                    onClick={() => window.location.hash = '#/workers-stats'}
                >
                    <div className={styles.statisticsCardIcon}>📅</div>
                    <div className={styles.statisticsCardTitle}>Рабочие дни</div>
                    <div className={styles.statisticsCardDesc}>Статистика по сменам</div>
                </div>

                {/* 3. Затраты */}
                <div 
                    className={styles.statisticsCard}
                    onClick={() => window.location.hash = '#/costs'}
                >
                    <div className={styles.statisticsCardIcon}>📉</div>
                    <div className={styles.statisticsCardTitle}>Затраты</div>
                    <div className={styles.statisticsCardDesc}>Финансовые затраты</div>
                </div>
            </div>
        </div>
    )
}