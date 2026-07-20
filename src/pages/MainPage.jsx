import React, { useState, useEffect } from 'react'
import { Calendar } from '../components/Calendar/Calendar'
import { Timeline } from '../components/Timeline/Timeline'
import { AddShiftForm } from '../components/Shifts/AddShiftForm'
import { fetchSites, fetchWorkers } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

export function MainPage({ shifts, loading, refetchShifts }) {
    // === ДАТА ХРАНИТСЯ В sessionStorage ===
    const getStoredDate = () => {
        const stored = sessionStorage.getItem('mainPageSelectedDate')
        if (stored) {
            const date = new Date(stored)
            if (!isNaN(date.getTime())) {
                return date
            }
        }
        return new Date()
    }

    const [selectedDate, setSelectedDate] = useState(getStoredDate())
    const [calendarMode, setCalendarMode] = useState('month')
    const [isReturning, setIsReturning] = useState(false)
    const [savedScrollTop, setSavedScrollTop] = useState(null)
    
    const [showAddShift, setShowAddShift] = useState(false)
    const [sites, setSites] = useState([])
    const [workers, setWorkers] = useState([])
    
    const [showSavingScreen, setShowSavingScreen] = useState(false)
    const [updateKey, setUpdateKey] = useState(0)
    const { user } = useAuth()

    // Сохраняем дату в sessionStorage при каждом изменении
    useEffect(() => {
        sessionStorage.setItem('mainPageSelectedDate', selectedDate.toISOString())
    }, [selectedDate])

    useEffect(() => {
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
        setShowSavingScreen(true)
        setShowAddShift(false)
        
        if (refetchShifts) {
            await refetchShifts()
        }
        await loadSitesAndWorkers()
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setShowSavingScreen(false)
        
        // ДАТА НЕ ТРОГАЕТСЯ!
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

    return (
        <>
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

            <div className="detail-under-calendar">
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

                <Timeline 
                    key={updateKey}
                    shifts={shifts} 
                    date={selectedDate} 
                    onClose={null}
                    isFullscreen={false}
                />
            </div>
        </>
    )
}
