import React, { useState, useEffect, useRef } from 'react'
import { Calendar } from '../components/Calendar/Calendar'
import { Timeline } from '../components/Timeline/Timeline'
import { AddShiftForm } from '../components/Shifts/AddShiftForm'
import { fetchSites, fetchWorkers } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

export function MainPage({ shifts, loading, refetchShifts }) {
    console.log('📅 MainPage рендерится')
    console.log('📅 shifts.length:', shifts?.length || 0)
    console.log('📅 loading:', loading)
    
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [calendarMode, setCalendarMode] = useState('month')
    const [isReturning, setIsReturning] = useState(false)
    const [savedScrollTop, setSavedScrollTop] = useState(null)
    
    const [showAddShift, setShowAddShift] = useState(false)
    const [sites, setSites] = useState([])
    const [workers, setWorkers] = useState([])
    
    const [showSavingScreen, setShowSavingScreen] = useState(false)
    const [updateKey, setUpdateKey] = useState(0)
    const { user } = useAuth()
    
    const isFirstMount = useRef(true)
    const isDataLoaded = useRef(false)

    // === ФУНКЦИЯ ДЛЯ ФОРМАТИРОВАНИЯ ДАТЫ В ЛОКАЛЬНЫЙ ФОРМАТ ===
    const formatDateLocal = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // === ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ СМЕН ЗА КОНКРЕТНУЮ ДАТУ ===
    const getShiftsForDate = (date) => {
        if (!shifts || shifts.length === 0) return []
        const dateStr = formatDateLocal(date)
        console.log(`📅 getShiftsForDate(${dateStr}):`, shifts.filter(s => s.work_date === dateStr).length)
        return shifts.filter(s => s.work_date === dateStr)
    }

    // ЗАГРУЗКА ДАННЫХ ПРИ ПЕРВОМ ОТКРЫТИИ
    useEffect(() => {
        console.log('📅 useEffect (первый рендер)')
        const loadData = async () => {
            const today = new Date()
            console.log('📅 Сегодня (локально):', formatDateLocal(today))
            setSelectedDate(today)
            
            if (refetchShifts) {
                console.log('📅 Вызываем refetchShifts()')
                await refetchShifts()
            }
            await loadSitesAndWorkers()
            
            const todayShifts = getShiftsForDate(today)
            console.log('📅 Смен на сегодня после загрузки:', todayShifts.length)
            
            setUpdateKey(prev => prev + 1)
            isDataLoaded.current = true
            console.log('📅 isDataLoaded = true, updateKey =', updateKey + 1)
        }
        
        if (isFirstMount.current) {
            isFirstMount.current = false
            loadData()
        }
    }, [])

    // ОБНОВЛЕНИЕ ПРИ ИЗМЕНЕНИИ shifts
    useEffect(() => {
        console.log('📅 useEffect (shifts changed), shifts.length:', shifts?.length || 0)
        
        if (isDataLoaded.current && shifts.length > 0) {
            const today = new Date()
            const todayShifts = getShiftsForDate(today)
            console.log('📅 Смен на сегодня при изменении shifts:', todayShifts.length)
            setUpdateKey(prev => prev + 1)
        }
    }, [shifts])

    const loadSitesAndWorkers = async () => {
        console.log('📅 loadSitesAndWorkers начата')
        try {
            const [sitesData, workersData] = await Promise.all([
                fetchSites(),
                fetchWorkers()
            ])
            console.log('📅 sites загружено:', sitesData?.length || 0)
            console.log('📅 workers загружено:', workersData?.length || 0)
            setSites(sitesData || [])
            setWorkers(workersData || [])
        } catch (error) {
            console.error('Ошибка загрузки данных:', error)
        }
    }

    if (loading) {
        console.log('📅 Показываем загрузку')
        return <div className="loading-text">⏳ Загрузка...</div>
    }

    const handleDayClick = (date) => {
        const dateStr = formatDateLocal(date)
        console.log('📅 handleDayClick:', dateStr)
        setSelectedDate(date)
        
        const dayShifts = getShiftsForDate(date)
        console.log('📅 Смен на выбранную дату:', dayShifts.length)
        setUpdateKey(prev => prev + 1)
    }

    const handleModeChange = (mode) => {
        console.log('📅 handleModeChange:', mode)
        setCalendarMode(mode)
        if (mode !== 'feed') {
            setSavedScrollTop(null)
        }
        setIsReturning(false)
    }

    const handleOpenAddShift = (date) => {
        console.log('📅 handleOpenAddShift:', formatDateLocal(date))
        setSelectedDate(date)
        setShowAddShift(true)
    }

    const handleShiftAdded = async () => {
        console.log('📅 handleShiftAdded начат')
        setShowSavingScreen(true)
        setShowAddShift(false)
        
        if (refetchShifts) {
            console.log('📅 вызываем refetchShifts()')
            await refetchShifts()
        }
        await loadSitesAndWorkers()
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setShowSavingScreen(false)
        setUpdateKey(prev => prev + 1)
        console.log('📅 handleShiftAdded завершен, updateKey:', updateKey + 1)
    }

    if (showSavingScreen) {
        return (
            <div className="saving-screen">
                <div className="saving-content">
                    <div className="saving-spinner"></div>
                    <h2 className="saving-title">Сохраняем смену</h2>
                    <p className="saving-text">Пожалуйста, подождите</p>
                </div>
            </div>
        )
    }

    if (showAddShift) {
        return (
            <AddShiftForm
                selectedDate={selectedDate}
                onClose={() => setShowAddShift(false)}
                onSuccess={handleShiftAdded}
                sites={sites}
                workers={workers}
            />
        )
    }

    if (!selectedDate) {
        return <div className="loading-text">⏳ Загрузка...</div>
    }

    const monthNames = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
    const buttonDate = `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]}`

    const selectedDateStr = formatDateLocal(selectedDate)
    const selectedDayShifts = shifts ? shifts.filter(s => s.work_date === selectedDateStr) : []
    console.log(`📅 Рендерим календарь, selectedDate: ${selectedDateStr}`)
    console.log(`📅 Смен на ${selectedDateStr}: ${selectedDayShifts.length}`)
    console.log(`📅 updateKey: ${updateKey}`)

    return (
        <>
            <Calendar
                shifts={shifts}
                sites={sites}
                selectedDate={selectedDate}
                onDateSelect={handleDayClick}
                onDayClick={handleDayClick}
                mode={calendarMode}
                onModeChange={handleModeChange}
                isReturning={isReturning}
                savedScrollTop={savedScrollTop}
            />

            <div className="detail-under-calendar">
                {user?.role === 'admin' && (
                    <div className="detail-add-button-wrapper">
                        <button 
                            className="detail-add-button"
                            onClick={() => handleOpenAddShift(selectedDate)}
                        >
                            ➕ Добавить смену на {buttonDate}
                        </button>
                    </div>
                )}
                
                <Timeline 
                    key={updateKey}
                    shifts={shifts} 
                    date={selectedDate} 
                    onClose={null}
                    isFullscreen={false}
                    hideHeader={true}
                />
            </div>
        </>
    )
}
