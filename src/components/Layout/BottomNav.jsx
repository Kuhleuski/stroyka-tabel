import { useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import styles from '../../styles/layout.module.css'

// === ИКОНКИ GRAVITY UI (стиль Яндекса) ===
import Calendar from '@gravity-ui/icons/Calendar'
import ChartColumn from '@gravity-ui/icons/ChartColumn'
import Persons from '@gravity-ui/icons/Persons'
import Layers from '@gravity-ui/icons/Layers'
import Ellipsis from '@gravity-ui/icons/Ellipsis'

// Размер задаётся в CSS через --nav-icon-size.
// Проп size НЕ используем — в @gravity-ui/icons@2.23.0 он игнорируется.
const icons = {
    'tabel': <Calendar />,
    'statistics': <ChartColumn />,
    'workers': <Persons />,
    'sites': <Layers />,
    'menu': <Ellipsis />,
}

export function BottomNav({ currentPage, onNavigate }) {
    const { user } = useAuth()
    const scrollRef = useRef(null)
    const isAdmin = user?.role === 'admin'

    const allItems = [
        { key: 'tabel', icon: icons.tabel, label: 'Табель' },
        { key: 'statistics', icon: icons.statistics, label: 'Статистика' },
        { key: 'workers', icon: icons.workers, label: 'Бригада' },
        { key: 'sites', icon: icons.sites, label: 'Объекты' },
        { key: 'menu', icon: icons.menu, label: 'Ещё' },
    ]

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
                <div className={styles.scrollWrapper} ref={scrollRef}>
                    {allItems.map(({ key, icon, label }) => (
                        <button
                            key={key}
                            className={`${styles.navItem} ${currentPage === key ? styles.active : ''}`}
                            onClick={() => handleNavigate(key)}
                        >
                            <span className={styles.navIconWrap}>
                                <span className={styles.navIcon}>{icon}</span>
                            </span>
                            <span className={styles.navLabel}>{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}