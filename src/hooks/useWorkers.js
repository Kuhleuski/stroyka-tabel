import { useState, useEffect } from 'react'
import { fetchWorkers } from '../services/supabase'

export function useWorkers() {
    const [workers, setWorkers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function load() {
            try {
                setLoading(true)
                const data = await fetchWorkers()
                setWorkers(data)
                setError(null)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const addWorkerToState = (newWorker) => {
        setWorkers(prev => [...prev, newWorker])
    }

    const removeWorkerFromState = (workerId) => {
        setWorkers(prev => prev.filter(w => w.id !== workerId))
    }

    return { workers, loading, error, addWorkerToState, removeWorkerFromState }
}
