import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { fetchWorkers } from '../services/supabase'

// === КОНТЕКСТ ===
const AvatarContext = createContext()

// === ПРОВЕРКА НА BASE64 ===
const isBase64Image = (str) => {
    return str && str.startsWith('data:image')
}

// === ХУК ДЛЯ ИСПОЛЬЗОВАНИЯ ===
export const useAvatars = () => {
    const context = useContext(AvatarContext)
    if (!context) {
        throw new Error('useAvatars must be used within AvatarProvider')
    }
    return context
}

// === ПРОВАЙДЕР ===
export const AvatarProvider = ({ children }) => {
    const [workers, setWorkers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Загружаем всех работников один раз
    useEffect(() => {
        const loadWorkers = async () => {
            try {
                setLoading(true)
                const data = await fetchWorkers()
                setWorkers(data || [])
                setError(null)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        loadWorkers()
    }, [])

    // === ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ АВАТАРКИ ПО ИМЕНИ ===
    const getAvatar = (workerName) => {
        if (!workerName) return null
        
        const worker = workers.find(w => w.name === workerName)
        if (!worker) return null
        
        return worker.avatar && isBase64Image(worker.avatar) ? worker.avatar : null
    }

    // === ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ДАННЫХ РАБОТНИКА ===
    const getWorker = (workerName) => {
        if (!workerName) return null
        return workers.find(w => w.name === workerName)
    }

    // === ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ВСЕХ РАБОТНИКОВ (с кешем) ===
    const getAllWorkers = () => workers

    // === ФУНКЦИЯ ДЛЯ ОБНОВЛЕНИЯ КЕША ===
    const refreshAvatars = async () => {
        try {
            const data = await fetchWorkers()
            setWorkers(data || [])
        } catch (err) {
            console.error('Ошибка обновления аватарок:', err)
        }
    }

    // === МЕМОИЗИРУЕМ ЗНАЧЕНИЕ ===
    const value = useMemo(() => ({
        workers,
        loading,
        error,
        getAvatar,
        getWorker,
        getAllWorkers,
        refreshAvatars,
        isBase64Image
    }), [workers, loading, error])

    return (
        <AvatarContext.Provider value={value}>
            {children}
        </AvatarContext.Provider>
    )
}
