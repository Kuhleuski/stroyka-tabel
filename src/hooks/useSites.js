import { useState, useEffect } from 'react'
import { fetchSites, archiveSite, restoreSite, getArchivedSites } from '../services/supabase'

export function useSites() {
   const [sites, setSites] = useState([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState(null)
   const [archivedSites, setArchivedSites] = useState([])

   // === ЗАГРУЗКА ВСЕХ ДАННЫХ ===
   const loadAllData = async () => {
      try {
         setLoading(true)

         // Загружаем активные объекты
         const data = await fetchSites()
         setSites((data || []).filter(s => s.archived !== true))

         // Загружаем архивные объекты
         const archived = await getArchivedSites()
         setArchivedSites(archived || [])

         setError(null)
      } catch (err) {
         setError(err.message)
      } finally {
         setLoading(false)
      }
   }

   useEffect(() => {
      loadAllData()
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

   // === АРХИВАЦИЯ ===
   const archiveSiteInState = async (siteId) => {
      try {
         const archived = await archiveSite(siteId)
         setSites(prev => prev.filter(s => s.id !== siteId))
         await refreshArchivedSites()
         return archived
      } catch (error) {
         console.error('❌ Ошибка архивации:', error)
         throw error
      }
   }

   const restoreSiteInState = async (siteId) => {
      try {
         const restored = await restoreSite(siteId)
         setSites(prev => [...prev, restored])
         setArchivedSites(prev => prev.filter(s => s.id !== siteId))
         return restored
      } catch (error) {
         console.error('❌ Ошибка восстановления:', error)
         throw error
      }
   }

   const refreshArchivedSites = async () => {
      try {
         const data = await getArchivedSites()
         setArchivedSites(data || [])
      } catch (error) {
         console.error('❌ Ошибка загрузки архивных объектов:', error)
         setArchivedSites([])
      }
   }

   return {
      sites,
      loading,
      error,
      addSiteToState,
      removeSiteFromState,
      updateSiteInState,
      archiveSiteInState,
      restoreSiteInState,
      archivedSites,
      refreshArchivedSites
   }
}