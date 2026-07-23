import styles from '../../styles/calendar.module.css'

export function ViewModeButtons({ mode, onChange }) {
    const modes = [
        { key: 'month', label: 'Месяц' },
        { key: 'feed', label: 'День' }
    ]

    return (
        <div className={styles.viewModeButtons}>
            {modes.map(({ key, label }) => (
                <button
                    key={key}
                    className={`${styles.viewModeBtn} ${mode === key ? styles.active : ''}`}
                    onClick={() => onChange(key)}
                >
                    {label}
                </button>
            ))}
        </div>
    )
}
