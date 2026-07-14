import { useState, useEffect } from 'react'
import { Calendar } from '../components/Calendar/Calendar'
import { Timeline } from '../components/Timeline/Timeline'

export function MainPage({ shifts, loading }) {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [detailDate, setDetailDate] = useState(null) // null = показываем обычный режим
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    useEffect(() => {
        setSelectedDate(new Date())
    }, [])

    if (loading) {
        return <div className="loading-text">⏳ Загрузка...</div>
    }

    const handleDayClick = (date) => {
        setDetailDate(date)
        setIsDetailOpen(true)
    }

    const handleCloseDetail = () => {
        setIsDetailOpen(false)
        setDetailDate(null)
    }

    return (
        <>
            <Calendar
                shifts={shifts}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onDayClick={handleDayClick}
            />
            
            {isDetailOpen && detailDate ? (
                <Timeline 
                    shifts={shifts} 
                    date={detailDate} 
                    onClose={handleCloseDetail}
                />
            ) : (
                // Обычный режим — показываем таймлайн для выбранной даты
                <Timeline 
                    shifts={shifts} 
                    date={selectedDate} 
                    onClose={null}
                />
            )}
        </>
    )
}
