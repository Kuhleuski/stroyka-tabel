import { DAYS_SHORT, isToday, formatDate } from '../../utils/dateHelpers'

export function CalendarGrid({ days, selectedDate, onDayClick, shifts }) {
    const getDayShifts = (date) => {
        const dateStr = formatDate(date)
        return shifts.filter(s => s.work_date === dateStr)
    }

    const isSelected = (date) => {
        return date.getDate() === selectedDate.getDate() &&
               date.getMonth() === selectedDate.getMonth() &&
               date.getFullYear() === selectedDate.getFullYear()
    }

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