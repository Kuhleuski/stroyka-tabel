import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yrgvyklwdroklpwjdcov.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_0hMmVw7NmfaXuKg6jX8jLQ_maFdF0fT'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function fetchShifts() {
   const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('work_date', { ascending: false })

   if (error) {
      console.error('Ошибка загрузки:', error)
      throw error
   }
   return data || []
}