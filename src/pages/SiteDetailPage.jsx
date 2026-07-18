export function SiteDetailPage({ site, onClose }) {
    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    return (
        <div className="site-detail-page">
            <div className="site-detail-header">
                <span className="site-detail-title">🏗️ {site.name}</span>
                <button className="site-detail-close" onClick={onClose}>
                    ✕
                </button>
            </div>
            
            <div className="site-detail-content">
                <div className="site-detail-field">
                    <span className="site-detail-label">Название</span>
                    <span className="site-detail-value">{site.name}</span>
                </div>
                
                {site.address && (
                    <div className="site-detail-field">
                        <span className="site-detail-label">Адрес</span>
                        <span className="site-detail-value">{site.address}</span>
                    </div>
                )}
                
                <div className="site-detail-field">
                    <span className="site-detail-label">Дата создания</span>
                    <span className="site-detail-value">{formatDate(site.created_at)}</span>
                </div>
                
                <div className="site-detail-hint">
                    Здесь будет статистика по объекту
                </div>
            </div>
        </div>
    )
}
