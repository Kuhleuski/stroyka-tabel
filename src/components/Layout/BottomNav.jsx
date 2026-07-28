// src/components/Layout/BottomNav.jsx

import { useRef, useEffect } from 'react'
import { useAuth } from '../../context/AvatarContext'
import styles from '../../styles/layout.module.css'

// === ПЛОСКИЕ SVG-ИКОНКИ (Lucide) ===
const icons = {
    'calendar': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
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
            <path d="M3 3v18h18"/>
            <path d="M5 15l4-4 3 3 6-6"/>
            <path d="M21 12v4"/>
            <path d="M21 16h-4"/>
        </svg>
    ),
    'costs': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
    ),
    'salary': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="2" x2="12" y2="22"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
    ),
    'test': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2.18"/>
            <line x1="8" y1="2" x2="8" y2="22"/>
            <line x1="16" y1="2" x2="16" y2="22"/>
            <line x1="2" y1="8" x2="22" y2="8"/>
            <line x1="2" y1="16" x2="22" y2="16"/>
        </svg>
    ),
}

export function BottomNav({ currentPage, onNavigate }) {
    const { user } = useAuth()
    const scrollRef = useRef(null)
    const isAdmin = user?.role === 'admin'

    // Все пункты меню (для админа — все, для работника — без админских)
    const allItems = isAdmin ? [
        { key: 'calendar', icon: icons.calendar, label: 'Главная' },
        { key: 'my-tabel', icon: icons['my-tabel'], label: 'Мой табель' },
        { key: 'workers', icon: icons.workers, label: 'Бригада' },
        { key: 'sites', icon: icons.sites, label: 'Объекты' },
        { key: 'statistics', icon: icons.statistics, label: 'Статистика' },
        { key: 'costs', icon: icons.costs, label: 'Затраты' },
        { key: 'salary', icon: icons.salary, label: 'Зарплата' },
        { key: 'test', icon: icons.test, label: 'Тест' },
    ] : [
        { key: 'calendar', icon: icons.calendar, label: 'Главная' },
        { key: 'my-tabel', icon: icons['my-tabel'], label: 'Мой табель' },
        { key: 'workers', icon: icons.workers, label: 'Бригада' },
        { key: 'sites', icon: icons.sites, label: 'Объекты' },
        { key: 'test', icon: icons.test, label: 'Тест' },
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
