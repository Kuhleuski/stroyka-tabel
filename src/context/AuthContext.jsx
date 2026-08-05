import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

// Расширенные данные пользователей с реальными UUID из Supabase
const USERS = [
    { 
        id: '675def67-36c0-4eb4-a305-cc36ac9c1c9d',  // ← реальный UUID из таблицы user_profiles
        login: 'admin_sergey', 
        role: 'admin', 
        name: 'Сергей',
        phone: '+375293723271'
    },
    { 
        id: '8ae4af3a-651e-4894-8d24-aefd27dbf643',  // ← реальный UUID из таблицы user_profiles
        login: 'admin_maxim', 
        role: 'admin', 
        name: 'Максим',
        phone: '+375259139056'
    },
    { 
        id: 'user_3', 
        login: 'worker_misha', 
        role: 'worker', 
        name: 'Миша',
        phone: '+375259618760'
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
                const fullUser = USERS.find(u => u.login === parsed.login)
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

    const login = (login) => {
        const found = USERS.find(u => u.login === login)
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
        return { success: false, error: 'Пользователь не найден' }
    }

    const loginByPhone = (phone) => {
        const found = USERS.find(u => u.phone === phone)
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
        return { success: false, error: 'Пользователь не найден' }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('tabel_user')
    }

    return (
        <AuthContext.Provider value={{ user, login, loginByPhone, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}