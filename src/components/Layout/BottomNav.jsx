import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import styles from '../../styles/layout.module.css'

// === ПЛОСКИЕ SVG-ИКОНКИ ===
const icons = {
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
    'workers': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
    ),
    'sites': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
        </svg>
    ),
    'statistics': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12v-2a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v2"/>
            <circle cx="12" cy="16" r="5"/>
            <path d="M12 11v5"/>
            <path d="M9 13l3 3 3-3"/>
        </svg>
    ),
    'costs': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12h8"/>
            <path d="M12 8v8"/>
        </svg>
    ),
    'salary': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12h8"/>
            <path d="M12 8v8"/>
        </svg>
    ),
    'settings': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
    )
}

export function BottomNav({ currentPage, onNavigate }) {
    const { user } = useAuth()
    const [isExpanded, setIsExpanded] = useState(false)
    const isAdmin = user?.role === 'admin'

    // Основные пункты (всегда видны)
    const mainItems = [
        { key: 'calendar', label: 'Календарь' },
        { key: 'my-tabel', label: 'Мой табель' },
        { key: 'workers', label: 'Бригада' },
        { key: 'sites', label: 'Объекты' },
    ]

    // Дополнительные пункты (только для админа, в расширенном меню)
    const extraItems = isAdmin ? [
        { key: 'statistics', label: 'Статистика' },
        { key: 'costs', label: 'Затраты общ' },
        { key: 'salary', label: 'Зарплата' },
        { key: 'settings', label: 'Настройки' },
    ] : []

    const toggleMenu = () => {
        setIsExpanded(!isExpanded)
    }

    const handleNavigate = (key) => {
        onNavigate(key)
        setIsExpanded(false)
    }

    // Бургер иконка
    const BurgerIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isExpanded ? (
                <line x1="18" y1="6" x2="6" y2="18"/>
            ) : (
                <line x1="3" y1="12" x2="21" y2="12"/>
            )}
            {isExpanded ? (
                <line x1="6" y1="6" x2="18" y2="18"/>
            ) : (
                <>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                </>
            )}
        </svg>
    )

    return (
        <div className={styles.bottomNav}>
            <div className={styles.navContainer}>
                {/* Основные пункты в группе */}
                <div className={styles.mainGroup}>
                    {mainItems.map(({ key, label }) => (
                        <button
                            key={key}
                            className={`${styles.navItem} ${currentPage === key ? styles.active : ''}`}
                            onClick={() => handleNavigate(key)}
                        >
                            <span className={styles.navIcon}>
                                {icons[key]}
                            </span>
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                {/* Бургер */}
                <button 
                    className={`${styles.burgerBtn} ${isExpanded ? styles.active : ''}`}
                    onClick={toggleMenu}
                >
                    <span className={styles.navIcon}>
                        <BurgerIcon />
                    </span>
                    <span>{isExpanded ? 'Закрыть' : 'Меню'}</span>
                </button>
            </div>

            {/* Дополнительные пункты (выезжают снизу) */}
            {isAdmin && (
                <div className={`${styles.extraMenu} ${isExpanded ? styles.expanded : ''}`}>
                    {extraItems.map(({ key, label }) => (
                        <button
                            key={key}
                            className={`${styles.extraItem} ${currentPage === key ? styles.active : ''}`}
                            onClick={() => handleNavigate(key)}
                        >
                            <span className={styles.navIcon}>
                                {icons[key]}
                            </span>
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
