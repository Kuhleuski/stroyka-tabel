import { useState, useEffect } from 'react'
import { Calendar } from '../components/Calendar/Calendar'
import { Timeline } from '../components/Timeline/Timeline'

export function MainPage({ shifts, loading }) {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [detailDate, setDetailDate] = useState(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [returnMode, setReturnMode] = useState('month') // запоминаем режим

    useEffect(() => {
        setSelectedDate(new Date())
    }, [])

    if (loading) {
        return <div className="loading-text">⏳ Загрузка...</div>
    }

    const handleDayClick = (date, currentMode) => {
        setDetailDate(date)
        setReturnMode(currentMode) // запоминаем режим
        setIsDetailOpen(true)
    }

    const handleCloseDetail = () => {
        setIsDetailOpen(false)
        setDetailDate(null)
    }

    return (
        <>
            {isDetailOpen && detailDate ? (
                // ПОЛНОЭКРАННЫЙ ДЕТАЛЬНЫЙ ПРОСМОТР
                <div className="detail-overlay">
                    <div className="detail-container">
                        <Timeline 
                            shifts={shifts} 
                            date={detailDate} 
                            onClose={handleCloseDetail}
                            isFullscreen={true}
                        />
                    </div>
                </div>
            ) : (
                // ОБЫЧНЫЙ РЕЖИМ — календарь + таймлайн
                <>
                    <Calendar
                        shifts={shifts}
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        onDayClick={(date, mode) => handleDayClick(date, mode)}
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
