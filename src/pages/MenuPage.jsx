import { Settings, Archive, Bell, Send, Calendar } from 'lucide-react'
import styles from '../styles/menu.module.css'

export function MenuPage({ onNavigate }) {
    const menuItems = [
        {
            id: 'profile',
            icon: <Settings size={24} />,
            title: 'Профиль',
            desc: 'Настройки профиля и выход',
            onClick: () => onNavigate('profile')
        },
        {
            id: 'archive',
            icon: <Archive size={24} />,
            title: 'Архив',
            desc: 'Архивированные объекты и работники',
            onClick: () => onNavigate('archive')
        },
                {
            id: 'calendar-test',
            icon: <Calendar size={24} />,
            title: 'Календарь',
            desc: 'Площадка для разработки календаря',
            onClick: () => onNavigate('calendar-test')
        },
        {
            id: 'notifications',
            icon: <Bell size={24} />,
            title: 'Уведомления',
            desc: 'Все уведомления',
            onClick: () => onNavigate('notifications')
        },
        {
            id: 'telegram',
            icon: <Send size={24} />,
            title: 'Telegram',
            desc: 'Подключение к Telegram боту',
            onClick: () => onNavigate('telegram')
        },
        
    ]

    return (
        <div className={styles.menuPage}>
            <div className={styles.menuHeader}>
                <div className={styles.menuTitle}>
                    Дополнительно
                </div>
            </div>

            <div className={styles.menuList}>
                {menuItems.map((item) => (
                    <div
                        key={item.id}
                        className={styles.menuItem}
                        onClick={item.onClick}
                    >
                        <div className={styles.menuItemIcon}>
                            {item.icon}
                        </div>
                        <div className={styles.menuItemContent}>
                            <div className={styles.menuItemTitle}>{item.title}</div>
                            <div className={styles.menuItemDesc}>{item.desc}</div>
                        </div>
                        <div className={styles.menuItemArrow}>›</div>
                    </div>
                ))}
            </div>
        </div>
    )
}