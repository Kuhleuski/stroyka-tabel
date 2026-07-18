const SUPABASE_URL = 'https://yrgvyklwdroklpwjdcov.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_0hMmVw7NmfaXuKg6jX8jLQ_maFdF0fT'

export const supabase = {
    from: (table) => ({
        select: (columns) => ({
            order: (column, options) => {
                const url = `${SUPABASE_URL}/rest/v1/${table}?select=${columns}&order=${column}.desc&apikey=${SUPABASE_ANON_KEY}`
                return fetch(url, {
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
            }
        }),
        insert: (data) => ({
            select: () => {
                const url = `${SUPABASE_URL}/rest/v1/${table}?apikey=${SUPABASE_ANON_KEY}`
                return fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(data)
                }).then(async res => {
                    if (!res.ok) throw new Error('Ошибка добавления')
                    const result = await res.json()
                    return { data: result, error: null }
                })
            }
        })
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
        console.error('Ошибка загрузки:', error)
        throw error
    }
}

export async function addSite(name, address) {
    const url = `${SUPABASE_URL}/rest/v1/sites?apikey=${SUPABASE_ANON_KEY}`
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify([{ name, address }])
    })
    
    if (!response.ok) {
        throw new Error('Ошибка добавления объекта')
    }
    
    return await response.json()
}
