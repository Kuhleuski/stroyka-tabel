import { useAuth } from '../../context/AuthContext'

export function BottomNav({ currentPage, onNavigate }) {
    const { user } = useAuth()

    const isAdmin = user?.role === 'admin'

    // Базовые пункты меню для всех
    const baseItems = [
        { key: 'my-tabel', icon: '📋', label: 'Мой табель' },
        { key: 'calendar', icon: '📅', label: 'Календарь' },
    ]

    // Пункты в зависимости от роли
    const roleItems = isAdmin ? [
        { key: 'sites', icon: '🏢', label: 'Объекты' },
        { key: 'workers', icon: '👷', label: 'Бригада' }
    ] : [
        { key: 'salary', icon: '💰', label: 'Зарплата' },
        { key: 'extra', icon: '📌', label: 'Пункт' }
    ]

    const items = [...baseItems, ...roleItems]

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
