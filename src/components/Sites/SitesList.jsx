// src/components/Sites/SitesList.jsx

import styles from '../../styles/sites.module.css'

export function SitesList({ sites, filter = 'all', onSiteClick }) {
    // Сортировка НЕ здесь — SitesPage передаёт уже отсортированный массив
    // (объекты без смен → первыми по created_at; со сменами → по max(work_date)).
    const filteredSites = (sites || []).filter(site => {
        if (filter === 'all') return true
        if (filter === 'active') return site.status === 'в работе'
        if (filter === 'completed') return site.status === 'завершен'
        return true
    })

    if (!filteredSites || filteredSites.length === 0) {
        let emptyMessage = 'Нет объектов'
        if (filter === 'active') emptyMessage = 'Нет объектов в работе'
        if (filter === 'completed') emptyMessage = 'Нет завершенных объектов'

        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🏗️</div>
                <div className={styles.emptyText}>{emptyMessage}</div>
            </div>
        )
    }

    const getStatus = (status) => {
        switch (status) {
            case 'в работе':
                return { label: 'В работе', color: 'rgb(134 214 24)' }
            case 'завершен':
                return { label: 'Завершен', color: 'rgb(149 149 149)' }
            default:
                return { label: 'Не указан', color: '#FFB300' }
        }
    }

    return (
        <div className={styles.sitesList}>
            <div className={styles.listHeader}>
                <span className={styles.listHeaderCell}>Объект</span>
                <span className={styles.listHeaderCellRight}>Статус</span>
            </div>

            {filteredSites.map((site) => {
                const status = getStatus(site.status)

                return (
                    <div
                        key={site.id}
                        className={styles.siteRow}
                        onClick={() => onSiteClick && onSiteClick(site)}
                    >
                        <div className={styles.siteRowMain}>
                            <span
                                className={styles.siteDot}
                                style={{ backgroundColor: site.color || '#2d7d46' }}
                            />
                            <div className={styles.siteRowText}>
                                <span className={styles.siteRowName}>{site.name}</span>
                                {site.address && (
                                    <span className={styles.siteRowAddress}>{site.address}</span>
                                )}
                            </div>
                        </div>
                        <span
                            className={styles.siteRowStatus}
                            style={{ color: status.color }}
                        >
                            {status.label}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}