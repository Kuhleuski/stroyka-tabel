import { useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import styles from '../../styles/layout.module.css'

// === ПЛОСКИЕ SVG-ИКОНКИ (Lucide) ===
const icons = {
    'calendar': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
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
    // ⭐ НОВАЯ ИКОНКА — Уведомления
    'notifications': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    ),
    // ⭐ НОВАЯ ИКОНКА — Профиль
    'profile': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
}

export function BottomNav({ currentPage, onNavigate }) {
    const { user } = useAuth()
    const scrollRef = useRef(null)
    const isAdmin = user?.role === 'admin'

    // ⭐ НОВЫЙ СПИСОК ПУНКТОВ (убраны: my-tabel, statistics, costs, salary)
    // Добавлены: notifications, profile
    const allItems = isAdmin ? [
        { key: 'calendar', icon: icons.calendar, label: 'Главная' },
        { key: 'workers', icon: icons.workers, label: 'Бригада' },
        { key: 'sites', icon: icons.sites, label: 'Объекты' },
        //{ key: 'notifications', icon: icons.notifications, label: 'Уведомления' },
        { key: 'profile', icon: icons.profile, label: 'Профиль' },
    ] : [
        { key: 'calendar', icon: icons.calendar, label: 'Главная' },
        { key: 'workers', icon: icons.workers, label: 'Бригада' },
        { key: 'sites', icon: icons.sites, label: 'Объекты' },
        //{ key: 'notifications', icon: icons.notifications, label: 'Уведомления' },
        { key: 'profile', icon: icons.profile, label: 'Профиль' },
    ]

    // При загрузке и при смене страницы — прокручиваем к активному пункту
    useEffect(() => {
        if (!scrollRef.current) return

        const container = scrollRef.current
        const activeIndex = allItems.findIndex(item => item.key === currentPage)
        if (activeIndex === -1) return

        const activeElement = container.children[activeIndex]
        if (!activeElement) return

        const containerRect = container.getBoundingClientRect()
        const elementRect = activeElement.getBoundingClientRect()

        if (elementRect.left < containerRect.left) {
            container.scrollLeft -= (containerRect.left - elementRect.left) + 10
        } else if (elementRect.right > containerRect.right) {
            container.scrollLeft += (elementRect.right - containerRect.right) + 10
        }
    }, [currentPage, allItems])

    const handleNavigate = (key) => {
        onNavigate(key)
    }

    return (
        <div className={styles.bottomNav}>
            <div className={styles.navContainer}>
                <div 
                    className={styles.scrollWrapper}
                    ref={scrollRef}
                >
                    {allItems.map(({ key, icon, label }) => (
                        <button
                            key={key}
                            className={`${styles.navItem} ${currentPage === key ? styles.active : ''}`}
                            onClick={() => handleNavigate(key)}
                        >
                            <span className={styles.navIcon}>{icon}</span>
                            <span className={styles.navLabel}>{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}