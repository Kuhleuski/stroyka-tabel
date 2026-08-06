import { useState } from 'react'
import styles from '../styles/auth.module.css'

export function LoginPage({ onLogin }) {
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = () => {
        // Убираем все пробелы, скобки и дефисы
        let cleanPhone = phone.replace(/\s/g, '').replace(/[()\-]/g, '')
        
        // Если номер начинается с 8, меняем на +375
        if (cleanPhone.startsWith('8')) {
            cleanPhone = '+375' + cleanPhone.slice(1)
        }
        
        // Если номер начинается с 29 или 25, добавляем +375
        if (cleanPhone.startsWith('29') || cleanPhone.startsWith('25')) {
            cleanPhone = '+375' + cleanPhone
        }
        
        // Если номер уже с +375, оставляем как есть
        if (!cleanPhone.startsWith('+375')) {
            setError('Введите номер в формате 29XXXXXXX')
            return
        }

        setLoading(true)
        setError('')

        // Проверяем, что onLogin - функция
        if (typeof onLogin !== 'function') {
            console.error('onLogin is not a function!', onLogin)
            setError('Ошибка входа. Попробуйте позже.')
            setLoading(false)
            return
        }

        setTimeout(() => {
            const result = onLogin(cleanPhone)
            setLoading(false)
            if (!result.success) {
                setError(result.error)
            }
        }, 300)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleLogin()
        }
    }

    // Форматирование номера в реальном времени: +375 (XX) XXX-XX-XX
    const formatPhoneNumber = (value) => {
        // Убираем все не-цифры
        const digits = value.replace(/\D/g, '')
        
        if (digits.length === 0) return ''
        
        // Форматируем как +375 (XX) XXX-XX-XX
        // digits: 29 123 45 67
        if (digits.length <= 2) {
            return digits
        }
        
        if (digits.length <= 5) {
            return digits.slice(0, 2) + ' ' + digits.slice(2)
        }
        
        if (digits.length <= 7) {
            return digits.slice(0, 2) + ' ' + digits.slice(2, 5) + '-' + digits.slice(5)
        }
        
        if (digits.length <= 9) {
            return digits.slice(0, 2) + ' ' + digits.slice(2, 5) + '-' + digits.slice(5, 7) + '-' + digits.slice(7)
        }
        
        // Если больше 9 цифр, обрезаем
        return digits.slice(0, 2) + ' ' + digits.slice(2, 5) + '-' + digits.slice(5, 7) + '-' + digits.slice(7, 9)
    }

    const handlePhoneChange = (e) => {
        const value = e.target.value
        // Разрешаем только цифры
        const digitsOnly = value.replace(/\D/g, '')
        // Обрезаем до 9 цифр (максимум для белорусского номера)
        const truncated = digitsOnly.slice(0, 9)
        // Форматируем
        const formatted = formatPhoneNumber(truncated)
        setPhone(formatted)
        setError('') // Очищаем ошибку при вводе
    }

    // Проверяем, достаточно ли цифр для входа (9 цифр)
    const getRawDigits = (value) => {
        return value.replace(/\D/g, '')
    }

    const rawDigits = getRawDigits(phone)
    const isValidLength = rawDigits.length === 9

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
                    <p className={styles.loginSubtitle}>Введите номер телефона</p>
                </div>

                <div className={styles.loginForm}>
                    {error && (
                        <div className={styles.loginError}>{error}</div>
                    )}

                    <div className={styles.inputWrapper}>
                        <span className={styles.phonePrefix}>+375</span>
                        <input
                            type="tel"
                            className={styles.phoneInput}
                            placeholder="29 123-45-67"
                            value={phone}
                            onChange={handlePhoneChange}
                            onKeyPress={handleKeyPress}
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <button 
                        className={styles.loginBtn} 
                        onClick={handleLogin}
                        disabled={loading || !isValidLength}
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </div>
            </div>
        </div>
    )
}