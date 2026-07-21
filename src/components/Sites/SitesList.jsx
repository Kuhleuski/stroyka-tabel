export function SitesList({ sites, onSiteClick }) {
    // Сортируем от новых к старым
    const sortedSites = [...(sites || [])].sort((a, b) => {
        const dateA = new Date(a.created_at || a.id)
        const dateB = new Date(b.created_at || b.id)
        return dateB - dateA
    })

    if (!sortedSites || sortedSites.length === 0) {
        return (
            <div className="card empty-state">
                <div className="empty-icon">🏗️</div>
                <div className="empty-text">Пока нет объектов</div>
            </div>
        )
    }

    // Функция для получения статуса с цветом
    const getStatusStyle = (status) => {
        switch (status) {
            case 'в работе':
                return { color: '#43A047', label: '🟢 В работе' }
            case 'завершен':
                return { color: '#78909C', label: '⚪ Завершен' }
            default:
                return { color: '#FFB300', label: '🟡 Не указан' }
        }
    }

    return (
        <>
            {sortedSites.map((site) => {
                const statusInfo = getStatusStyle(site.status)

                return (
                    <div 
                        key={site.id} 
                        className="card site-card"
                        onClick={() => onSiteClick && onSiteClick(site)}
                    >
                        <div className="site-card-header">
                            <span 
                                className="site-card-color"
                                style={{ backgroundColor: site.color || '#2d7d46' }}
                            />
                            <span className="site-card-name">{site.name}</span>
                            <span 
                                className="site-card-status"
                                style={{ color: statusInfo.color }}
                            >
                                {statusInfo.label}
                            </span>
                        </div>
                        {site.address && (
                            <div className="site-card-address">{site.address}</div>
                        )}
                    </div>
                )
            })}
        </>
    )
}
