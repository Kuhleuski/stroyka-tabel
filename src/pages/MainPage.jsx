import React, { useState, useEffect } from 'react'
import { Calendar } from '../components/Calendar/Calendar'
import { Timeline } from '../components/Timeline/Timeline'
import { AddShiftForm } from '../components/Shifts/AddShiftForm'
import { fetchSites, fetchWorkers } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

export function MainPage({ shifts, loading, refetchShifts }) {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [detailDate, setDetailDate] = useState(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [returnMode, setReturnMode] = useState('month')
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

    const handleDayClick = (date, mode) => {
        if (mode === 'feed') {
            const container = document.querySelector('.feed-container')
            if (container) {
                setSavedScrollTop(container.scrollTop)
            }
        }
        
        setDetailDate(date)
        setReturnMode(mode)
        setIsReturning(false)
        setIsDetailOpen(true)
    }

    const handleCloseDetail = () => {
        setIsDetailOpen(false)
        setDetailDate(null)
        setCalendarMode(returnMode)
        setIsReturning(true)
    }

    const handleModeChange = (mode) => {
        setCalendarMode(mode)
        if (isDetailOpen) {
            setIsDetailOpen(false)
            setDetailDate(null)
        }
        if (mode !== returnMode) {
            setSavedScrollTop(null)
        }
        setIsReturning(false)
    }

    const handleDateSelect = (date) => {
        setSelectedDate(date)
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
        
        // 3. Ждем 1 секунду для плавности
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 4. Закрываем экран сохранения
        setShowSavingScreen(false)
        
        // 5. ОБНОВЛЯЕМ ДЕТАЛЬНЫЙ РЕЖИМ БЕЗ ЗАКРЫТИЯ!
        // Просто обновляем detailDate, чтобы перерисовать контент
        const currentDate = detailDate || selectedDate
        setDetailDate(null)
        
        // Сразу открываем с той же датой
        setTimeout(() => {
            setDetailDate(currentDate)
            setIsDetailOpen(true)
        }, 50)
    }

    // Если открыт экран сохранения
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

    // Если открыта форма добавления смены
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

    return (
        <>
            {isDetailOpen && detailDate ? (
                <div className="detail-screen">
                    <div className="detail-screen-header">
                        <span className="detail-screen-title">
                            📅 {detailDate.getDate()} {['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря'][detailDate.getMonth()]} {detailDate.getFullYear()}
                        </span>
                        <button className="detail-screen-close" onClick={handleCloseDetail}>
                            ✕
                        </button>
                    </div>
                    
                    {user?.role === 'admin' && (
                        <div className="detail-add-shift-wrapper">
                            <button 
                                className="detail-add-shift-btn"
                                onClick={() => handleOpenAddShift(detailDate)}
                            >
                                ➕ Добавить смену на этот день
                            </button>
                        </div>
                    )}
                    
                    <div className="detail-screen-content">
                        <Timeline 
                            shifts={shifts} 
                            date={detailDate} 
                            onClose={handleCloseDetail}
                            isFullscreen={true}
                        />
                    </div>
                </div>
            ) : (
                <>
                    <Calendar
                        shifts={shifts}
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                        onDayClick={handleDayClick}
                        mode={calendarMode}
                        onModeChange={handleModeChange}
                        isReturning={isReturning}
                        savedScrollTop={savedScrollTop}
                    />
                    <Timeline 
                        shifts={shifts} 
                        date={selectedDate} 
                        onClose={null}
                        isFullscreen={false}
                    />
                </>
            )}
        </>
    )
}
