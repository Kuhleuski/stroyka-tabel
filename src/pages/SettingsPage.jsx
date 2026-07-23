import { useAuth } from '../context/AuthContext'
import styles from '../styles/components.module.css'

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
        <div className={styles.settingsPage}>
            <div className={styles.settingsHeader}>
                <span className={styles.settingsTitle}>⚙️ Настройки</span>
                <button className={styles.settingsClose} onClick={onClose}>
                    ✕
                </button>
            </div>

            <div className={styles.settingsContent}>
                <div className={styles.settingsAvatarLarge}>
                    <span className={styles.settingsAvatarLetter}>
                        {user.name.charAt(0).toUpperCase()}
                    </span>
                </div>

                <div className={styles.settingsField}>
                    <span className={styles.settingsLabel}>Имя</span>
                    <span className={styles.settingsValue}>{user.name}</span>
                </div>

                <div className={styles.settingsField}>
                    <span className={styles.settingsLabel}>Роль</span>
                    <span className={styles.settingsValue}>{roleLabels[user.role] || user.role}</span>
                </div>

                <button className={styles.settingsLogoutBtn} onClick={handleLogout}>
                    Выйти из аккаунта
                </button>
            </div>
        </div>
    )
}
