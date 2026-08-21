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
    
    const { unreadCount, fetchNotifications } = useNotifications(userId)

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
        fetchNotifications()
        if (onNotifications) onNotifications()
    }

    const handleCloseNotifications = () => {
        setIsNotificationModalOpen(false)
        fetchNotifications()
    }

    return (
        <>
           

            <NotificationModal 
                isOpen={isNotificationModalOpen}
                onClose={handleCloseNotifications}
                userId={userId}
            />
        </>
    )
}