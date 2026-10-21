import { useState, useEffect, useCallback } from 'react'
import { fetchSalaries, addSalary, updateSalary, deleteSalary } from '../services/supabase'

export function useSalaries() {
   const [salaries, setSalaries] = useState([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState(null)

   const loadSalaries = useCallback(async () => {
      try {
         setLoading(true)
         const data = await fetchSalaries()
         setSalaries(data || [])
         setError(null)
      } catch (err) {
         setError(err.message)
      } finally {
         setLoading(false)
      }
   }, [])

   useEffect(() => {
      loadSalaries()
   }, [loadSalaries])

   const addSalaryToState = async (workerId, amount, paymentDate) => {
      try {
         const result = await addSalary(workerId, amount, paymentDate)
         const newSalary = result[0] || result
         setSalaries(prev => [newSalary, ...prev])
         return newSalary
      } catch (error) {
         console.error('Ошибка добавления зарплаты:', error)
         throw error
      }
   }

   const updateSalaryInState = async (salaryId, amount, paymentDate) => {
      try {
         await updateSalary(salaryId, amount, paymentDate)
         setSalaries(prev => prev.map(s =>
            s.id === salaryId ? { ...s, amount, payment_date: paymentDate } : s
         ))
      } catch (error) {
         console.error('Ошибка обновления зарплаты:', error)
         throw error
      }
   }

   const deleteSalaryFromState = async (salaryId) => {
      try {
         await deleteSalary(salaryId)
         setSalaries(prev => prev.filter(s => s.id !== salaryId))
      } catch (error) {
         console.error('Ошибка удаления зарплаты:', error)
         throw error
      }
   }

   return {
      salaries,
      loading,
      error,
      loadSalaries,
      addSalaryToState,
      updateSalaryInState,
      deleteSalaryFromState
   }
}