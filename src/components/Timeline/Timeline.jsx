export function Timeline({ shifts, date }) {
    if (!date) return null

    const dateStr = date.toISOString().split('T')[0]
    const dayShifts = shifts.filter(s => s.work_date === dateStr)

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

    return (
        <>
            {Object.entries(sitesMap).map(([siteName, data]) => (
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
                                    {w.status === 'confirmed' ? '✅' : '⏳'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </>
    )
}