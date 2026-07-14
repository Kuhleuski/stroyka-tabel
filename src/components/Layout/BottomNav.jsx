export function BottomNav({ currentPage, onNavigate }) {
    const items = [
        { key: 'main', icon: '📅', label: 'Главная' },
        { key: 'sites', icon: '🏢', label: 'Объекты' },
        { key: 'workers', icon: '👷', label: 'Бригада' }
    ]

    return (
        <div className="bottom-nav">
            {items.map(({ key, icon, label }) => (
                <button
                    key={key}
                    className={currentPage === key ? 'active' : ''}
                    onClick={() => onNavigate(key)}
                >
                    <span className="nav-icon">{icon}</span>
                    <span>{label}</span>
                </button>
            ))}
        </div>
    )
}