import { useState, useEffect } from 'react'
import { Calendar } from '../components/Calendar/Calendar'
import { Timeline } from '../components/Timeline/Timeline'

export function MainPage({ shifts, loading }) {
    const [selectedDate, setSelectedDate] = useState(new Date())

    // При загрузке — сразу показываем сегодня
    useEffect(() => {
        setSelectedDate(new Date())
    }, [])

    if (loading) {
        return <div className="loading-text">⏳ Загрузка...</div>
    }

    return (
        <>
            <Calendar
                shifts={shifts}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
            />
            <Timeline shifts={shifts} date={selectedDate} />
        </>
    )
}
