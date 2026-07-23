import styles from '../styles/components.module.css'

export function NotificationsPage({ onClose }) {
    const notifications = [
        {
            id: 1,
            title: 'Hello world',
            message: 'Добро пожаловать в систему! Это первое уведомление.',
            time: new Date().toLocaleString('ru-RU'),
            read: false
        }
    ]

    return (
        <div className={styles.notificationsPage}>
            <div className={styles.notificationsHeader}>
                <span className={styles.notificationsTitle}>🔔 Уведомления</span>
                <button className={styles.notificationsClose} onClick={onClose}>
                    ✕
                </button>
            </div>

            <div className={styles.notificationsContent}>
                {notifications.length === 0 ? (
                    <div className={styles.notificationsEmpty}>
                        <div className={styles.notificationsEmptyIcon}>📭</div>
                        <div className={styles.notificationsEmptyText}>Нет уведомлений</div>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div key={notif.id} className={styles.notificationsItem}>
                            <div className={styles.notificationsItemDot} />
                            <div className={styles.notificationsItemContent}>
                                <div className={styles.notificationsItemTitle}>{notif.title}</div>
                                <div className={styles.notificationsItemMessage}>{notif.message}</div>
                                <div className={styles.notificationsItemTime}>{notif.time}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
