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
        console.log('📥 fetchWorkers: начат')
        const url = `${SUPABASE_URL}/rest/v1/workers?select=*&order=name.asc&apikey=${SUPABASE_ANON_KEY}`
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        })
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('📥 fetchWorkers: загружено', data.length, 'работников')
        return data
    } catch (error) {
        console.error('Ошибка загрузки работников:', error)
        throw error
    }
}

// === ИСПРАВЛЕННАЯ ЗАГРУЗКА ФОТО ===
export async function uploadAvatar(file, workerId) {
    console.log('📸 uploadAvatar: НАЧАЛО')
    console.log('📸 workerId:', workerId)
    console.log('📸 file.name:', file?.name)
    console.log('📸 file.size:', file?.size, 'байт')
    console.log('📸 file.type:', file?.type)
    
    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${workerId}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`
        console.log('📸 filePath:', filePath)

        // === ИСПРАВЛЕННЫЙ СПОСОБ ===
        const url = `${SUPABASE_URL}/storage/v1/object/avatars/${filePath}`
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: file
        })
        
        console.log('📸 Статус ответа:', response.status)
        console.log('📸 Ответ OK?', response.ok)
        
        if (!response.ok) {
            const errorText = await response.text()
            console.error('❌ Ошибка загрузки фото:', errorText)
            throw new Error(`Ошибка загрузки фото: ${response.status} ${errorText}`)
        }

        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/avatars/${filePath}`
        console.log('✅ Фото загружено! URL:', publicUrl)
        return publicUrl
    } catch (error) {
        console.error('❌ uploadAvatar: ОШИБКА:', error)
        throw error
    }
}

export async function addWorker(name, avatarFile = null) {
    console.log('👷 addWorker: НАЧАЛО')
    console.log('👷 name:', name)
    console.log('👷 avatarFile:', avatarFile ? avatarFile.name : 'null')
    
    try {
        // Сначала создаем работника
        console.log('👷 Создаем работника в таблице...')
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
            console.error('❌ Ошибка создания работника:', errorText)
            throw new Error(`Ошибка добавления: ${response.status} ${errorText}`)
        }
        
        const result = await response.json()
        const newWorker = result[0] || result
        console.log('✅ Работник создан, ID:', newWorker.id)
        
        // Если есть фото — загружаем и обновляем запись
        if (avatarFile && newWorker.id) {
            console.log('📸 Начинаем загрузку фото для работника', newWorker.id)
            try {
                const avatarUrl = await uploadAvatar(avatarFile, newWorker.id)
                console.log('📸 Фото загружено, URL:', avatarUrl)
                
                // Обновляем запись с URL фото
                console.log('📝 Обновляем запись работника с фото...')
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
                    console.log('✅ Работник обновлен с фото:', updatedResult)
                    return updatedResult[0] || updatedResult
                } else {
                    console.error('❌ Ошибка обновления работника:', await updateResponse.text())
                }
            } catch (uploadError) {
                console.error('❌ Фото не загружено, но работник создан:', uploadError)
            }
        } else {
            console.log('👷 Фото не передано, работник создан без фото')
        }
        
        console.log('👷 addWorker: ЗАВЕРШЕНО, возвращаем работника')
        return newWorker
    } catch (error) {
        console.error('❌ Ошибка в addWorker:', error)
        throw error
    }
}

export async function deleteWorker(workerId) {
    console.log('🗑️ deleteWorker:', workerId)
    const url = `${SUPABASE_URL}/rest/v1/workers?id=eq.${workerId}&apikey=${SUPABASE_ANON_KEY}`
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    
    if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Ошибка удаления:', errorText)
        throw new Error(`Ошибка удаления: ${response.status} ${errorText}`)
    }
    
    console.log('✅ Работник удален')
    return true
}
