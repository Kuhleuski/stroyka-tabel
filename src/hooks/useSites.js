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
                setSites(data)
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
        setSites(prev => [...prev, newSite])
    }

    const removeSiteFromState = (siteId) => {
        setSites(prev => prev.filter(s => s.id !== siteId))
    }

    return { sites, loading, error, addSiteToState, removeSiteFromState }
}
