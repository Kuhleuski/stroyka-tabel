const SUPABASE_URL = 'https://yrgvyklwdroklpwjdcov.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_0hMmVw7NmfaXuKg6jX8jLQ_maFdF0fT'

// === ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ЗАГОЛОВКОВ ===
const getHeaders = () => ({
   'Content-Type': 'application/json',
   'apikey': SUPABASE_ANON_KEY,
   'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
   'Prefer': 'return=representation'
})

// === ФУНКЦИЯ СЖАТИЯ ФОТО ДО 300x300 ===
export const compressImage = (file, maxWidth = 300, maxHeight = 300, quality = 0.7) => {
   return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
         const img = new Image()
         img.src = event.target.result
         img.onload = () => {
            let width = img.width
            let height = img.height

            if (width > height) {
               if (width > maxWidth) {
                  height = Math.round(height * (maxWidth / width))
                  width = maxWidth
               }
            } else {
               if (height > maxHeight) {
                  width = Math.round(width * (maxHeight / height))
                  height = maxHeight
               }
            }

            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, width, height)

            const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
            resolve(compressedBase64)
         }
         img.onerror = (error) => reject(error)
      }
      reader.onerror = (error) => reject(error)
   })
}

// === ФУНКЦИЯ КОНВЕРТАЦИИ ФАЙЛА В BASE64 (без сжатия) ===
export const fileToBase64 = (file) => {
   return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
   })
}

// ============================================================
// ОСНОВНЫЕ ФУНКЦИИ
// ============================================================

export async function fetchShifts() {
   try {
      const url = `${SUPABASE_URL}/rest/v1/shifts?select=*&order=work_date.desc`
      const response = await fetch(url, {
         method: 'GET',
         headers: getHeaders()
      })

      if (!response.ok) {
         throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
   } catch (error) {
      console.error('Ошибка загрузки смен:', error)
      throw error
   }
}

// === ПОИСК ВСЕХ СМЕН ДЛЯ ОБЪЕКТА И ДАТЫ ===
export async function findShiftsForSiteAndDate(siteId, workDate) {
   try {
      const url = `${SUPABASE_URL}/rest/v1/shifts?site_id=eq.${siteId}&work_date=eq.${workDate}&select=*`
      console.log('🔍 Запрос на поиск смен:', url)

      const response = await fetch(url, {
         method: 'GET',
         headers: getHeaders()
      })

      if (!response.ok) {
         throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('🔍 Найдено смен:', data.length)
      return data
   } catch (error) {
      console.error('Ошибка поиска смен:', error)
      throw error
   }
}

// === ДОБАВЛЕНИЕ СМЕНЫ ===
export async function addShift(shiftData) {
   try {
      const url = `${SUPABASE_URL}/rest/v1/shifts`
      const response = await fetch(url, {
         method: 'POST',
         headers: getHeaders(),
         body: JSON.stringify([{
            worker_id: shiftData.worker_id,
            site_id: shiftData.site_id,
            work_date: shiftData.work_date,
            hours: shiftData.hours || 8,
            status: shiftData.status || 'pending'
         }])
      })

      if (!response.ok) {
         const errorText = await response.text()
         throw new Error(`Ошибка добавления смены: ${response.status} ${errorText}`)
      }

      return await response.json()
   } catch (error) {
      console.error('Ошибка в addShift:', error)
      throw error
   }
}

// === УДАЛЕНИЕ СМЕНЫ ПО ID ===
export async function deleteShiftById(shiftId) {
   try {
      console.log('🗑️ Удаляем смену ID:', shiftId)

      const url = `${SUPABASE_URL}/rest/v1/shifts?id=eq.${shiftId}`
      const response = await fetch(url, {
         method: 'DELETE',
         headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
         }
      })

      console.log('📡 Статус удаления:', response.status)

      if (!response.ok) {
         const errorText = await response.text()
         console.error('❌ Ошибка удаления:', response.status, errorText)
         throw new Error(`Ошибка удаления: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Удалено смен:', result ? result.length : 0)
      return result
   } catch (error) {
      console.error('❌ Ошибка в deleteShiftById:', error)
      throw error
   }
}

// === УДАЛЕНИЕ ВСЕХ СМЕН ДЛЯ ОБЪЕКТА И ДАТЫ ===
export async function deleteShiftsForSiteAndDate(siteId, workDate, actorId = null) {
   try {
      const existingShifts = await findShiftsForSiteAndDate(siteId, workDate)

      if (!existingShifts || existingShifts.length === 0) {
         console.log('ℹ️ Нет смен для удаления')
         return []
      }

      console.log(`🗑️ Удаляем ${existingShifts.length} смен...`)

      // Получаем информацию для уведомления
      let siteName = 'Неизвестный объект'
      let actorName = 'Неизвестный'
      let workerNames = []

      try {
         siteName = await getSiteName(siteId)
         if (actorId) {
            actorName = await getUserName(actorId)
         }
         const workerIds = existingShifts.map(s => s.worker_id)
         workerNames = await getWorkerNames(workerIds)
      } catch (e) {
         console.warn('⚠️ Не удалось получить данные для уведомления:', e)
      }

      let deletedCount = 0
      const deletedShifts = []

      for (const shift of existingShifts) {
         try {
            const result = await deleteShiftById(shift.id)
            if (result && result.length > 0) {
               deletedCount++
               deletedShifts.push(result[0])
            }
         } catch (err) {
            console.error(`❌ Ошибка при удалении смены ${shift.id}:`, err)
         }
      }

      console.log(`✅ Удалено смен: ${deletedCount} из ${existingShifts.length}`)

      // Создаем уведомление об удалении
      if (actorId && deletedCount > 0) {
         try {
            const dateObj = new Date(workDate + 'T00:00:00')
            const formattedDate = dateObj.toLocaleDateString('ru-RU', {
               day: 'numeric',
               month: 'long',
               year: 'numeric'
            })

            const message = `${actorName} удалил смену на ${formattedDate}`
            const details = {
               actorName,
               siteName,
               workerNames,
               formattedDate,
               siteId,
               workDate,
               deletedCount
            }

            await createNotification(
               actorId,
               'shift_deleted',
               message,
               details
            )
         } catch (notifError) {
            console.error('⚠️ Ошибка создания уведомления об удалении:', notifError)
         }
      }

      return deletedShifts
   } catch (error) {
      console.error('❌ Ошибка в deleteShiftsForSiteAndDate:', error)
      throw error
   }
}

// === СОХРАНЕНИЕ СМЕНЫ (СОЗДАНИЕ ИЛИ ОБНОВЛЕНИЕ) ===
// === СОХРАНЕНИЕ СМЕНЫ (СОЗДАНИЕ ИЛИ ОБНОВЛЕНИЕ) ===
export async function saveShift(siteId, workDate, workerIds, actorId = null) {
   try {
      console.log('📝 saveShift вызван:', { siteId, workDate, workerIds, actorId })

      const existingShifts = await findShiftsForSiteAndDate(siteId, workDate)
      console.log('📊 Существующие смены:', existingShifts)

      const isUpdate = existingShifts && existingShifts.length > 0

      // Получаем старых работников ДО удаления
      let oldWorkerNames = []
      if (isUpdate) {
         const oldWorkerIds = existingShifts.map(s => s.worker_id)
         oldWorkerNames = await getWorkerNames(oldWorkerIds)
         console.log('📊 Старые работники:', oldWorkerNames)
      }

      if (isUpdate) {
         console.log(`🗑️ Удаляем ${existingShifts.length} старых смен...`)
         await deleteShiftsForSiteAndDate(siteId, workDate)
      }

      if (workerIds && workerIds.length > 0) {
         console.log('➕ Создаем новые смены для работников:', workerIds)

         const addPromises = workerIds.map(workerId =>
            addShift({
               worker_id: workerId,
               site_id: siteId,
               work_date: workDate,
               hours: 8,
               status: 'pending'
            })
         )

         const results = await Promise.all(addPromises)
         console.log('✅ Новые смены созданы:', results.length)
      }

      // Создаем расширенное уведомление
      if (actorId) {
         try {
            const actorName = await getUserName(actorId)
            const siteName = await getSiteName(siteId)
            const newWorkerNames = await getWorkerNames(workerIds)

            const actionType = isUpdate ? 'shift_updated' : 'shift_created'
            const actionText = isUpdate ? 'обновил' : 'добавил'

            const dateObj = new Date(workDate + 'T00:00:00')
            const formattedDate = dateObj.toLocaleDateString('ru-RU', {
               day: 'numeric',
               month: 'long',
               year: 'numeric'
            })

            const message = `${actorName} ${actionText} смену на ${formattedDate}`
            const details = {
               actorName,
               siteName,
               workerNames: newWorkerNames,
               oldWorkerNames: oldWorkerNames, // ← СТАРЫЕ РАБОТНИКИ
               formattedDate,
               siteId,
               workDate,
               workerIds,
               isUpdate
            }

            await createNotification(
               actorId,
               actionType,
               message,
               details
            )
         } catch (notifError) {
            console.error('⚠️ Ошибка создания уведомления:', notifError)
         }
      }

      return true
   } catch (error) {
      console.error('❌ Ошибка в saveShift:', error)
      throw error
   }
}

// ============================================================
// ФУНКЦИИ ДЛЯ УВЕДОМЛЕНИЙ
// ============================================================

export async function getAdminUsers() {
   try {
      const url = `${SUPABASE_URL}/rest/v1/user_profiles?role=eq.admin&select=id,name,phone`
      const response = await fetch(url, {
         method: 'GET',
         headers: getHeaders()
      })

      if (!response.ok) {
         throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
   } catch (error) {
      console.error('Ошибка получения администраторов:', error)
      return []
   }
}

export async function getUserName(userId) {
   try {
      const url = `${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${userId}&select=name`
      const response = await fetch(url, {
         method: 'GET',
         headers: getHeaders()
      })

      if (!response.ok) {
         throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.length > 0 ? data[0].name : 'Неизвестный'
   } catch (error) {
      console.error('Ошибка получения имени пользователя:', error)
      return 'Неизвестный'
   }
}

export async function getSiteName(siteId) {
   try {
      const url = `${SUPABASE_URL}/rest/v1/sites?id=eq.${siteId}&select=name`
      const response = await fetch(url, {
         method: 'GET',
         headers: getHeaders()
      })

      if (!response.ok) {
         throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.length > 0 ? data[0].name : 'Неизвестный объект'
   } catch (error) {
      console.error('Ошибка получения имени объекта:', error)
      return 'Неизвестный объект'
   }
}

export async function getWorkerNames(workerIds) {
   try {
      if (!workerIds || workerIds.length === 0) return []

      const url = `${SUPABASE_URL}/rest/v1/workers?id=in.(${workerIds.join(',')})&select=name`
      const response = await fetch(url, {
         method: 'GET',
         headers: getHeaders()
      })

      if (!response.ok) {
         throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.map(w => w.name)
   } catch (error) {
      console.error('Ошибка получения имен работников:', error)
      return []
   }
}

export async function createNotification(actorId, actionType, message, details = null) {
   try {
      console.log('🔔 Создаем уведомление:', { actorId, actionType, message })

      const admins = await getAdminUsers()
      const targetUsers = admins.filter(a => a.id !== actorId)

      if (targetUsers.length === 0) {
         console.log('ℹ️ Нет админов для уведомления')
         return
      }

      const notifications = targetUsers.map(user => ({
         user_id: user.id,
         actor_id: actorId,
         action_type: actionType,
         message: message,
         details: details || {},
         read: false,
         created_at: new Date().toISOString()
      }))

      const url = `${SUPABASE_URL}/rest/v1/notifications`
      const response = await fetch(url, {
         method: 'POST',
         headers: getHeaders(),
         body: JSON.stringify(notifications)
      })

      if (!response.ok) {
         const errorText = await response.text()
         console.error('❌ Ошибка создания уведомлений:', response.status, errorText)
         throw new Error(`Ошибка создания уведомлений: ${response.status}`)
      }

      console.log(`✅ Создано ${notifications.length} уведомлений`)
      return await response.json()
   } catch (error) {
      console.error('❌ Ошибка в createNotification:', error)
      throw error
   }
}

// ============================================================
// ФУНКЦИИ ДЛЯ ОБЪЕКТОВ
// ============================================================

export async function fetchSites() {
   try {
      const url = `${SUPABASE_URL}/rest/v1/sites?select=*&order=name.asc`
      const response = await fetch(url, {
         method: 'GET',
         headers: getHeaders()
      })

      if (!response.ok) {
         throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
   } catch (error) {
      console.error('Ошибка загрузки объектов:', error)
      throw error
   }
}

export async function addSite(name, address, color) {
   const url = `${SUPABASE_URL}/rest/v1/sites`
   const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify([{ name, address, color }])
   })

   if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Ошибка добавления: ${response.status} ${errorText}`)
   }

   return await response.json()
}

export async function deleteSite(siteId) {
   try {
      const url = `${SUPABASE_URL}/rest/v1/sites?id=eq.${siteId}`
      console.log('🔍 Удаление объекта:', siteId)
      const response = await fetch(url, {
         method: 'DELETE',
         headers: getHeaders()
      })
      console.log('📡 Статус удаления:', response.status)
      if (!response.ok) {
         const errorText = await response.text()
         console.error('❌ Ошибка удаления:', errorText)
         throw new Error(`Ошибка удаления: ${response.status} ${errorText}`)
      }
      const result = await response.json()
      console.log('✅ Удалено:', result)
      return true
   } catch (error) {
      console.error('❌ Ошибка в deleteSite:', error)
      throw error
   }
}

// ============================================================
// ФУНКЦИИ ДЛЯ РАБОТНИКОВ
// ============================================================

export async function fetchWorkers() {
   try {
      const url = `${SUPABASE_URL}/rest/v1/workers?select=*&order=name.asc`
      const response = await fetch(url, {
         method: 'GET',
         headers: getHeaders()
      })
      if (!response.ok) {
         throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
   } catch (error) {
      console.error('Ошибка загрузки работников:', error)
      throw error
   }
}

export async function addWorker(name, avatarFile = null) {
   try {
      let avatarBase64 = null
      if (avatarFile) {
         console.log('📸 Сжимаем фото...')
         avatarBase64 = await compressImage(avatarFile, 300, 300, 0.7)
         console.log('📸 Фото сжато, длина:', avatarBase64.length)
      }

      const url = `${SUPABASE_URL}/rest/v1/workers`
      const response = await fetch(url, {
         method: 'POST',
         headers: getHeaders(),
         body: JSON.stringify([{
            name,
            avatar: avatarBase64,
            status: 'active'
         }])
      })

      if (!response.ok) {
         const errorText = await response.text()
         throw new Error(`Ошибка добавления: ${response.status} ${errorText}`)
      }

      return await response.json()
   } catch (error) {
      console.error('Ошибка в addWorker:', error)
      throw error
   }
}

export async function deleteWorker(workerId) {
   const url = `${SUPABASE_URL}/rest/v1/workers?id=eq.${workerId}`
   const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders()
   })
   if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Ошибка удаления: ${response.status} ${errorText}`)
   }
   return true
}

// ============================================================
// ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ
// ============================================================

export async function updateWorker(workerId, name, avatarFile = null, status = null) {
   try {
      if (!workerId) {
         throw new Error('ID работника не указан')
      }

      let avatarBase64 = null

      if (avatarFile) {
         console.log('📸 Сжимаем фото для обновления...')
         avatarBase64 = await compressImage(avatarFile, 300, 300, 0.7)
         console.log('📸 Фото сжато, длина:', avatarBase64.length)
      }

      const updateData = { name: name.trim() }
      if (avatarBase64) {
         updateData.avatar = avatarBase64
      }
      if (status) {
         updateData.status = status
      }

      console.log('📤 Отправляем на обновление:', JSON.stringify(updateData, null, 2))

      const url = `${SUPABASE_URL}/rest/v1/workers?id=eq.${workerId}`
      console.log('📤 URL запроса:', url)

      const response = await fetch(url, {
         method: 'PATCH',
         headers: getHeaders(),
         body: JSON.stringify(updateData)
      })

      console.log('📡 Статус ответа:', response.status)

      if (!response.ok) {
         const errorText = await response.text()
         console.error('❌ Ошибка ответа:', response.status, errorText)
         throw new Error(`Ошибка обновления: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Результат обновления (сырой):', result)

      if (!result || result.length === 0) {
         console.warn('⚠️ Обновление вернуло пустой результат')

         const getUrl = `${SUPABASE_URL}/rest/v1/workers?id=eq.${workerId}`
         const getResponse = await fetch(getUrl, {
            method: 'GET',
            headers: getHeaders()
         })

         if (getResponse.ok) {
            const getResult = await getResponse.json()
            console.log('📥 Текущие данные работника:', getResult)

            if (getResult && getResult.length > 0) {
               return getResult[0]
            }
         }
         throw new Error(`Работник с ID ${workerId} не найден`)
      }

      return result[0] || result
   } catch (error) {
      console.error('❌ Ошибка в updateWorker:', error)
      throw error
   }
}

export async function updateSite(siteId, name, address, color, status) {
   try {
      if (!siteId) {
         throw new Error('ID объекта не указан')
      }

      const updateData = {
         name: name.trim(),
         address: address.trim(),
         color,
         status
      }

      console.log('📤 Обновляем объект:', siteId, updateData)

      const url = `${SUPABASE_URL}/rest/v1/sites?id=eq.${siteId}`
      const response = await fetch(url, {
         method: 'PATCH',
         headers: getHeaders(),
         body: JSON.stringify(updateData)
      })

      if (!response.ok) {
         const errorText = await response.text()
         console.error('❌ Ошибка ответа:', response.status, errorText)
         throw new Error(`Ошибка обновления: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Результат обновления:', result)

      if (!result || result.length === 0) {
         throw new Error(`Объект с ID ${siteId} не найден`)
      }

      return result[0] || result
   } catch (error) {
      console.error('❌ Ошибка в updateSite:', error)
      throw error
   }
}

export async function updateSiteStatus(siteId, status) {
   try {
      if (!siteId) {
         throw new Error('ID объекта не указан')
      }

      const updateData = { status }

      console.log('📤 Обновляем статус объекта:', siteId, status)

      const url = `${SUPABASE_URL}/rest/v1/sites?id=eq.${siteId}`
      const response = await fetch(url, {
         method: 'PATCH',
         headers: getHeaders(),
         body: JSON.stringify(updateData)
      })

      if (!response.ok) {
         const errorText = await response.text()
         console.error('❌ Ошибка ответа:', response.status, errorText)
         throw new Error(`Ошибка обновления статуса: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Результат обновления статуса:', result)

      return result[0] || result
   } catch (error) {
      console.error('❌ Ошибка в updateSiteStatus:', error)
      throw error
   }
}

export async function updateWorkerStatus(workerId, status) {
   try {
      if (!workerId) {
         throw new Error('ID работника не указан')
      }

      const updateData = { status }

      console.log('📤 Обновляем статус работника:', workerId, status)

      const url = `${SUPABASE_URL}/rest/v1/workers?id=eq.${workerId}`
      const response = await fetch(url, {
         method: 'PATCH',
         headers: getHeaders(),
         body: JSON.stringify(updateData)
      })

      if (!response.ok) {
         const errorText = await response.text()
         console.error('❌ Ошибка ответа:', response.status, errorText)
         throw new Error(`Ошибка обновления статуса: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Результат обновления статуса:', result)

      return result[0] || result
   } catch (error) {
      console.error('❌ Ошибка в updateWorkerStatus:', error)
      throw error
   }
}