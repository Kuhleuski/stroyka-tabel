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
    
    // Состояния для формы добавления смены
    const [showAddShift, setShowAddShift] = useState(false)
    const [sites, setSites] = useState([])
    const [workers, setWorkers] = useState([])
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
        // Запоминаем точную позицию скролла
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

    // Обработчик клика по дате в календаре (для добавления смены)
    const handleDateSelect = (date) => {
        setSelectedDate(date)
        // Если админ и не в детальном режиме - показываем кнопку добавить
        if (user?.role === 'admin' && !isDetailOpen) {
            // Показываем кнопку через кастомное событие или состояние
            // Мы добавим кнопку в календарь через пропс
        }
    }

    // Обработчик открытия формы добавления смены
    const handleOpenAddShift = (date) => {
        setSelectedDate(date)
        setShowAddShift(true)
    }

    // Обработчик успешного добавления смены
    const handleShiftAdded = async () => {
        setShowAddShift(false)
        // Обновляем данные смен
        if (refetchShifts) {
            await refetchShifts()
        }
        // Обновляем работников и объекты (на случай если они изменились)
        await loadSitesAndWorkers()
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
                        onAddShift={handleOpenAddShift} // НОВЫЙ ПРОП
                        isAdmin={user?.role === 'admin'} // НОВЫЙ ПРОП
                    />
                    <Timeline 
                        shifts={shifts} 
                        date={selectedDate} 
                        onClose={null}
                        isFullscreen={false}
                    />
                </>
            )}

            {/* Модальное окно добавления смены */}
            {showAddShift && user?.role === 'admin' && (
                <AddShiftForm
                    selectedDate={selectedDate}
                    onClose={() => setShowAddShift(false)}
                    onSuccess={handleShiftAdded}
                    sites={sites}
                    workers={workers}
                />
            )}
        </>
    )
}
