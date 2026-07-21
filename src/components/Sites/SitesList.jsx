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

    // Статусы с современным дизайном
    const getStatus = (status) => {
        switch (status) {
            case 'в работе':
                return { label: 'В работе', color: '#2d7d46', dot: '●' }
            case 'завершен':
                return { label: 'Завершен', color: '#78909C', dot: '●' }
            default:
                return { label: 'Не указан', color: '#FFB300', dot: '●' }
        }
    }

    return (
        <div className="sites-grid">
            {sortedSites.map((site) => {
                const status = getStatus(site.status)

                return (
                    <div 
                        key={site.id} 
                        className="site-card"
                        onClick={() => onSiteClick && onSiteClick(site)}
                    >
                        <div className="site-card-top">
                            <div className="site-card-left">
                                <span 
                                    className="site-color-dot"
                                    style={{ backgroundColor: site.color || '#2d7d46' }}
                                />
                                <span className="site-name">{site.name}</span>
                            </div>
                            <span 
                                className="site-status"
                                style={{ color: status.color }}
                            >
                                {status.dot} {status.label}
                            </span>
                        </div>
                        {site.address && (
                            <div className="site-address">{site.address}</div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
