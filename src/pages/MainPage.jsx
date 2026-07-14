import { useState, useEffect } from 'react'
import { Calendar } from '../components/Calendar/Calendar'
import { Timeline } from '../components/Timeline/Timeline'

export function MainPage({ shifts, loading }) {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [detailDate, setDetailDate] = useState(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [returnMode, setReturnMode] = useState('month') // запоминаем режим
    const [calendarMode, setCalendarMode] = useState('month') // текущий режим календаря

    useEffect(() => {
        setSelectedDate(new Date())
    }, [])

    if (loading) {
        return <div className="loading-text">⏳ Загрузка...</div>
    }

    const handleDayClick = (date, mode) => {
        setDetailDate(date)
        setReturnMode(mode) // запоминаем режим
        setIsDetailOpen(true)
    }

    const handleCloseDetail = () => {
        setIsDetailOpen(false)
        setDetailDate(null)
        // Возвращаемся в запомненный режим
        setCalendarMode(returnMode)
    }

    const handleModeChange = (mode) => {
        setCalendarMode(mode)
        // Если детальный просмотр открыт — закрываем его
        if (isDetailOpen) {
            setIsDetailOpen(false)
            setDetailDate(null)
        }
    }

    return (
        <>
            <Calendar
                shifts={shifts}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onDayClick={handleDayClick}
                mode={calendarMode}
                onModeChange={handleModeChange}
            />
            
            {isDetailOpen && detailDate ? (
                // Детальный просмотр (заменяет обычный таймлайн)
                <Timeline 
                    shifts={shifts} 
                    date={detailDate} 
                    onClose={handleCloseDetail}
                    isFullscreen={false}
                />
            ) : (
                // Обычный режим — таймлайн для выбранной даты
                <Timeline 
                    shifts={shifts} 
                    date={selectedDate} 
                    onClose={null}
                    isFullscreen={false}
                />
            )}
        </>
    )
}
