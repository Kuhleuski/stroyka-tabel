export function SitesList({ shifts }) {
    const sitesMap = {}
    shifts.forEach(s => {
        if (!sitesMap[s.site_name]) {
            sitesMap[s.site_name] = { shifts: [], totalHours: 0, workers: new Set() }
        }
        sitesMap[s.site_name].shifts.push(s)
        sitesMap[s.site_name].totalHours += parseFloat(s.hours)
        sitesMap[s.site_name].workers.add(s.worker_name)
    })

    if (Object.keys(sitesMap).length === 0) {
        return (
            <div className="card empty-state">
                <div className="empty-icon">🏗️</div>
                <div className="empty-text">Пока нет объектов</div>
            </div>
        )
    }

    return (
        <>
            {Object.entries(sitesMap).map(([name, data]) => (
                <div key={name} className="card site-card">
                    <div className="site-card-header">
                        <span className="site-card-icon">🏗️</span>
                        <span className="site-card-name">{name}</span>
                    </div>
                    <div className="site-card-stats">
                        <span>👷 {data.workers.size} рабочих</span>
                        <span>📋 {data.shifts.length} смен</span>
                        <span>⏱️ {data.totalHours} ч.</span>
                    </div>
                </div>
            ))}
        </>
    )
}