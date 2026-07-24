import { useState } from 'react'
import styles from '../styles/auth.module.css'

export default function LoginPage({ onLogin }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = (role) => {
        setLoading(true)
        setError('')

        setTimeout(() => {
            const result = onLogin(role)
            setLoading(false)
            if (!result.success) {
                setError(result.error)
            }
        }, 300)
    }

    return (
        <div className={styles.loginPage}>
            <div className={styles.loginContainer}>
                <div className={styles.loginHeader}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#2d7d46"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                        <line x1="8" y1="11" x2="16" y2="11" />
                        <line x1="8" y1="15" x2="16" y2="15" />
                        <line x1="8" y1="19" x2="12" y2="19" />
                    </svg>
                    <h1 className={styles.loginTitle}>Табель</h1>
                    <p className={styles.loginSubtitle}>Выберите роль для входа</p>
                </div>

                <div className={styles.loginForm}>
                    {error && (
                        <div className={styles.loginError}>{error}</div>
                    )}

                    <button 
                        className={styles.loginBtn} 
                        onClick={() => handleLogin('admin')}
                        disabled={loading}
                        style={{ background: '#2d7d46' }}
                    >
                        {loading ? 'Загрузка...' : '👨‍💼 Администратор'}
                    </button>

                    <button 
                        className={styles.loginBtn} 
                        onClick={() => handleLogin('worker')}
                        disabled={loading}
                        style={{ background: '#1a6b8a' }}
                    >
                        {loading ? 'Загрузка...' : '👷 Пользователь'}
                    </button>

                    <div className={styles.loginHint}>
                        <span>Сергей (админ)</span>
                        <span>Саша (пользователь)</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
