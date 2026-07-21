import React, { useState, useEffect, useRef } from 'react'
import { Calendar } from '../components/Calendar/Calendar'
import { Timeline } from '../components/Timeline/Timeline'
import { AddShiftForm } from '../components/Shifts/AddShiftForm'
import { fetchSites, fetchWorkers } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { formatDateLocal } from '../utils/dateHelpers'

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
    const { user } = useAuth()
    
    const isFirstMount = useRef(true)
    const isDataLoaded = useRef(false)

    const getShiftsForDate = (date) => {
        if (!shifts || shifts.length === 0) return []
        const dateStr = formatDateLocal(date)
        return shifts.filter(s => s.work_date === dateStr)
    }

    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false
            const loadData = async () => {
                const today = new Date()
                setSelectedDate(today)
                
                if (refetchShifts) {
                    await refetchShifts()
                }
                await loadSitesAndWorkers()
                
                setUpdateKey(prev => prev + 1)
                isDataLoaded.current = true
            }
            loadData()
        }
    }, [])

    useEffect(() => {
        if (isDataLoaded.current && shifts.length > 0) {
            setUpdateKey(prev => prev + 1)
        }
    }, [shifts])

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
        setUpdateKey(prev => prev + 1)
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
