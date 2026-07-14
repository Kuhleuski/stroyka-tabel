export function ViewModeButtons({ mode, onChange }) {
    const modes = [
        { key: 'day', label: 'День' },
        { key: 'week', label: 'Неделя' },
        { key: 'month', label: 'Месяц' }
    ]

    return (
        <div className="view-mode-buttons">
            {modes.map(({ key, label }) => (
                <button
                    key={key}
                    className={`view-mode-btn ${mode === key ? 'active' : ''}`}
                    onClick={() => onChange(key)}
                >
                    {label}
                </button>
            ))}
        </div>
    )
}