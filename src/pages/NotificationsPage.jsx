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
        <div className="notifications-page">
            <div className="notifications-header">
                <span className="notifications-title">🔔 Уведомления</span>
                <button className="notifications-close" onClick={onClose}>
                    ✕
                </button>
            </div>

            <div className="notifications-content">
                {notifications.length === 0 ? (
                    <div className="notifications-empty">
                        <div className="notifications-empty-icon">📭</div>
                        <div className="notifications-empty-text">Нет уведомлений</div>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div key={notif.id} className="notifications-item">
                            <div className="notifications-item-dot" />
                            <div className="notifications-item-content">
                                <div className="notifications-item-title">{notif.title}</div>
                                <div className="notifications-item-message">{notif.message}</div>
                                <div className="notifications-item-time">{notif.time}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
