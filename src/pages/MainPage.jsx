import React, { useState, useEffect } from 'react'
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
    const { user } = useAuth()

    useEffect(() => {
        setSelectedDate(new Date())
        loadSitesAndWorkers()
    }, [])

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
        // 1. Показываем экран сохранения
        setShowSavingScreen(true)
        setShowAddShift(false)
        
        // 2. Обновляем данные
        if (refetchShifts) {
            await refetchShifts()
        }
        await loadSitesAndWorkers()
        
        // 3. Ждем 1 секунду для красоты
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 4. Закрываем экран сохранения
        setShowSavingScreen(false)
        
        // 5. Обновляем дату без установки в null
        const currentDate = new Date(selectedDate)
        setSelectedDate(currentDate)
    }

    // Экран сохранения
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

    // Форма добавления смены
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

    // Если selectedDate null (страховка)
    if (!selectedDate) {
        return <div className="loading-text">⏳ Загрузка...</div>
    }

    return (
        <>
            {/* Календарь */}
            <Calendar
                shifts={shifts}
                selectedDate={selectedDate}
                onDateSelect={handleDayClick}
                onDayClick={handleDayClick}
                mode={calendarMode}
                onModeChange={handleModeChange}
                isReturning={isReturning}
                savedScrollTop={savedScrollTop}
            />

            {/* Детальная информация под календарем */}
            <div className="detail-under-calendar">
                {/* Шапка с датой и кнопкой */}
                <div className="detail-under-header">
                    <span className="detail-under-date">
                        📅 {selectedDate.getDate()} {['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря'][selectedDate.getMonth()]} {selectedDate.getFullYear()}
                    </span>
                    {user?.role === 'admin' && (
                        <button 
                            className="detail-under-add-btn"
                            onClick={() => handleOpenAddShift(selectedDate)}
                        >
                            ➕ Добавить смену
                        </button>
                    )}
                </div>

                {/* Список смен */}
                <Timeline 
                    key={selectedDate.toISOString()}
                    shifts={shifts} 
                    date={selectedDate} 
                    onClose={null}
                    isFullscreen={false}
                />
            </div>
        </>
    )
}
