export function Timeline({ shifts, date, onClose, isFullscreen }) {
    if (!date) return null

    const dateStr = date.toISOString().split('T')[0]
    const dayShifts = shifts.filter(s => s.work_date === dateStr)

    const formatDateTitle = (date) => {
        const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
        const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
        return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
    }

    const renderContent = () => {
        if (dayShifts.length === 0) {
            return (
                <div className="card empty-state">
                    <div className="empty-icon">📭</div>
                    <div className="empty-text">В этот день никто не работал</div>
                </div>
            )
        }

        const sitesMap = {}
        dayShifts.forEach(s => {
            if (!sitesMap[s.site_name]) {
                sitesMap[s.site_name] = { workers: [], totalHours: 0 }
            }
            sitesMap[s.site_name].workers.push({
                name: s.worker_name,
                hours: parseFloat(s.hours),
                status: s.status
            })
            sitesMap[s.site_name].totalHours += parseFloat(s.hours)
        })

        return Object.entries(sitesMap).map(([siteName, data]) => (
            <div key={siteName} className="card">
                <div className="card-header">
                    <span className="card-icon">📍</span>
                    <span className="card-title">{siteName}</span>
                    <span className="card-badge">{data.totalHours} ч.</span>
                </div>
                <div className="card-body">
                    {data.workers.map((w, idx) => (
                        <div key={idx} className="worker-chip">
                            <span className="worker-chip-name">{w.name}</span>
                            <span className="worker-chip-hours">{w.hours} ч.</span>
                            <span className={`badge ${w.status === 'confirmed' ? 'confirmed' : 'pending'}`}>
                                {w.status === 'confirmed' ? '✅ Подтверждено' : '⏳ Ожидает'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        ))
    }

    // Если есть onClose — показываем с крестиком
    if (onClose) {
        return (
            <div className="timeline-detail">
                <div className="timeline-detail-header">
                    <div className="timeline-detail-date">
                        <span className="timeline-detail-icon">📅</span>
                        <span>{formatDateTitle(date)}</span>
                    </div>
                    <button className="timeline-detail-close" onClick={onClose}>
                        ✕
                    </button>
                </div>
                <div className="timeline-detail-content">
                    {renderContent()}
                </div>
            </div>
        )
    }

    // Обычный режим (мини-таймлайн под календарём)
    return (
        <div className="timeline-mini">
            <div className="timeline-mini-header">
                <span className="timeline-mini-date">
                    {date.getDate()} {['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'][date.getMonth()]} {date.getFullYear()}
                </span>
                <span className="timeline-mini-count">
                    {dayShifts.length} {dayShifts.length === 1 ? 'смена' : 'смен'}
                </span>
            </div>
            {renderContent()}
        </div>
    )
}
