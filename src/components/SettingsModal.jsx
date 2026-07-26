// src/components/SettingsModal.jsx

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import styles from '../styles/components.module.css'

export function SettingsModal({ isOpen, onClose, onLogout }) {
    const { user } = useAuth()
    
    // === ТЕМА ===
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme')
        return savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light'
    })

    // Применяем тему при изменении
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)
    }, [theme])

    // Загружаем сохранённую тему при монтировании
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme === 'dark' || savedTheme === 'light') {
            setTheme(savedTheme)
        }
    }, [])

    const handleLogout = () => {
        if (window.confirm('Вы уверены, что хотите выйти?')) {
            onLogout()
            onClose()
        }
    }

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme)
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
                    {/* ПЛОСКАЯ ИКОНКА ВМЕСТО ЭМОДЗИ */}
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ marginRight: '10px', color: 'var(--text-primary)' }}
                    >
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    <span className={styles.modalTitle}>Настройки</span>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.settingsAvatarLarge}>
                        <span className={styles.settingsAvatarLetter}>
                            {user?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                    </div>

                    <div className={styles.settingsField}>
                        <span className={styles.settingsLabel}>Имя</span>
                        <span className={styles.settingsValue}>{user?.name || '—'}</span>
                    </div>

                    <div className={styles.settingsField}>
                        <span className={styles.settingsLabel}>Роль</span>
                        <span className={styles.settingsValue}>
                            {roleLabels[user?.role] || user?.role || '—'}
                        </span>
                    </div>

                    {/* === ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ === */}
                    <div className={styles.settingsField}>
                        <span className={styles.settingsLabel}>Тема</span>
                        <div className={styles.themeToggleWrapper}>
                            <button 
                                className={`${styles.themeToggleBtn} ${theme === 'light' ? styles.active : ''}`}
                                onClick={() => handleThemeChange('light')}
                            >
                                ☀️ Светлая
                            </button>
                            <button 
                                className={`${styles.themeToggleBtn} ${theme === 'dark' ? styles.active : ''}`}
                                onClick={() => handleThemeChange('dark')}
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

                {/* КНОПКА ЗАКРЫТЬ — ЗЕЛЁНАЯ */}
                <div className={styles.modalFooterCenter}>
                    <button 
                        className={styles.modalSaveBtn}
                        onClick={onClose}
                        style={{ minWidth: '140px' }}
                    >
                        Готово
                    </button>
                </div>
            </div>
        </div>
    )
}
