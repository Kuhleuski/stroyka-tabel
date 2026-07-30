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

// === СОХРАНЕНИЕ СМЕНЫ (СОЗДАНИЕ ИЛИ ОБНОВЛЕНИЕ) ===
export async function saveShift(siteId, workDate, workerIds) {
   try {
      console.log('📝 saveShift вызван:', { siteId, workDate, workerIds })

      // 1. Находим все существующие смены для этого объекта и даты
      const existingShifts = await findShiftsForSiteAndDate(siteId, workDate)
      console.log('📊 Существующие смены:', existingShifts)

      // 2. Если есть существующие смены - удаляем их по ID
      if (existingShifts && existingShifts.length > 0) {
         console.log(`🗑️ Удаляем ${existingShifts.length} старых смен...`)

         let deletedCount = 0
         for (const shift of existingShifts) {
            try {
               const deleteUrl = `${SUPABASE_URL}/rest/v1/shifts?id=eq.${shift.id}`
               console.log(`🗑️ Удаляем смену ID: ${shift.id}`)

               const response = await fetch(deleteUrl, {
                  method: 'DELETE',
                  headers: {
                     'Content-Type': 'application/json',
                     'apikey': SUPABASE_ANON_KEY,
                     'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                     'Prefer': 'return=representation'
                  }
               })

               if (response.ok) {
                  deletedCount++
                  console.log(`✅ Удалена смена ID: ${shift.id}`)
               } else {
                  console.error(`❌ Ошибка удаления смены ${shift.id}:`, response.status)
               }
            } catch (err) {
               console.error(`❌ Ошибка при удалении смены ${shift.id}:`, err)
            }
         }
         console.log(`✅ Удалено смен: ${deletedCount} из ${existingShifts.length}`)
      }

      // 3. Создаем новые смены для каждого работника
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

      return true
   } catch (error) {
      console.error('❌ Ошибка в saveShift:', error)
      throw error
   }
}

// === ОСТАЛЬНЫЕ ФУНКЦИИ (БЕЗ ИЗМЕНЕНИЙ) ===
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