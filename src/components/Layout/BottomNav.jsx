import { useAuth } from '../../context/AuthContext'
import styles from '../../styles/layout.module.css'

// === ПЛОСКИЕ SVG-ИКОНКИ ===
const icons = {
    'my-tabel': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <path d="M8 14h.01"/>
            <path d="M12 14h.01"/>
            <path d="M16 14h.01"/>
            <path d="M8 18h.01"/>
            <path d="M12 18h.01"/>
            <path d="M16 18h.01"/>
        </svg>
    ),
    'calendar': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <circle cx="12" cy="15" r="1"/>
            <circle cx="16" cy="15" r="1"/>
            <circle cx="8" cy="15" r="1"/>
        </svg>
    ),
    'sites': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
        </svg>
    ),
    'workers': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
    ),
    'salary': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12h8"/>
            <path d="M12 8v8"/>
        </svg>
    ),
    'extra': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4l3 3"/>
        </svg>
    )
}

export function BottomNav({ currentPage, onNavigate }) {
    const { user } = useAuth()

    const isAdmin = user?.role === 'admin'

    const baseItems = [
        { key: 'my-tabel', label: 'Мой табель' },
        { key: 'calendar', label: 'Календарь' },
    ]

    const roleItems = isAdmin ? [
        { key: 'sites', label: 'Объекты' },
        { key: 'workers', label: 'Бригада' }
    ] : [
        { key: 'salary', label: 'Зарплата' },
        { key: 'extra', label: 'Пункт' }
    ]

    const items = [...baseItems, ...roleItems]

    return (
        <div className={styles.bottomNav}>
            {items.map(({ key, label }) => (
                <button
                    key={key}
                    className={currentPage === key ? styles.active : ''}
                    onClick={() => onNavigate(key)}
                >
                    <span className={styles.navIcon}>
                        {icons[key] || icons.extra}
                    </span>
                    <span>{label}</span>
                </button>
            ))}
        </div>
    )
}
