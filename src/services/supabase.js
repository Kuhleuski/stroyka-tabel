const SUPABASE_URL = 'https://yrgvyklwdroklpwjdcov.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_0hMmVw7NmfaXuKg6jX8jLQ_maFdF0fT'

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

// === НОВАЯ ФУНКЦИЯ: ЗАГРУЗКА ФОТО В STORAGE ===
export async function uploadAvatar(file, workerId) {
    try {
        // Уникальное имя файла
        const fileExt = file.name.split('.').pop()
        const fileName = `${workerId}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        // Загружаем в Storage
        const formData = new FormData()
        formData.append('file', file)

        const url = `${SUPABASE_URL}/storage/v1/object/avatars/${filePath}`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: file
        })
        
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Ошибка загрузки фото: ${response.status} ${errorText}`)
        }

        // Получаем публичную ссылку
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/avatars/${filePath}`
        return publicUrl
    } catch (error) {
        console.error('Ошибка загрузки фото:', error)
        throw error
    }
}

export async function addWorker(name, avatarFile = null) {
    try {
        // Сначала создаем работника
        const url = `${SUPABASE_URL}/rest/v1/workers?apikey=${SUPABASE_ANON_KEY}`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify([{ name }])
        })
        
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Ошибка добавления: ${response.status} ${errorText}`)
        }
        
        const result = await response.json()
        const newWorker = result[0] || result
        
        // Если есть фото — загружаем и обновляем запись
        if (avatarFile && newWorker.id) {
            try {
                const avatarUrl = await uploadAvatar(avatarFile, newWorker.id)
                
                // Обновляем запись с URL фото
                const updateUrl = `${SUPABASE_URL}/rest/v1/workers?id=eq.${newWorker.id}&apikey=${SUPABASE_ANON_KEY}`
                const updateResponse = await fetch(updateUrl, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({ avatar_url: avatarUrl })
                })
                
                if (updateResponse.ok) {
                    const updatedResult = await updateResponse.json()
                    return updatedResult[0] || updatedResult
                }
            } catch (uploadError) {
                console.error('Фото не загружено, но работник создан:', uploadError)
            }
        }
        
        return newWorker
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
