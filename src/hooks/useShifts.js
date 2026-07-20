import { useState, useEffect, useCallback } from 'react'
import { fetchShifts } from '../services/supabase'

export function useShifts() {
   const [shifts, setShifts] = useState([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState(null)

   // Функция загрузки — сделана через useCallback чтобы можно было вызывать повторно
   const loadShifts = useCallback(async () => {
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
   }, [])

   // Загружаем при первом рендере
   useEffect(() => {
      loadShifts()
   }, [loadShifts])

   // Возвращаем shifts, loading, error и функцию refetch для перезагрузки
   return { 
      shifts, 
      loading, 
      error,
      refetch: loadShifts  // <-- ЭТО БЫЛО ПРОБЛЕМОЙ!
   }
}
