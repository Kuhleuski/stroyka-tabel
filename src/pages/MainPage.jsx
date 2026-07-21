import React, { useState, useEffect, useRef } from 'react'
import { Calendar } from '../components/Calendar/Calendar'
import { Timeline } from '../components/Timeline/Timeline'
import { AddShiftForm } from '../components/Shifts/AddShiftForm'
import { fetchSites, fetchWorkers } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

export function MainPage({ shifts, loading, refetchShifts }) {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [calendarMode, setCalendarMode] = useState('month')
    const [isReturning, setIsReturning] = useState(false)
    const [savedScrollTop, setSavedScrollTop] = useState(null)
    
    const [showAddShift, setShowAddShift] = useState(false)
    const [sites, setSites] = useState([])
    const [workers, setWorkers] = useState([])
    
    const [showSavingScreen, setShowSavingScreen] = useState(false)
    const [updateKey, setUpdateKey] = useState(0)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)  // ← НОВОЕ
    const { user } = useAuth()
    
    const isFirstMount = useRef(true)

    // ИНИЦИАЛИЗАЦИЯ ПРИ ПЕРВОМ ОТКРЫТИИ
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false
            const today = new Date()
            setSelectedDate(today)
            loadSitesAndWorkers()
            
            if (refetchShifts) {
                refetchShifts()
            }
        }
    }, [])

    // === ВОЗВРАТ НА КАЛЕНДАРЬ — ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ ===
    useEffect(() => {
        // Этот эффект срабатывает при каждом монтировании (возврате)
        const refreshData = async () => {
            setIsRefreshing(true)
            
            // Принудительно обновляем ключ календаря
            setRefreshTrigger(prev => prev + 1)
            
            // Обновляем дату на сегодня
            const today = new Date()
            setSelectedDate(today)
            
            // Загружаем свежие данные
            if (refetchShifts) {
                await refetchShifts()
            }
            await loadSitesAndWorkers()
            
            // Обновляем Timeline
            setUpdateKey(prev => prev + 1)
            
            setIsRefreshing(false)
        }
        
        refreshData()
        
        // Очистка при размонтировании
        return () => {
            setIsRefreshing(false)
        }
    }, [])  // пустой массив = срабатывает при монтировании

    const loadSitesAndWorkers = async () => {
        try {
            const [sitesData, workersData] = await Promise.all([
                fetchSites(),
                fetchWorkers()
            ])
            setSites(sitesData || [])
            setWorkers(workersData || [])
        } catch (error) {
            console.error('Ошибка загрузки данных:', error)
        }
    }

    if (loading) {
        return <div className="loading-text">⏳ Загрузка...</div>
    }

    const handleDayClick = (date) => {
        setSelectedDate(date)
    }

    const handleModeChange = (mode) => {
        setCalendarMode(mode)
        if (mode !== 'feed') {
            setSavedScrollTop(null)
        }
        setIsReturning(false)
    }

    const handleOpenAddShift = (date) => {
        setSelectedDate(date)
        setShowAddShift(true)
    }

    const handleShiftAdded = async () => {
        setShowSavingScreen(true)
        setShowAddShift(false)
        
        if (refetchShifts) {
            await refetchShifts()
        }
        await loadSitesAndWorkers()
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setShowSavingScreen(false)
        setUpdateKey(prev => prev + 1)
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

    return (
        <>
            <Calendar
                key={refreshTrigger}  // ← ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ КАЛЕНДАРЯ
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
                
                {isRefreshing ? (
                    <div className="loading-text" style={{ padding: '20px' }}>
                        ⏳ Обновление...
                    </div>
                ) : (
                    <Timeline 
                        key={updateKey}
                        shifts={shifts} 
                        date={selectedDate} 
                        onClose={null}
                        isFullscreen={false}
                        hideHeader={true}
                    />
                )}
            </div>
        </>
    )
}
