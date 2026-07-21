import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

const USERS = [
    { login: 'admin', password: '1111', role: 'admin', name: 'Сергей' },
    { login: 'user', password: '1111', role: 'worker', name: 'Саша' },
]

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Восстанавливаем сессию из localStorage
        const savedUser = localStorage.getItem('tabel_user')
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser)
                setUser(parsed)
            } catch (e) {
                localStorage.removeItem('tabel_user')
            }
        }
        setLoading(false)
    }, [])

    const login = (login, password) => {
        const found = USERS.find(u => u.login === login && u.password === password)
        if (found) {
            const userData = { 
                login: found.login, 
                role: found.role, 
                name: found.name 
            }
            setUser(userData)
            localStorage.setItem('tabel_user', JSON.stringify(userData))
            return { success: true }
        }
        return { success: false, error: 'Неверный логин или пароль' }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('tabel_user')
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
