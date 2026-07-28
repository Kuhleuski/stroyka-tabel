// src/components/Sites/SitesList.jsx

import styles from '../../styles/sites.module.css'

export function SitesList({ sites, filter = 'all', onSiteClick }) {
    // === ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ДАТЫ ПОСЛЕДНЕГО ОТКРЫТИЯ ===
    const getLastOpened = (siteId) => {
        try {
            const stored = localStorage.getItem('siteLastOpened')
            if (!stored) return null
            const data = JSON.parse(stored)
            return data[siteId] || null
        } catch (e) {
            return null
        }
    }

    // === СОРТИРОВКА ===
    const sortedSites = [...(sites || [])].sort((a, b) => {
        const lastOpenedA = getLastOpened(a.id)
        const lastOpenedB = getLastOpened(b.id)
        
        // Если оба открывались — сортируем по дате открытия (новые сверху)
        if (lastOpenedA && lastOpenedB) {
            return new Date(lastOpenedB) - new Date(lastOpenedA)
        }
        // Если открывался только A — он выше
        if (lastOpenedA) return -1
        // Если открывался только B — он выше
        if (lastOpenedB) return 1
        // Если никто не открывался — по дате создания (новые сверху)
        const dateA = new Date(a.created_at || a.id)
        const dateB = new Date(b.created_at || b.id)
        return dateB - dateA
    })

    // === ФИЛЬТРАЦИЯ ===
    const filteredSites = sortedSites.filter(site => {
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
            {filteredSites.map((site) => {
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
