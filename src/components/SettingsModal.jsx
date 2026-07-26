import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import styles from '../styles/components.module.css'

export function SettingsModal({ isOpen, onClose, onLogout }) {
    const { user } = useAuth()
    
    // === ТЕМА ===
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme === 'dark' || savedTheme === 'light') {
            return savedTheme
        }
        return 'light'
    })

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)
    }, [theme])

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme === 'dark' || savedTheme === 'light') {
            document.documentElement.setAttribute('data-theme', savedTheme)
            setTheme(savedTheme)
        }
    }, [])

    const handleLogout = () => {
        if (window.confirm('Вы уверены, что хотите выйти?')) {
            onLogout()
            onClose()
        }
    }

    const roleLabels = {
        admin: 'Администратор',
        worker: 'Работник'
    }

    if (!isOpen) return null

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <span className={styles.modalTitle}>⚙️ Настройки</span>
                </div>

                <div className={styles.modalBody}>
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

                    {/* === ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ === */}
                    <div className={styles.settingsField}>
                        <span className={styles.settingsLabel}>Тема</span>
                        <div className={styles.themeToggleWrapper}>
                            <button 
                                className={`${styles.themeToggleBtn} ${theme === 'light' ? styles.active : ''}`}
                                onClick={() => {
                                    setTheme('light')
                                    localStorage.setItem('theme', 'light')
                                    document.documentElement.setAttribute('data-theme', 'light')
                                }}
                            >
                                ☀️ Светлая
                            </button>
                            <button 
                                className={`${styles.themeToggleBtn} ${theme === 'dark' ? styles.active : ''}`}
                                onClick={() => {
                                    setTheme('dark')
                                    localStorage.setItem('theme', 'dark')
                                    document.documentElement.setAttribute('data-theme', 'dark')
                                }}
                            >
                                🌙 Тёмная
                            </button>
                        </div>
                    </div>

                    {/* КНОПКА ВЫЙТИ */}
                    <button 
                        className={styles.settingsLogoutBtn}
                        onClick={handleLogout}
                    >
                        Выйти из аккаунта
                    </button>
                </div>

                {/* КНОПКА ЗАКРЫТЬ ВНИЗУ (по центру) */}
                <div className={styles.modalFooterCenter}>
                    <button 
                        className={styles.modalCloseBtn}
                        onClick={onClose}
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    )
}
