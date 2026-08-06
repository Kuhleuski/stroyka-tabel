import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useAvatars } from '../../context/AvatarContext'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationModal } from '../Notifications/NotificationModal'
import styles from '../../styles/layout.module.css'

export function Header({ onLogout, onSettings, onNotifications, userId }) {
    const { user } = useAuth()
    const { getAvatar } = useAvatars()
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
    
    // Используем хук уведомлений для получения актуального счетчика
    const { unreadCount, fetchNotifications } = useNotifications(userId)

    // При монтировании и при изменении userId — загружаем уведомления
    useEffect(() => {
        if (userId) {
            fetchNotifications()
        }
    }, [userId, fetchNotifications])

    if (!user) return null

    const getInitial = (name) => {
        return name?.charAt(0).toUpperCase() || '?'
    }

    const isAdmin = user?.role === 'admin'
    const avatarUrl = getAvatar(user.name)

    const handleOpenNotifications = () => {
        setIsNotificationModalOpen(true)
        // Обновляем при открытии
        fetchNotifications()
        if (onNotifications) onNotifications()
    }

    const handleCloseNotifications = () => {
        setIsNotificationModalOpen(false)
        // Обновляем при закрытии, чтобы счетчик обновился
        fetchNotifications()
    }

    return (
        <>
            {/* Правая верхняя группа кнопок */}
            <div className={styles.floatingActions}>
                {/* Уведомления */}
                {isAdmin && (
                    <button 
                        className={styles.floatingNotificationsBtn}
                        onClick={handleOpenNotifications}
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
                            <span className={styles.floatingNotificationsBadge}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>
                )}

                {/* Аватарка (вместо иконки настроек) */}
                <button 
                    className={styles.floatingAvatarBtn}
                    onClick={onSettings}
                    aria-label="Настройки"
                >
                    {avatarUrl ? (
                        <img 
                            src={avatarUrl} 
                            alt={user.name}
                            className={styles.floatingAvatarImage}
                        />
                    ) : (
                        <div className={styles.floatingAvatarInitial}>
                            {getInitial(user.name)}
                        </div>
                    )}
                </button>
            </div>

            <NotificationModal 
                isOpen={isNotificationModalOpen}
                onClose={handleCloseNotifications}
                userId={userId}
            />
        </>
    )
}