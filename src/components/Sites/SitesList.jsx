import styles from '../../styles/sites.module.css'

export function SitesList({ sites, onSiteClick }) {
    // Сортируем от новых к старым
    const sortedSites = [...(sites || [])].sort((a, b) => {
        const dateA = new Date(a.created_at || a.id)
        const dateB = new Date(b.created_at || b.id)
        return dateB - dateA
    })

    if (!sortedSites || sortedSites.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🏗️</div>
                <div className={styles.emptyText}>Пока нет объектов</div>
            </div>
        )
    }

    // Статусы с разными стилями
    const getStatus = (status) => {
        switch (status) {
            case 'в работе':
                return { 
                    label: 'В работе', 
                    bgColor: '#2d7d46',
                    dotColor: 'white'
                }
            case 'завершен':
                return { 
                    label: 'Завершен', 
                    bgColor: '#e8eaed',
                    dotColor: '#78909C'
                }
            default:
                return { 
                    label: 'Не указан', 
                    bgColor: '#f5f7f6',
                    dotColor: '#FFB300'
                }
        }
    }

    return (
        <div className={styles.sitesList}>
            {sortedSites.map((site) => {
                const status = getStatus(site.status)

                return (
                    <div 
                        key={site.id} 
                        className={styles.siteCardRow}
                        onClick={() => onSiteClick && onSiteClick(site)}
                    >
                        <div className={styles.siteCardTop}>
                            <div className={styles.siteCardLeft}>
                                <span 
                                    className={styles.siteColorDot}
                                    style={{ backgroundColor: site.color || '#2d7d46' }}
                                />
                                <span className={styles.siteName}>{site.name}</span>
                            </div>
                            <span 
                                className={styles.siteStatusBadge}
                                style={{ 
                                    backgroundColor: status.bgColor,
                                    color: status.dotColor === 'white' ? 'white' : '#333'
                                }}
                            >
                                <span className={styles.statusDot} style={{ backgroundColor: status.dotColor }} />
                                {status.label}
                            </span>
                        </div>
                        {site.address && (
                            <div className={styles.siteAddress}>{site.address}</div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
