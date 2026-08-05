import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import styles from '../../styles/layout.module.css'

export function NotificationBell({ userId }) {
    const [isOpen, setIsOpen] = useState(false)
    const { notifications, unreadCount, markAllAsRead, markAsRead, fetchNotifications, formatTime } = useNotifications(userId)
    const dropdownRef = useRef(null)

    useEffect(() => {
        if (userId) {
            fetchNotifications()
        }
    }, [userId, fetchNotifications])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Получаем все уведомления из групп
    const allNotifications = notifications.flatMap(group => group.notifications)

    return (
        <div className={styles.notificationWrapper} ref={dropdownRef}>
            <button 
                className={styles.notificationBell}
                onClick={() => {
                    setIsOpen(!isOpen)
                    if (!isOpen) {
                        fetchNotifications()
                    }
                }}
                aria-label="Уведомления"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                    <span className={styles.notificationBellBadge}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className={styles.notificationDropdown}>
                    <div className={styles.notificationDropdownHeader}>
                        <span className={styles.notificationDropdownTitle}>Уведомления</span>
                        {unreadCount > 0 && (
                            <button 
                                className={styles.notificationMarkAllRead}
                                onClick={markAllAsRead}
                            >
                                Все прочитаны
                            </button>
                        )}
                    </div>

                    <div className={styles.notificationDropdownList}>
                        {allNotifications.length === 0 ? (
                            <div className={styles.notificationEmpty}>
                                <span>🔔</span>
                                <span>Нет уведомлений</span>
                            </div>
                        ) : (
                            allNotifications.map(n => (
                                <div 
                                    key={n.id} 
                                    className={`${styles.notificationItem} ${!n.read ? styles.notificationUnread : ''}`}
                                    onClick={() => markAsRead(n.id)}
                                >
                                    <div className={styles.notificationItemContent}>
                                        <div className={styles.notificationItemActor}>
                                            <strong>{n.actor?.name || 'Неизвестный'}</strong>
                                        </div>
                                        <div className={styles.notificationItemMessage}>
                                            {n.message}
                                        </div>
                                        <div className={styles.notificationItemTime}>
                                            {formatTime(n.created_at)}
                                        </div>
                                    </div>
                                    {!n.read && (
                                        <div className={styles.notificationItemDot} />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {allNotifications.length > 0 && (
                        <div className={styles.notificationDropdownFooter}>
                            <span>{allNotifications.length} уведомлений</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}