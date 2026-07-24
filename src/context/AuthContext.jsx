import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

const USERS = [
    { login: 'admin', role: 'admin', name: 'Сергей' },
    { login: 'user', role: 'worker', name: 'Саша' },
]

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
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

    const login = (role) => {
        const found = USERS.find(u => u.role === role)
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
        return { success: false, error: 'Ошибка входа' }
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
