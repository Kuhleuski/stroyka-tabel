export function Timeline({ shifts, date, onClose, isFullscreen, hideHeader }) {
    if (!date) return null

    const dateStr = date.toISOString().split('T')[0]
    const dayShifts = shifts.filter(s => s.work_date === dateStr)

    const renderContent = () => {
        if (dayShifts.length === 0) {
            return (
                <div className="card empty-state">
                    <div className="empty-icon">📭</div>
                    <div className="empty-text">В этот день никто не работал</div>
                </div>
            )
        }

        // Группируем по объектам через site_id
        const sitesMap = {}
        dayShifts.forEach(s => {
            const siteId = s.site_id
            if (!sitesMap[siteId]) {
                sitesMap[siteId] = { 
                    siteName: s.site_name,
                    workers: new Set() 
                }
            }
            if (s.worker_name) {
                sitesMap[siteId].workers.add(s.worker_name)
            }
        })

        return Object.entries(sitesMap).map(([siteId, data]) => (
            <div key={siteId} className="card">
                <div className="card-header">
                    <span className="card-icon">📍</span>
                    <span className="card-title">{data.siteName}</span>
                </div>
                <div className="card-body">
                    {Array.from(data.workers).map((workerName, idx) => (
                        <div key={idx} className="worker-chip">
                            <span className="worker-chip-name">{workerName}</span>
                        </div>
                    ))}
                </div>
            </div>
        ))
    }

    // Если hideHeader === true — НЕ ПОКАЗЫВАЕМ шапку с датой и счетчиком
    if (isFullscreen || hideHeader) {
        return <>{renderContent()}</>
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
