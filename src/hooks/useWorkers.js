import { useState, useEffect, useCallback } from 'react'
import { fetchWorkers, archiveWorker, restoreWorker, getArchivedWorkers } from '../services/supabase'

export function useWorkers() {
   const [workers, setWorkers] = useState([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState(null)
   const [archivedWorkers, setArchivedWorkers] = useState([])

   // === ЗАГРУЗКА ВСЕХ ДАННЫХ ===
   const loadAllData = useCallback(async () => {
      try {
         setLoading(true)

         // Загружаем активных работников
         const data = await fetchWorkers()
         setWorkers((data || []).filter(w => w.archived !== true))

         // Загружаем архивных работников
         const archived = await getArchivedWorkers()
         setArchivedWorkers(archived || [])

         setError(null)
      } catch (err) {
         setError(err.message)
      } finally {
         setLoading(false)
      }
   }, [])

   // === ПЕРВИЧНАЯ ЗАГРУЗКА ===
   useEffect(() => {
      loadAllData()
   }, [loadAllData])

   // === ПЕРЕЗАГРУЗКА ===
   const refreshWorkers = useCallback(async () => {
      console.log('🔄 refreshWorkers: перезагрузка списка работников...')
      try {
         const data = await fetchWorkers()
         setWorkers((data || []).filter(w => w.archived !== true))

         const archived = await getArchivedWorkers()
         setArchivedWorkers(archived || [])

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

   // === АРХИВАЦИЯ ===
   const archiveWorkerInState = async (workerId) => {
      try {
         const archived = await archiveWorker(workerId)
         setWorkers(prev => prev.filter(w => w.id !== workerId))
         await refreshArchivedWorkers()
         return archived
      } catch (error) {
         console.error('❌ Ошибка архивации:', error)
         throw error
      }
   }

   const restoreWorkerInState = async (workerId) => {
      try {
         const restored = await restoreWorker(workerId)
         setWorkers(prev => [...prev, restored])
         setArchivedWorkers(prev => prev.filter(w => w.id !== workerId))
         return restored
      } catch (error) {
         console.error('❌ Ошибка восстановления:', error)
         throw error
      }
   }

   const refreshArchivedWorkers = async () => {
      try {
         const data = await getArchivedWorkers()
         setArchivedWorkers(data || [])
      } catch (error) {
         console.error('❌ Ошибка загрузки архивных работников:', error)
         setArchivedWorkers([])
      }
   }

   return {
      workers,
      loading,
      error,
      addWorkerToState,
      removeWorkerFromState,
      updateWorkerInState,
      refreshWorkers,
      archiveWorkerInState,
      restoreWorkerInState,
      archivedWorkers,
      refreshArchivedWorkers
   }
}