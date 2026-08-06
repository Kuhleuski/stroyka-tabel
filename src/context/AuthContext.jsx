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

// Ключ для localStorage
const STORAGE_KEY = 'tabel_user'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        console.log('🚀 AuthProvider: useEffect ЗАПУЩЕН')
        
        // Пытаемся восстановить сессию при загрузке
        const savedUser = localStorage.getItem(STORAGE_KEY)
        console.log('🔍 AuthProvider: восстановление сессии:', savedUser ? 'найдена' : 'не найдена')
        
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser)
                console.log('📦 AuthProvider: данные из localStorage:', parsed)
                
                // Ищем пользователя по номеру телефона
                const fullUser = USERS.find(u => u.phone === parsed.phone)
                if (fullUser) {
                    console.log('✅ AuthProvider: пользователь найден:', fullUser.name)
                    setUser(fullUser)
                } else {
                    console.warn('⚠️ AuthProvider: пользователь не найден в списке USERS')
                    localStorage.removeItem(STORAGE_KEY)
                }
            } catch (e) {
                console.error('❌ AuthProvider: ошибка парсинга localStorage:', e)
                localStorage.removeItem(STORAGE_KEY)
            }
        } else {
            console.log('ℹ️ AuthProvider: нет сохраненной сессии')
        }
        
        setLoading(false)
        console.log('🏁 AuthProvider: загрузка завершена, loading = false')
    }, [])

    // Вход по номеру телефона
    const loginByPhone = (phone) => {
        console.log('🔑 loginByPhone: попытка входа с номером:', phone)
        
        // Нормализуем номер телефона (убираем пробелы, скобки, дефисы)
        let normalizedPhone = phone.replace(/\s/g, '').replace(/[()\-]/g, '')
        
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
            console.warn('⚠️ loginByPhone: неверный формат номера')
            return { success: false, error: 'Неверный формат номера' }
        }

        console.log('🔍 loginByPhone: ищем пользователя с номером:', normalizedPhone)
        const found = USERS.find(u => u.phone === normalizedPhone)
        
        if (found) {
            const userData = { 
                id: found.id,
                login: found.login, 
                role: found.role, 
                name: found.name,
                phone: found.phone
            }
            
            console.log('✅ loginByPhone: вход выполнен для:', userData.name)
            
            // Сохраняем в состояние
            setUser(userData)
            
            // Сохраняем в localStorage
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
                console.log('💾 loginByPhone: сохранено в localStorage')
            } catch (e) {
                console.error('❌ loginByPhone: ошибка сохранения в localStorage:', e)
            }
            
            return { success: true }
        }
        
        console.warn('⚠️ loginByPhone: пользователь не найден:', normalizedPhone)
        return { success: false, error: 'Пользователь с таким номером не найден' }
    }

    const logout = () => {
        console.log('🚪 logout: выход из системы')
        setUser(null)
        try {
            localStorage.removeItem(STORAGE_KEY)
            console.log('🗑️ logout: удалено из localStorage')
        } catch (e) {
            console.error('❌ logout: ошибка удаления из localStorage:', e)
        }
    }

    const value = {
        user,
        loginByPhone,
        logout,
        loading
    }

    console.log('📤 AuthProvider: возвращаем контекст, user =', user?.name || 'null')

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}