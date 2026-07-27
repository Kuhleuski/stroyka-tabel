const SUPABASE_URL = 'https://yrgvyklwdroklpwjdcov.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_0hMmVw7NmfaXuKg6jX8jLQ_maFdF0fT'

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
        const url = `${SUPABASE_URL}/rest/v1/shifts?select=*&order=work_date.desc&apikey=${SUPABASE_ANON_KEY}`
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
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

export async function addShift(shiftData) {
    try {
        const url = `${SUPABASE_URL}/rest/v1/shifts?apikey=${SUPABASE_ANON_KEY}`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
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

export async function fetchSites() {
    try {
        const url = `${SUPABASE_URL}/rest/v1/sites?select=*&order=name.asc&apikey=${SUPABASE_ANON_KEY}`
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
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
    const url = `${SUPABASE_URL}/rest/v1/sites?apikey=${SUPABASE_ANON_KEY}`
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
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
        const url = `${SUPABASE_URL}/rest/v1/sites?id=eq.${siteId}&apikey=${SUPABASE_ANON_KEY}`
        console.log('🔍 Удаление объекта:', siteId)
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
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
        const url = `${SUPABASE_URL}/rest/v1/workers?select=*&order=name.asc&apikey=${SUPABASE_ANON_KEY}`
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
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

// === ДОБАВЛЕНИЕ РАБОТНИКА С СЖАТИЕМ ФОТО ===
export async function addWorker(name, avatarFile = null) {
    try {
        let avatarBase64 = null
        if (avatarFile) {
            console.log('📸 Сжимаем фото...')
            avatarBase64 = await compressImage(avatarFile, 300, 300, 0.7)
            console.log('📸 Фото сжато, длина:', avatarBase64.length)
        }

        const url = `${SUPABASE_URL}/rest/v1/workers?apikey=${SUPABASE_ANON_KEY}`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify([{ 
                name, 
                avatar: avatarBase64,
                status: 'active'  // ← Новый работник сразу активен
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
    const url = `${SUPABASE_URL}/rest/v1/workers?id=eq.${workerId}&apikey=${SUPABASE_ANON_KEY}`
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Ошибка удаления: ${response.status} ${errorText}`)
    }
    return true
}

// === ОБНОВЛЕНИЕ РАБОТНИКА ===
export async function updateWorker(workerId, name, avatarFile = null) {
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

        console.log('📤 Отправляем на обновление:', JSON.stringify(updateData, null, 2))

        const url = `${SUPABASE_URL}/rest/v1/workers?id=eq.${workerId}&apikey=${SUPABASE_ANON_KEY}`
        console.log('📤 URL запроса:', url)
        
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
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
            
            const getUrl = `${SUPABASE_URL}/rest/v1/workers?id=eq.${workerId}&apikey=${SUPABASE_ANON_KEY}`
            const getResponse = await fetch(getUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })
            
            if (getResponse.ok) {
                const getResult = await getResponse.json()
                console.log('📥 Текущие данные работника:', getResult)
                
                if (getResult && getResult.length > 0) {
                    const currentName = getResult[0].name
                    if (currentName !== name.trim()) {
                        console.warn(`⚠️ Имя не изменилось: было "${currentName}", пытались установить "${name.trim()}"`)
                        console.warn('⚠️ Возможно, в Supabase есть ограничение на обновление поля name')
                    }
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

// === ОБНОВЛЕНИЕ ОБЪЕКТА ===
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

        const url = `${SUPABASE_URL}/rest/v1/sites?id=eq.${siteId}&apikey=${SUPABASE_ANON_KEY}`
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
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

// === ОБНОВЛЕНИЕ СТАТУСА ОБЪЕКТА ===
export async function updateSiteStatus(siteId, status) {
    try {
        if (!siteId) {
            throw new Error('ID объекта не указан')
        }

        const updateData = { status }

        console.log('📤 Обновляем статус объекта:', siteId, status)

        const url = `${SUPABASE_URL}/rest/v1/sites?id=eq.${siteId}&apikey=${SUPABASE_ANON_KEY}`
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
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

// === ОБНОВЛЕНИЕ СТАТУСА РАБОТНИКА ===
export async function updateWorkerStatus(workerId, status) {
    try {
        if (!workerId) {
            throw new Error('ID работника не указан')
        }

        const updateData = { status }

        console.log('📤 Обновляем статус работника:', workerId, status)

        const url = `${SUPABASE_URL}/rest/v1/workers?id=eq.${workerId}&apikey=${SUPABASE_ANON_KEY}`
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
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
