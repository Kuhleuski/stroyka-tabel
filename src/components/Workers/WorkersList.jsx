export function WorkersList({ workers, onWorkerClick }) {
    // Сортируем от новых к старым
    const sortedWorkers = [...(workers || [])].sort((a, b) => {
        const dateA = new Date(a.created_at || a.id)
        const dateB = new Date(b.created_at || b.id)
        return dateB - dateA
    })

    if (!sortedWorkers || sortedWorkers.length === 0) {
        return (
            <div className="card empty-state">
                <div className="empty-icon">👷</div>
                <div className="empty-text">Пока нет работников</div>
            </div>
        )
    }

    const getInitials = (name) => {
        const parts = name.split(' ')
        if (parts.length === 1) return parts[0][0]
        return parts[0][0] + parts[1][0]
    }

    const colors = ['#2d7d46', '#1a6b8a', '#8d6e63', '#6a1b9a', '#c62828', '#e65100', '#2e7d32']

    return (
        <>
            {sortedWorkers.map((worker, index) => (
                <div 
                    key={worker.id} 
                    className="card worker-card"
                    onClick={() => onWorkerClick && onWorkerClick(worker)}
                >
                    <div 
                        className="worker-card-avatar" 
                        style={{ background: colors[index % colors.length] }}
                    >
                        {getInitials(worker.name)}
                    </div>
                    <div className="worker-card-info">
                        <div className="worker-card-name">{worker.name}</div>
                        <div className="worker-card-stats">
                            <span>📅 {new Date(worker.created_at || worker.id).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="worker-card-arrow">→</div>
                </div>
            ))}
        </>
    )
}
