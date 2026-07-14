import { useState, useEffect } from 'react'
import { fetchShifts } from '../services/supabase'

export function useShifts() {
   const [shifts, setShifts] = useState([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState(null)

   useEffect(() => {
      async function load() {
         try {
            setLoading(true)
            const data = await fetchShifts()
            setShifts(data)
            setError(null)
         } catch (err) {
            setError(err.message)
         } finally {
            setLoading(false)
         }
      }
      load()
   }, [])

   return { shifts, loading, error }
}