import { useState, useEffect, useCallback } from 'react'
import { fetchWorkers } from '../services/supabase'

export function useWorkers() {
   const [workers, setWorkers] = useState([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState(null)

   // === ЗАГРУЗКА РАБОТНИКОВ ===
   const loadWorkers = useCallback(async () => {
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
   }, [])

   // === ПЕРВИЧНАЯ ЗАГРУЗКА ===
   useEffect(() => {
      loadWorkers()
   }, [loadWorkers])

   // === ПЕРЕЗАГРУЗКА (для обновления списка) ===
   const refreshWorkers = useCallback(async () => {
      console.log('🔄 refreshWorkers: перезагрузка списка работников...')
      try {
         const data = await fetchWorkers()
         setWorkers(data || [])
         console.log('✅ refreshWorkers: загружено', data.length, 'работников')
      } catch (err) {
         console.error('❌ refreshWorkers: ошибка', err)
         setError(err.message)
      }
   }, [])

   // === ДОБАВЛЕНИЕ ===
   const addWorkerToState = (newWorker) => {
      if (Array.isArray(newWorker)) {
         newWorker = newWorker[0]
      }
      if (!newWorker || !newWorker.id) {
         console.warn('⚠️ addWorkerToState: получен некорректный worker:', newWorker)
         return
      }
      setWorkers(prev => [...prev, newWorker])
   }

   // === УДАЛЕНИЕ ===
   const removeWorkerFromState = (workerId) => {
      setWorkers(prev => prev.filter(w => w.id !== workerId))
   }

   // === ОБНОВЛЕНИЕ ===
   const updateWorkerInState = (updatedWorker) => {
      if (Array.isArray(updatedWorker)) {
         if (updatedWorker.length === 0) {
            console.warn('⚠️ updateWorkerInState: получен пустой массив')
            return
         }
         updatedWorker = updatedWorker[0]
      }

      if (!updatedWorker || !updatedWorker.id) {
         console.warn('⚠️ updateWorkerInState: получен некорректный worker:', updatedWorker)
         return
      }

      console.log('🔄 Обновляем работника в состоянии:', updatedWorker)
      setWorkers(prev => prev.map(w =>
         w.id === updatedWorker.id ? updatedWorker : w
      ))
   }

   return {
      workers,
      loading,
      error,
      addWorkerToState,
      removeWorkerFromState,
      updateWorkerInState,
      refreshWorkers  // ← НОВАЯ ФУНКЦИЯ
   }
}