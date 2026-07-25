import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import styles from '../../styles/layout.module.css'

// === ПЛОСКИЕ SVG-ИКОНКИ (Lucide) ===
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
            <path d="M3 3v18h18"/>
            <path d="M5 15l4-4 3 3 6-6"/>
            <path d="M21 12v4"/>
            <path d="M21 16h-4"/>
        </svg>
    ),
    'notifications': (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
    ),
    'settings': (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
    )
}

export function BottomNav({ currentPage, onNavigate, onNotifications, unreadCount }) {
    const { user } = useAuth()
    const [isExpanded, setIsExpanded] = useState(false)
    const isAdmin = user?.role === 'admin'

    const mainKeys = ['calendar', 'my-tabel', 'workers', 'sites']
    const extraKeys = ['statistics', 'notifications', 'settings']

    useEffect(() => {
        if (extraKeys.includes(currentPage)) {
            setIsExpanded(true)
        } else if (mainKeys.includes(currentPage)) {
            setIsExpanded(false)
        }
    }, [currentPage])

    const mainItems = [
        { key: 'calendar', icon: icons.calendar, label: 'Главная' },
        { key: 'my-tabel', icon: icons['my-tabel'], label: 'Мой табель' },
        { key: 'workers', icon: icons.workers, label: 'Бригада' },
        { key: 'sites', icon: icons.sites, label: 'Объекты' },
    ]

    const extraItems = isAdmin ? [
        { key: 'statistics', icon: icons.statistics, label: 'Статистика' },
        { 
            key: 'notifications', 
            icon: icons.notifications, 
            label: 'Уведомления',
            badge: unreadCount > 0 ? unreadCount : null
        },
        { key: 'settings', icon: icons.settings, label: 'Настройки' },
    ] : []

    const toggleMenu = () => {
        setIsExpanded(!isExpanded)
    }

    const handleNavigate = (key) => {
        if (key === 'notifications' && onNotifications) {
            onNotifications()
            return
        }
        onNavigate(key)
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

    const hasUnread = unreadCount > 0

    return (
        <div className={styles.bottomNav}>
            <button 
                className={`${styles.burgerBtn} ${isExpanded ? styles.burgerActive : ''}`}
                onClick={toggleMenu}
            >
                <span className={styles.navIcon}>
                    <BurgerIcon />
                    {hasUnread && <span className={styles.burgerBadge}></span>}
                </span>
            </button>

            <div className={styles.navContainer}>
                <div className={styles.groupsWrapper}>
                    {!isExpanded && (
                        <div className={`${styles.mainGroup} ${styles.mainGroupVisible}`}>
                            {mainItems.map(({ key, icon, label }) => (
                                <button
                                    key={key}
                                    className={`${styles.mainItem} ${currentPage === key ? styles.active : ''}`}
                                    onClick={() => handleNavigate(key)}
                                >
                                    <span className={styles.iconWrap}>{icon}</span>
                                    <span className={styles.mainLabel}>{label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {isAdmin && isExpanded && (
                        <div className={`${styles.extraGroup} ${styles.extraGroupVisible}`}>
                            {extraItems.map(({ key, icon, label, badge }) => (
                                <button
                                    key={key}
                                    className={`${styles.extraItem} ${currentPage === key ? styles.active : ''}`}
                                    onClick={() => handleNavigate(key)}
                                >
                                    <span className={styles.extraIconWrap}>
                                        {icon}
                                        {badge && (
                                            <span className={styles.badgeDot}>{badge}</span>
                                        )}
                                    </span>
                                    <span className={styles.extraLabel}>{label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
