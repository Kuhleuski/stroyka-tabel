import { useState, useEffect, useCallback } from 'react'
import { fetchShifts } from '../services/supabase'

export function useShifts() {
   console.log('🔄 useShifts вызван')
   
   const [shifts, setShifts] = useState([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState(null)

   const loadShifts = useCallback(async () => {
      console.log('🔄 loadShifts: НАЧАЛО загрузки...')
      try {
         setLoading(true)
         const data = await fetchShifts()
         console.log('🔄 loadShifts: загружено смен:', data.length)
         setShifts(data)
         setError(null)
      } catch (err) {
         console.error('🔄 loadShifts: ОШИБКА:', err.message)
         setError(err.message)
      } finally {
         setLoading(false)
         console.log('🔄 loadShifts: ЗАВЕРШЕНО')
      }
   }, [])

   useEffect(() => {
      console.log('🔄 useEffect useShifts: ПЕРВЫЙ РЕНДЕР')
      loadShifts()
   }, [loadShifts])

   return { 
      shifts, 
      loading, 
      error,
      refetch: loadShifts
   }
}
