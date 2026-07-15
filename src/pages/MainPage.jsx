import { useState, useEffect } from 'react'
import { Calendar } from '../components/Calendar/Calendar'
import { Timeline } from '../components/Timeline/Timeline'

export function MainPage({ shifts, loading }) {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [detailDate, setDetailDate] = useState(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [returnMode, setReturnMode] = useState('month')
    const [calendarMode, setCalendarMode] = useState('month')
    const [feedScrollPosition, setFeedScrollPosition] = useState(null) // сохранённая позиция

    useEffect(() => {
        setSelectedDate(new Date())
    }, [])

    if (loading) {
        return <div className="loading-text">⏳ Загрузка...</div>
    }

    const handleDayClick = (date, mode) => {
        setDetailDate(date)
        setReturnMode(mode)
        setIsDetailOpen(true)
        // Запоминаем текущую позицию перед открытием деталей
        if (mode === 'feed') {
            const container = document.getElementById('feedContainer')
            if (container) {
                setFeedScrollPosition(container.scrollTop)
            }
        }
    }

    const handleCloseDetail = () => {
        setIsDetailOpen(false)
        setDetailDate(null)
        setCalendarMode(returnMode)
        // Позиция сохранилась в feedScrollPosition, Calendar восстановит её при рендере
    }

    const handleModeChange = (mode, scrollPos) => {
        setCalendarMode(mode)
        if (isDetailOpen) {
            setIsDetailOpen(false)
            setDetailDate(null)
        }
        // Если переключились на другой режим — сбрасываем сохранённую позицию
        if (mode !== 'feed') {
            setFeedScrollPosition(null)
        } else if (scrollPos !== undefined) {
            // Обновляем позицию при скролле
            setFeedScrollPosition(scrollPos)
        }
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
                        onDateSelect={setSelectedDate}
                        onDayClick={handleDayClick}
                        mode={calendarMode}
                        onModeChange={handleModeChange}
                        feedScrollPosition={feedScrollPosition}
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
