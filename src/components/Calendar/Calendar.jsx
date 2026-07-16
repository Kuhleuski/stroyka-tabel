const FeedItem = ({ day, shifts, selectedDate, onDayClick, getDayShifts, isSelected, isToday }) => {
    const dayShifts = getDayShifts(day.date)
    const hasWork = dayShifts.length > 0
    const today = isToday(day.date)
    const selected = isSelected(day.date)
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    
    const dayName = dayNames[day.date.getDay()]
    const dateStr = `${String(day.date.getDate()).padStart(2, '0')}.${String(day.date.getMonth() + 1).padStart(2, '0')} ${dayName}`
    
    // Группируем по объектам
    const sitesMap = {}
    dayShifts.forEach(s => {
        if (!sitesMap[s.site_name]) {
            sitesMap[s.site_name] = []
        }
        sitesMap[s.site_name].push({
            name: s.worker_name,
            hours: s.hours
        })
    })
    
    // Формируем HTML: каждый объект с новой строки
    let contentHtml = ''
    if (hasWork) {
        const lines = []
        Object.entries(sitesMap).forEach(([siteName, workers]) => {
            const workersStr = workers.map(w => `${w.name}(${w.hours}ч)`).join(' ')
            lines.push(`📍${siteName}: ${workersStr}`)
        })
        contentHtml = lines.join('<br>')
    } else {
        contentHtml = '— нет смен'
    }
    
    return (
        <div 
            className={`feed-item ${today ? 'today' : ''} ${selected ? 'selected' : ''}`}
            onClick={() => onDayClick(day.date)}
            data-date={day.date.toISOString().split('T')[0]}
        >
            <div className="feed-date">
                <div className="feed-date-full">{dateStr}</div>
                {today && <div className="feed-today-badge">Сегодня</div>}
            </div>
            <div 
                className={`feed-content ${hasWork ? 'has-work' : 'empty'}`}
                dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
        </div>
    )
}
