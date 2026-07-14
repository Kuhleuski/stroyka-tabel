import { DAYS_SHORT, isToday, formatDate } from '../../utils/dateHelpers'

export function CalendarGrid({ days, selectedDate, onDayClick, shifts, mode }) {
    const getDayShifts = (date) => {
        const dateStr = formatDate(date)
        return shifts.filter(s => s.work_date === dateStr)
    }

    const isSelected = (date) => {
        if (!selectedDate) return false
        return date.getDate() === selectedDate.getDate() &&
               date.getMonth() === selectedDate.getMonth() &&
               date.getFullYear() === selectedDate.getFullYear()
    }

    // Для недели — вертикальное отображение
    if (mode === 'week') {
        const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
        return (
            <div className="week-vertical">
                {days.map((day, index) => {
                    if (day.empty) return null
                    
                    const dayShifts = getDayShifts(day.date)
                    const hasWork = dayShifts.length > 0
                    const today = isToday(day.date)
                    const selected = isSelected(day.date)
                    const dayName = dayNames[day.date.getDay() === 0 ? 6 : day.date.getDay() - 1]
                    
                    return (
                        <div 
                            key={index} 
                            className={`week-day-row ${today ? 'today' : ''} ${selected ? 'selected' : ''}`}
                            onClick={() => onDayClick(day.date)}
                        >
                            <div className="week-day-header">
                                <span className="week-day-name">{dayName}</span>
                                <span className="week-day-number">{day.day}</span>
                                {hasWork && <span className="week-day-count">{dayShifts.length}</span>}
                            </div>
                            <div className="week-day-info">
                                {hasWork ? (
                                    dayShifts.map((s, idx) => (
                                        <span key={idx} className="week-day-worker">
                                            {s.worker_name} ({s.hours}ч)
                                        </span>
                                    ))
                                ) : (
                                    <span className="week-day-empty">—</span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    // Месяц — стандартная сетка
    return (
        <div className="calendar-grid">
            {DAYS_SHORT.map(day => (
                <div key={day} className="day-label">{day}</div>
            ))}
            
            {days.map((day, index) => {
                if (day.empty) {
                    return <div key={`empty-${index}`} className="day-cell empty"></div>
                }

                const dayShifts = getDayShifts(day.date)
                const hasWork = dayShifts.length > 0
                const today = isToday(day.date)
                const selected = isSelected(day.date)

                return (
                    <div
                        key={index}
                        className={`day-cell ${today ? 'today' : ''} ${selected ? 'selected' : ''} ${hasWork ? 'has-work' : ''}`}
                        onClick={() => onDayClick(day.date)}
                    >
                        <div className="day-number">{day.day}</div>
                        {hasWork && <div className="day-dot"></div>}
                        {dayShifts.length > 0 && (
                            <div className="day-count">{dayShifts.length}</div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
