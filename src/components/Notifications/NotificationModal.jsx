import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../../hooks/useNotifications'
import styles from '../../styles/layout.module.css'

export function NotificationModal({ isOpen, onClose, userId }) {
    const { notifications, unreadCount, markAllAsRead, markAsRead, formatTime, fetchNotifications } = useNotifications(userId)
    const [showHistory, setShowHistory] = useState(false)
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [removingId, setRemovingId] = useState(null)
    const modalRef = useRef(null)

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [onClose])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen) return null

    const allNotifications = notifications.flatMap(group => group.notifications)
    const unreadNotifications = allNotifications.filter(n => !n.read)
    const readNotifications = allNotifications.filter(n => n.read)
    const hasUnread = unreadNotifications.length > 0
    const hasHistory = readNotifications.length > 0

    const handleNotificationClick = async (notificationId) => {
        setRemovingId(notificationId)
        setTimeout(async () => {
            await markAsRead(notificationId)
            setRemovingId(null)
        }, 300)
    }

    const handleToggleHistory = async () => {
        if (!showHistory) {
            setLoadingHistory(true)
            await fetchNotifications()
            setLoadingHistory(false)
        }
        setShowHistory(!showHistory)
    }

    const getActionText = (actionType) => {
        switch (actionType) {
            case 'shift_created': return 'добавил'
            case 'shift_updated': return 'изменил'
            case 'shift_deleted': return 'удалил'
            default: return ''
        }
    }

    const getTitle = (actionType, formattedDate) => {
        switch (actionType) {
            case 'shift_created': return 'Создана новая смена'
            case 'shift_updated': return `Изменена смена: ${formattedDate}`
            case 'shift_deleted': return 'Удалена смена'
            default: return ''
        }
    }

    const getTitleIcon = (actionType) => {
        switch (actionType) {
            case 'shift_updated': return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
                    <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
                </svg>
            )
            case 'shift_deleted': return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
            )
            default: return null
        }
    }

    // Рендер деталей
    const renderDetails = (n) => {
        if (!n.details) return null

        const details = []
        
        // === СОЗДАНИЕ СМЕНЫ ===
        if (n.action_type === 'shift_created') {
            if (n.details.siteName) {
                details.push(
                    <div key="site" className={styles.detailRow}>
                        <span className={styles.detailLabel}>Объект</span>
                        <span className={styles.detailValue}>{n.details.siteName}</span>
                    </div>
                )
            }
            if (n.details.workerNames && n.details.workerNames.length > 0) {
                details.push(
                    <div key="workers" className={styles.detailRow}>
                        <span className={styles.detailLabel}>Добавлены</span>
                        <span className={styles.detailValueGreen}>
                            {n.details.workerNames.join(', ')}
                        </span>
                    </div>
                )
            }
            return details
        }

        // === УДАЛЕНИЕ СМЕНЫ ===
        if (n.action_type === 'shift_deleted') {
            if (n.details.siteName) {
                details.push(
                    <div key="site" className={styles.detailRow}>
                        <span className={styles.detailLabel}>Объект</span>
                        <span className={styles.detailValue}>{n.details.siteName}</span>
                    </div>
                )
            }
            if (n.details.workerNames && n.details.workerNames.length > 0) {
                details.push(
                    <div key="workers" className={styles.detailRow}>
                        <span className={styles.detailLabel}>Удалены</span>
                        <span className={styles.detailValueRed}>
                            {n.details.workerNames.join(', ')}
                        </span>
                    </div>
                )
            }
            return details
        }

        // === ОБНОВЛЕНИЕ СМЕНЫ ===
        if (n.action_type === 'shift_updated') {
            if (n.details.siteName) {
                details.push(
                    <div key="site" className={styles.detailRow}>
                        <span className={styles.detailLabel}>Объект</span>
                        <span className={styles.detailValue}>{n.details.siteName}</span>
                    </div>
                )
            }
            if (n.details.oldWorkerNames) {
                details.push(
                    <div key="change" className={styles.detailChange}>
                        <div className={styles.detailChangeRow}>
                            <span className={styles.detailChangeLabel}>Было</span>
                            <span className={styles.detailOld}>
                                {n.details.oldWorkerNames.length > 0 ? n.details.oldWorkerNames.join(', ') : 'никого'}
                            </span>
                        </div>
                        <div className={styles.detailChangeRow}>
                            <span className={styles.detailChangeLabel}>Стало</span>
                            <span className={styles.detailNew}>
                                {n.details.workerNames.join(', ')}
                            </span>
                        </div>
                    </div>
                )
            }
            return details
        }

        return details
    }

    return (
        <motion.div 
            className={styles.notificationModalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div 
                className={styles.notificationModalFullscreen}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                ref={modalRef}
            >
                {/* Хедер */}
                <div className={styles.notificationModalHeader}>
                    <div className={styles.notificationModalTitle}>
                        <span>Уведомления</span>
                        {unreadCount > 0 && (
                            <span className={styles.notificationModalBadge}>{unreadCount}</span>
                        )}
                    </div>
                    <div className={styles.notificationModalActions}>
                        {unreadCount > 0 && (
                            <button 
                                className={styles.notificationModalMarkAll}
                                onClick={markAllAsRead}
                            >
                                Все прочитаны
                            </button>
                        )}
                        <button 
                            className={styles.notificationModalClose}
                            onClick={onClose}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Тело */}
                <div className={styles.notificationModalBody}>
                    {allNotifications.length === 0 && (
                        <div className={styles.notificationModalEmpty}>
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            <span className={styles.notificationModalEmptyTitle}>Новых сообщений нет</span>
                            <span className={styles.notificationModalEmptySub}>Все спокойно</span>
                        </div>
                    )}

                    {!hasUnread && hasHistory && (
                        <div className={styles.notificationModalEmpty}>
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            <span className={styles.notificationModalEmptyTitle}>Новых сообщений нет</span>
                            <span className={styles.notificationModalEmptySub}>Все спокойно</span>
                        </div>
                    )}

                    {/* Непрочитанные уведомления */}
                    {hasUnread && (
                        <div className={styles.notificationSection}>
                            <div className={styles.notificationSectionHeader}>
                                <span className={styles.notificationSectionTitle}>Новые</span>
                                <span className={styles.notificationSectionCount}>
                                    {unreadNotifications.length}
                                </span>
                            </div>
                            <AnimatePresence mode="popLayout">
                                {unreadNotifications.map((n) => {
                                    const titleIcon = getTitleIcon(n.action_type)
                                    return (
                                        <motion.div 
                                            key={n.id}
                                            layout
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ 
                                                opacity: removingId === n.id ? 0 : 1,
                                                y: removingId === n.id ? -20 : 0,
                                                scale: removingId === n.id ? 0.95 : 1
                                            }}
                                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                            transition={{ duration: 0.25 }}
                                            className={styles.notificationModalItem}
                                            onClick={() => handleNotificationClick(n.id)}
                                        >
                                            <div className={styles.notificationModalItemContent}>
                                                {/* Заголовок с иконкой */}
                                                <div className={styles.notificationModalItemTitle}>
                                                    {titleIcon && (
                                                        <span className={styles.notificationModalItemTitleIcon}>
                                                            {titleIcon}
                                                        </span>
                                                    )}
                                                    {getTitle(n.action_type, n.details?.formattedDate)}
                                                </div>
                                                
                                                {/* Сообщение */}
                                                <div className={styles.notificationModalItemMessage}>
                                                    <span className={styles.notificationModalItemActor}>
                                                        <strong>{n.actor?.name || 'Неизвестный'}</strong>
                                                    </span>
                                                    <span className={styles.notificationModalItemAction}>
                                                        {getActionText(n.action_type)} смену на {n.details?.formattedDate || ''}
                                                    </span>
                                                </div>

                                                {/* Детали */}
                                                {n.details && (
                                                    <div className={styles.notificationModalItemDetails}>
                                                        {renderDetails(n)}
                                                    </div>
                                                )}
                                                
                                                <div className={styles.notificationModalItemTime}>
                                                    {formatTime(n.created_at)}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* История */}
                    {hasHistory && (
                        <div className={styles.notificationSection}>
                            <div className={styles.notificationSectionHeader}>
                                <span className={styles.notificationSectionTitle}>История</span>
                                <span className={styles.notificationSectionCount}>
                                    {readNotifications.length}
                                </span>
                            </div>
                            <button 
                                className={styles.notificationLoadHistory}
                                onClick={handleToggleHistory}
                                disabled={loadingHistory}
                            >
                                {loadingHistory ? 'Загрузка...' : (showHistory ? 'Скрыть историю' : 'Показать историю')}
                            </button>
                            {showHistory && (
                                <AnimatePresence>
                                    {readNotifications.map((n) => {
                                        const titleIcon = getTitleIcon(n.action_type)
                                        return (
                                            <motion.div 
                                                key={n.id}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className={styles.notificationModalItemHistory}
                                            >
                                                <div className={styles.notificationModalItemContent}>
                                                    <div className={styles.notificationModalItemTitle}>
                                                        {titleIcon && (
                                                            <span className={styles.notificationModalItemTitleIcon}>
                                                                {titleIcon}
                                                            </span>
                                                        )}
                                                        {getTitle(n.action_type, n.details?.formattedDate)}
                                                    </div>
                                                    <div className={styles.notificationModalItemMessage}>
                                                        <span className={styles.notificationModalItemActor}>
                                                            <strong>{n.actor?.name || 'Неизвестный'}</strong>
                                                        </span>
                                                        <span className={styles.notificationModalItemAction}>
                                                            {getActionText(n.action_type)} смену на {n.details?.formattedDate || ''}
                                                        </span>
                                                    </div>
                                                    {n.details && (
                                                        <div className={styles.notificationModalItemDetails}>
                                                            {renderDetails(n)}
                                                        </div>
                                                    )}
                                                    <div className={styles.notificationModalItemTime}>
                                                        {formatTime(n.created_at)}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                            )}
                        </div>
                    )}
                </div>

                {allNotifications.length > 0 && (
                    <div className={styles.notificationModalFooter}>
                        <span>Всего: {allNotifications.length}</span>
                    </div>
                )}
            </motion.div>
        </motion.div>
    )
}