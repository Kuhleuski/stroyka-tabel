import { useAuth } from '../context/AuthContext'

export function SettingsPage({ onClose, onLogout }) {
    const { user } = useAuth()

    const handleLogout = () => {
        if (window.confirm('Вы уверены, что хотите выйти?')) {
            onLogout()
        }
    }

    const roleLabels = {
        admin: 'Администратор',
        worker: 'Работник'
    }

    return (
        <div className="settings-page">
            <div className="settings-header">
                <span className="settings-title">⚙️ Настройки</span>
                <button className="settings-close" onClick={onClose}>
                    ✕
                </button>
            </div>

            <div className="settings-content">
                <div className="settings-avatar-large">
                    <span className="settings-avatar-letter">
                        {user.name.charAt(0).toUpperCase()}
                    </span>
                </div>

                <div className="settings-field">
                    <span className="settings-label">Имя</span>
                    <span className="settings-value">{user.name}</span>
                </div>

                <div className="settings-field">
                    <span className="settings-label">Роль</span>
                    <span className="settings-value">{roleLabels[user.role] || user.role}</span>
                </div>

                <button className="settings-logout-btn" onClick={handleLogout}>
                    Выйти из аккаунта
                </button>
            </div>
        </div>
    )
}
