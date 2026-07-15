export function ViewModeButtons({ mode, onChange }) {
    const modes = [
        { key: 'month', label: 'Месяц' },
        { key: 'feed', label: 'День' }
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
