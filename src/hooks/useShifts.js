import { useState, useEffect, useCallback } from 'react'
import { fetchShifts } from '../services/supabase'

export function useShifts() {
   console.log('🟣 useShifts вызван')
   
   const [shifts, setShifts] = useState([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState(null)

   const loadShifts = useCallback(async () => {
      console.log('🟣 loadShifts: начинаем загрузку...')
      try {
         setLoading(true)
         const data = await fetchShifts()
         console.log('🟣 loadShifts: загружено смен:', data.length)
         setShifts(data)
         setError(null)
      } catch (err) {
         console.error('🟣 loadShifts: ошибка:', err.message)
         setError(err.message)
      } finally {
         setLoading(false)
      }
   }, [])

   useEffect(() => {
      console.log('🟣 useEffect useShifts: первый рендер')
      loadShifts()
   }, [loadShifts])

   return { 
      shifts, 
      loading, 
      error,
      refetch: loadShifts
   }
}
