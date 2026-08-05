import { useState, useEffect, useCallback } from 'react'

export function useNotifications(userId) {
   const [notifications, setNotifications] = useState([])
   const [unreadCount, setUnreadCount] = useState(0)
   const [loading, setLoading] = useState(true)

   const groupNotifications = (notifs) => {
      if (notifs.length === 0) return []

      const grouped = []
      let currentGroup = []
      let groupStartTime = new Date(notifs[0].created_at)

      for (const notif of notifs) {
         const notifTime = new Date(notif.created_at)
         const diffMinutes = (groupStartTime - notifTime) / 60000

         if (diffMinutes > 5 && currentGroup.length > 0) {
            grouped.push({
               id: `group-${grouped.length}`,
               notifications: [...currentGroup],
               createdAt: groupStartTime.toISOString(),
               count: currentGroup.length
            })
            currentGroup = []
            groupStartTime = notifTime
         }
         currentGroup.push(notif)
      }

      if (currentGroup.length > 0) {
         grouped.push({
            id: `group-${grouped.length}`,
            notifications: [...currentGroup],
            createdAt: groupStartTime.toISOString(),
            count: currentGroup.length
         })
      }

      return grouped
   }

   const fetchNotifications = useCallback(async () => {
      if (!userId) {
         setLoading(false)
         return
      }

      try {
         setLoading(true)

         const SUPABASE_URL = 'https://yrgvyklwdroklpwjdcov.supabase.co'
         const SUPABASE_ANON_KEY = 'sb_publishable_0hMmVw7NmfaXuKg6jX8jLQ_maFdF0fT'

         const url = `${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${userId}&order=created_at.desc&limit=100`

         const response = await fetch(url, {
            method: 'GET',
            headers: {
               'Content-Type': 'application/json',
               'apikey': SUPABASE_ANON_KEY,
               'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
         })

         if (response.status === 404) {
            setNotifications([])
            setUnreadCount(0)
            setLoading(false)
            return
         }

         if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
         }

         const data = await response.json()
         console.log('📨 Получены уведомления из БД:', data.length, 'шт.')

         const notificationsWithActor = await Promise.all(
            data.map(async (notif) => {
               try {
                  const actorUrl = `${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${notif.actor_id}&select=name`
                  const actorResponse = await fetch(actorUrl, {
                     method: 'GET',
                     headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                     }
                  })
                  if (actorResponse.ok) {
                     const actorData = await actorResponse.json()
                     return {
                        ...notif,
                        actor: actorData.length > 0 ? actorData[0] : { name: 'Неизвестный' }
                     }
                  }
                  return { ...notif, actor: { name: 'Неизвестный' } }
               } catch (e) {
                  return { ...notif, actor: { name: 'Неизвестный' } }
               }
            })
         )

         const grouped = groupNotifications(notificationsWithActor)
         setNotifications(grouped)
         setUnreadCount(notificationsWithActor?.filter(n => !n.read).length || 0)
         console.log('🔔 Непрочитанных:', unreadCount)
      } catch (error) {
         console.error('Ошибка загрузки уведомлений:', error)
         setNotifications([])
         setUnreadCount(0)
      } finally {
         setLoading(false)
      }
   }, [userId])

   const markAllAsRead = useCallback(async () => {
      if (!userId) return

      try {
         const SUPABASE_URL = 'https://yrgvyklwdroklpwjdcov.supabase.co'
         const SUPABASE_ANON_KEY = 'sb_publishable_0hMmVw7NmfaXuKg6jX8jLQ_maFdF0fT'

         const url = `${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${userId}&read=eq.false`

         const response = await fetch(url, {
            method: 'PATCH',
            headers: {
               'Content-Type': 'application/json',
               'apikey': SUPABASE_ANON_KEY,
               'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
               'Prefer': 'return=representation'
            },
            body: JSON.stringify({ read: true })
         })

         if (response.status === 404) return

         if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
         }

         setUnreadCount(0)
         setNotifications(prev =>
            prev.map(group => ({
               ...group,
               notifications: group.notifications.map(n => ({ ...n, read: true }))
            }))
         )
         console.log('✅ Все уведомления отмечены как прочитанные')
      } catch (error) {
         console.warn('⚠️ Не удалось отметить уведомления:', error.message)
      }
   }, [userId])

   const markAsRead = useCallback(async (notificationId) => {
      if (!userId) return

      try {
         const SUPABASE_URL = 'https://yrgvyklwdroklpwjdcov.supabase.co'
         const SUPABASE_ANON_KEY = 'sb_publishable_0hMmVw7NmfaXuKg6jX8jLQ_maFdF0fT'

         const url = `${SUPABASE_URL}/rest/v1/notifications?id=eq.${notificationId}`

         const response = await fetch(url, {
            method: 'PATCH',
            headers: {
               'Content-Type': 'application/json',
               'apikey': SUPABASE_ANON_KEY,
               'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
               'Prefer': 'return=representation'
            },
            body: JSON.stringify({ read: true })
         })

         if (response.status === 404) return

         if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
         }

         setNotifications(prev =>
            prev.map(group => ({
               ...group,
               notifications: group.notifications.map(n =>
                  n.id === notificationId ? { ...n, read: true } : n
               )
            }))
         )
         setUnreadCount(prev => Math.max(0, prev - 1))
         console.log(`✅ Уведомление ${notificationId} отмечено как прочитанное`)
      } catch (error) {
         console.warn('⚠️ Не удалось отметить уведомление:', error.message)
      }
   }, [userId])

   // Форматирование времени с учетом часового пояса
   const formatTime = (dateStr) => {
      const date = new Date(dateStr)
      // Коррекция для UTC+3 (Москва, Беларусь)
      date.setHours(date.getHours() + 3)

      const now = new Date()
      const diff = Math.floor((now - date) / 60000)

      if (diff < 1) return 'только что'
      if (diff < 60) return `${diff} мин назад`
      if (diff < 1440) {
         const hours = Math.floor(diff / 60)
         return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'} назад`
      }
      return date.toLocaleDateString('ru-RU', {
         day: 'numeric',
         month: 'long',
         year: 'numeric'
      })
   }

   useEffect(() => {
      if (!userId) return

      const handleVisibilityChange = () => {
         if (!document.hidden) {
            fetchNotifications()
         }
      }

      const interval = setInterval(() => {
         fetchNotifications()
      }, 30000)

      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
         document.removeEventListener('visibilitychange', handleVisibilityChange)
         clearInterval(interval)
      }
   }, [userId, fetchNotifications])

   useEffect(() => {
      fetchNotifications()
   }, [fetchNotifications])

   return {
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAllAsRead,
      markAsRead,
      formatTime
   }
}