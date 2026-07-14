const COLORS = ['#2d7d46', '#1a6b8a', '#8d6e63', '#6a1b9a', '#c62828', '#e65100']

export function WorkersList({ shifts }) {
    const workersMap = {}
    shifts.forEach(s => {
        if (!workersMap[s.worker_name]) {
            workersMap[s.worker_name] = { days: new Set(), totalHours: 0, sites: new Set() }
        }
        workersMap[s.worker_name].days.add(s.work_date)
        workersMap[s.worker_name].totalHours += parseFloat(s.hours)
        workersMap[s.worker_name].sites.add(s.site_name)
    })

    if (Object.keys(workersMap).length === 0) {
        return (
            <div className="card empty-state">
                <div className="empty-icon">👷</div>
                <div className="empty-text">Пока нет рабочих</div>
            </div>
        )
    }

    let idx = 0
    return (
        <>
            {Object.entries(workersMap).map(([name, data]) => {
                const initials = name.split(' ').map(w => w[0]).join('')
                const color = COLORS[idx % COLORS.length]
                idx++
                
                return (
                    <div key={name} className="card worker-card">
                        <div className="worker-card-avatar" style={{ background: color }}>
                            {initials}
                        </div>
                        <div className="worker-card-info">
                            <div className="worker-card-name">{name}</div>
                            <div className="worker-card-stats">
                                <span>⏱️ {data.totalHours} ч.</span>
                                <span>📅 {data.days.size} дней</span>
                                <span>🏗️ {data.sites.size} объектов</span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </>
    )
}