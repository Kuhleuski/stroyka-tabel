import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

// Расширенные данные пользователей с реальными UUID из Supabase
const USERS = [
    { 
        id: '675def67-36c0-4eb4-a305-cc36ac9c1c9d',
        login: 'admin_sergey', 
        role: 'admin', 
        name: 'Сергей',
        phone: '+375293723271'
    },
    { 
        id: '8ae4af3a-651e-4894-8d24-aefd27dbf643',
        login: 'admin_maxim', 
        role: 'admin', 
        name: 'Максим',
        phone: '+375259139056'
    },
]

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const savedUser = localStorage.getItem('tabel_user')
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser)
                // Ищем пользователя по номеру телефона
                const fullUser = USERS.find(u => u.phone === parsed.phone)
                if (fullUser) {
                    setUser(fullUser)
                } else {
                    localStorage.removeItem('tabel_user')
                }
            } catch (e) {
                localStorage.removeItem('tabel_user')
            }
        }
        setLoading(false)
    }, [])

    // Вход по номеру телефона
    const loginByPhone = (phone) => {
        // Нормализуем номер телефона (убираем пробелы, приводим к формату +375)
        let normalizedPhone = phone.replace(/\s/g, '')
        
        // Если номер начинается с 8, меняем на +375
        if (normalizedPhone.startsWith('8')) {
            normalizedPhone = '+375' + normalizedPhone.slice(1)
        }
        
        // Если номер начинается с 29 или 25, добавляем +375
        if (normalizedPhone.startsWith('29') || normalizedPhone.startsWith('25')) {
            normalizedPhone = '+375' + normalizedPhone
        }
        
        // Если номер уже с +375, оставляем как есть
        if (!normalizedPhone.startsWith('+375')) {
            return { success: false, error: 'Неверный формат номера' }
        }

        const found = USERS.find(u => u.phone === normalizedPhone)
        if (found) {
            const userData = { 
                id: found.id,
                login: found.login, 
                role: found.role, 
                name: found.name,
                phone: found.phone
            }
            setUser(userData)
            localStorage.setItem('tabel_user', JSON.stringify(userData))
            return { success: true }
        }
        return { success: false, error: 'Пользователь с таким номером не найден' }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('tabel_user')
    }

    return (
        <AuthContext.Provider value={{ user, loginByPhone, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}