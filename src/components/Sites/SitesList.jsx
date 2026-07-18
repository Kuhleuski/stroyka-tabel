export function SitesList({ sites }) {
    if (!sites || sites.length === 0) {
        return (
            <div className="card empty-state">
                <div className="empty-icon">🏗️</div>
                <div className="empty-text">Пока нет объектов</div>
            </div>
        )
    }

    return (
        <>
            {sites.map((site) => (
                <div key={site.id} className="card site-card">
                    <div className="site-card-header">
                        <span className="site-card-icon">🏗️</span>
                        <span className="site-card-name">{site.name}</span>
                    </div>
                    <div className="site-card-stats">
                        {site.address && (
                            <span>📍 {site.address}</span>
                        )}
                        <span>📅 {new Date(site.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            ))}
        </>
    )
}
