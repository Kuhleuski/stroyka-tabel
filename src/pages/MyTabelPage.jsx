import { useAuth } from '../context/AuthContext'

export function MyTabelPage() {
    const { user } = useAuth()

    const roleLabels = {
        admin: 'Администратор',
        worker: 'Работник'
    }

    return (
        <div className="my-tabel-page">
            <div className="my-tabel-header">
                <span className="my-tabel-title">📋 Мой табель</span>
            </div>
            <div className="my-tabel-content">
                <div className="my-tabel-card">
                    <div className="my-tabel-avatar-large">
                        <span className="my-tabel-avatar-letter">
                            {user.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="my-tabel-name">{user.name}</div>
                    <div className="my-tabel-role">{roleLabels[user.role] || user.role}</div>
                    <div className="my-tabel-divider" />
                    <div className="my-tabel-info">
                        <div className="my-tabel-field">
                            <span className="my-tabel-label">Логин</span>
                            <span className="my-tabel-value">{user.login}</span>
                        </div>
                        <div className="my-tabel-field">
                            <span className="my-tabel-label">Роль</span>
                            <span className="my-tabel-value">{roleLabels[user.role] || user.role}</span>
                        </div>
                    </div>
                    <div className="my-tabel-empty-state">
                        Здесь будет ваша статистика и информация
                    </div>
                </div>
            </div>
        </div>
    )
}
