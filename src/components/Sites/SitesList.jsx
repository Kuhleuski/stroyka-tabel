export function SitesList({ sites, onSiteClick }) {
    // Сортируем от новых к старым (по id или created_at)
    const sortedSites = [...(sites || [])].sort((a, b) => {
        const dateA = new Date(a.created_at || a.id)
        const dateB = new Date(b.created_at || b.id)
        return dateB - dateA // новые сначала
    })

    if (!sortedSites || sortedSites.length === 0) {
        return (
            <div className="card empty-state">
                <div className="empty-icon">🏗️</div>
                <div className="empty-text">Пока нет объектов</div>
            </div>
        )
    }

    return (
        <>
            {sortedSites.map((site) => (
                <div 
                    key={site.id} 
                    className="card site-card"
                    onClick={() => onSiteClick && onSiteClick(site)}
                >
                    <div className="site-card-header">
                        <span className="site-card-icon">🏗️</span>
                        <span className="site-card-name">{site.name}</span>
                    </div>
                    <div className="site-card-stats">
                        {site.address && (
                            <span>📍 {site.address}</span>
                        )}
                        <span>📅 {new Date(site.created_at || site.id).toLocaleDateString()}</span>
                    </div>
                </div>
            ))}
        </>
    )
}
