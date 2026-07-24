import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import styles from '../../styles/layout.module.css'

// === ПЛОСКИЕ SVG-ИКОНКИ (Lucide) — увеличены до 28px ===
const icons = {
    'calendar': (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
    ),
    'my-tabel': (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
    ),
    'sites': (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
        </svg>
    ),
    'statistics': (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16v-4"/>
            <path d="M12 8V6"/>
            <path d="M18 16v-8"/>
            <path d="M6 16v-2"/>
            <path d="M3 20h18"/>
            <path d="M6 20v-2"/>
            <path d="M12 20v-4"/>
            <path d="M18 20v-8"/>
        </svg>
    ),
    'costs': (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/>
            <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.8-2.8L14 13"/>
            <circle cx="6" cy="18" r="2"/>
            <circle cx="18" cy="6" r="2"/>
        </svg>
    ),
    'salary': (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="2" x2="12" y2="22"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
    ),
    'settings': (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
    )
}

export function BottomNav({ currentPage, onNavigate }) {
    const { user } = useAuth()
    const [isExpanded, setIsExpanded] = useState(false)
    const isAdmin = user?.role === 'admin'

    const mainItems = [
        { key: 'calendar', icon: icons.calendar },
        { key: 'my-tabel', icon: icons['my-tabel'] },
        { key: 'workers', icon: icons.workers },
        { key: 'sites', icon: icons.sites },
    ]

    const extraItems = isAdmin ? [
        { key: 'statistics', icon: icons.statistics },
        { key: 'costs', icon: icons.costs },
        { key: 'salary', icon: icons.salary },
        { key: 'settings', icon: icons.settings },
    ] : []

    const toggleMenu = () => {
        setIsExpanded(!isExpanded)
    }

    const handleNavigate = (key) => {
        onNavigate(key)
        setIsExpanded(false)
    }

    const BurgerIcon = () => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isExpanded ? (
                <>
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </>
            ) : (
                <>
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                </>
            )}
        </svg>
    )

    return (
        <div className={styles.bottomNav}>
            <div className={styles.navContainer}>
                <div className={styles.iconGroupWrapper}>
                    <div className={`${styles.iconGroup} ${isExpanded ? styles.iconGroupSlideDown : styles.iconGroupVisible}`}>
                        {mainItems.map(({ key, icon }) => (
                            <button
                                key={key}
                                className={`${styles.iconItem} ${currentPage === key ? styles.active : ''}`}
                                onClick={() => handleNavigate(key)}
                            >
                                <span className={styles.iconWrap}>{icon}</span>
                            </button>
                        ))}
                    </div>

                    {isAdmin && (
                        <div className={`${styles.iconGroup} ${styles.iconGroupExtra} ${isExpanded ? styles.iconGroupSlideUp : ''}`}>
                            {extraItems.map(({ key, icon }) => (
                                <button
                                    key={key}
                                    className={`${styles.iconItem} ${currentPage === key ? styles.active : ''}`}
                                    onClick={() => handleNavigate(key)}
                                >
                                    <span className={styles.iconWrap}>{icon}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button 
                    className={`${styles.burgerBtn} ${isExpanded ? styles.burgerActive : ''}`}
                    onClick={toggleMenu}
                >
                    <span className={styles.navIcon}><BurgerIcon /></span>
                </button>
            </div>
        </div>
    )
}
