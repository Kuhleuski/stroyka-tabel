import { useAuth } from '../context/AuthContext'
import styles from '../styles/menu.module.css'

export function ProfilePage({ onBack, onLogout }) {
    const { user } = useAuth()

    const handleLogout = () => {
        if (window.confirm('Вы уверены, что хотите выйти?')) {
            onLogout()
            onBack()
        }
    }

    const roleLabels = {
        admin: 'Администратор',
        worker: 'Работник'
    }

    return (
        <div className={styles.detailPage}>
            <div className={styles.detailTopBar}>
                <button
                    className={styles.detailBackBtn}
                    onClick={onBack}
                    aria-label="Назад"
                >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    <span className={styles.detailBackLabel}>Назад</span>
                </button>
            </div>

            <div className={styles.detailTitleCenter}>Профиль</div>

            <div className={styles.profileAvatarLarge}>
                <span className={styles.profileAvatarLetter}>
                    {user?.name?.charAt(0).toUpperCase() || '?'}
                </span>
            </div>

            <div className={styles.profileField}>
                <span className={styles.profileLabel}>Имя</span>
                <span className={styles.profileValue}>{user?.name || '—'}</span>
            </div>

            <div className={styles.profileField}>
                <span className={styles.profileLabel}>Роль</span>
                <span className={styles.profileValue}>
                    {roleLabels[user?.role] || user?.role || '—'}
                </span>
            </div>

            <button
                className={styles.profileLogoutBtn}
                onClick={handleLogout}
            >
                Выйти из аккаунта
            </button>
        </div>
    )
}