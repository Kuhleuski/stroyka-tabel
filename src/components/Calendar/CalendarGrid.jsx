import { formatDate } from '../../utils/dateHelpers'

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

    const isToday = (date) => {
        const today = new Date()
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear()
    }

    // === РЕЖИМ "ЛЕНТА" ===
    if (mode === 'feed') {
        const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
        const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
        
        return (
            <div className="feed-container" id="feedContainer">
                {days.map((day, index) => {
                    if (day.empty) return null
                    
                    const dayShifts = getDayShifts(day.date)
                    const hasWork = dayShifts.length > 0
                    const today = isToday(day.date)
                    const selected = isSelected(day.date)
                    const dayName = dayNames[day.date.getDay()]
                    
                    const sitesMap = {}
                    dayShifts.forEach(s => {
                        if (!sitesMap[s.site_name]) {
                            sitesMap[s.site_name] = []
                        }
                        sitesMap[s.site_name].push(s.worker_name)
                    })
                    
                    // Формат: "15.07 Сб"
                    const dateStr = `${String(day.date.getDate()).padStart(2, '0')}.${String(day.date.getMonth() + 1).padStart(2, '0')} ${dayName}`
                    
                    return (
                        <div 
                            key={index} 
                            className={`feed-item ${today ? 'today' : ''} ${selected ? 'selected' : ''}`}
                            onClick={() => onDayClick(day.date)}
                        >
                            <div className="feed-date">
                                <div className="feed-date-full">{dateStr}</div>
                                {today && <div className="feed-today-badge">Сегодня</div>}
                            </div>
                            
                            <div className="feed-content">
                                {hasWork ? (
                                    Object.entries(sitesMap).map(([siteName, workers]) => (
                                        <div key={siteName} className="feed-site">
                                            <div className="feed-site-name">📍 {siteName}</div>
                                            <div className="feed-workers">
                                                {workers.map((w, idx) => (
                                                    <span key={idx} className="feed-worker">👷 {w}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="feed-empty">— нет смен</div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    // === РЕЖИМ "НЕДЕЛЯ" ===
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

    // === РЕЖИМ "МЕСЯЦ" ===
    return (
        <div className="calendar-grid">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
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
