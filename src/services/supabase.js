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

export async function addWorker(name) {
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
    
    return await response.json()
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
