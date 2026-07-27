import { useState, useEffect } from 'react'
import { fetchSites } from '../services/supabase'

export function useSites() {
    const [sites, setSites] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function load() {
            try {
                setLoading(true)
                const data = await fetchSites()
                setSites(data || [])
                setError(null)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const addSiteToState = (newSite) => {
        if (Array.isArray(newSite)) {
            newSite = newSite[0]
        }
        if (!newSite || !newSite.id) {
            console.warn('⚠️ addSiteToState: получен некорректный site:', newSite)
            return
        }
        setSites(prev => [...prev, newSite])
    }

    const removeSiteFromState = (siteId) => {
        setSites(prev => prev.filter(s => s.id !== siteId))
    }

    // === ОБНОВЛЕНИЕ ОБЪЕКТА В СОСТОЯНИИ ===
    const updateSiteInState = (updatedSite) => {
        if (Array.isArray(updatedSite)) {
            if (updatedSite.length === 0) {
                console.warn('⚠️ updateSiteInState: получен пустой массив')
                return
            }
            updatedSite = updatedSite[0]
        }
        
        if (!updatedSite || !updatedSite.id) {
            console.warn('⚠️ updateSiteInState: получен некорректный site:', updatedSite)
            return
        }
        
        console.log('🔄 Обновляем объект в состоянии:', updatedSite)
        setSites(prev => prev.map(s => 
            s.id === updatedSite.id ? updatedSite : s
        ))
    }

    return { 
        sites, 
        loading, 
        error, 
        addSiteToState, 
        removeSiteFromState,
        updateSiteInState 
    }
}
