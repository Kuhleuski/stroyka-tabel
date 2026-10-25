// src/components/Sites/SitesList.jsx

import { Plus } from 'lucide-react'
import Magnifier from '@gravity-ui/icons/Magnifier'
import { Camera } from '@gravity-ui/icons'
import styles from '../../styles/sites.module.css'

export function SitesList({
    sites,
    filter = 'all',
    onSiteClick,
    onCreate,
    hasAnySites = false,
    searchQuery = '',
}) {
    // Сортировка НЕ здесь — SitesPage передаёт уже отсортированный массив
    // (объекты без смен → первыми по created_at; со сменами → по max(work_date)).
    const filteredSites = (sites || []).filter(site => {
        if (filter === 'all') return true
        if (filter === 'active') return site.status === 'в работе'
        if (filter === 'completed') return site.status === 'завершен'
        return true
    })

    const isSearchActive = (searchQuery || '').trim().length > 0

    if (!filteredSites || filteredSites.length === 0) {
        // 1) Поиск ничего не нашёл
        if (isSearchActive) {
            return (
                <div className={styles.emptyBlock}>
                    <div className={`${styles.emptyIconWrap} ${styles.emptyIconWrapSearch}`}>
                        <Magnifier className={styles.emptyIcon} />
                    </div>
                    <div className={styles.emptyTitle}>Ничего не найдено</div>
                    <div className={styles.emptySubtitle}>
                        Попробуйте изменить запрос или проверьте написание
                    </div>
                </div>
            )
        }

        // 2) Вкладка «Все» — объектов вообще нет
        if (filter === 'all') {
            return (
                <div className={styles.emptyBlock}>
                    <div className={styles.emptyTitle}>Пока нет объектов</div>
                    <div className={styles.emptySubtitle}>
                        Добавьте первый объект, чтобы отмечать на нём рабочие дни
                    </div>
                    {onCreate && (
                        <button
                            type="button"
                            className={styles.emptyActionBtn}
                            onClick={onCreate}
                        >
                            <Plus size={18} strokeWidth={2.5} className={styles.emptyActionIcon} />
                            <span>Создать объект</span>
                        </button>
                    )}
                </div>
            )
        }

        // 3) Вкладка «В работе» — объектов в работе нет
        if (filter === 'active') {
            return (
                <div className={styles.emptyBlock}>
                    <div className={styles.emptyTitle}>Нет объектов в работе</div>
                    <div className={styles.emptySubtitle}>
                        {hasAnySites
                            ? 'Сейчас все объекты завершены. Создайте новый, чтобы продолжить'
                            : 'Добавьте объект, чтобы начать отмечать рабочие дни'}
                    </div>
                    {onCreate && (
                        <button
                            type="button"
                            className={styles.emptyActionBtn}
                            onClick={onCreate}
                        >
                            <Plus size={18} strokeWidth={2.5} className={styles.emptyActionIcon} />
                            <span>Создать объект</span>
                        </button>
                    )}
                </div>
            )
        }

        // 4) Вкладка «Завершенные» — без кнопки
        if (filter === 'completed') {
            return (
                <div className={styles.emptyBlock}>
                    <div className={styles.emptyTitle}>Нет завершенных объектов</div>
                    <div className={styles.emptySubtitle}>
                        Здесь появятся объекты, которые вы завершите
                    </div>
                </div>
            )
        }

        // fallback
        return (
            <div className={styles.emptyBlock}>
                <div className={styles.emptyTitle}>Нет объектов</div>
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
                const color = site.color || '#2d7d46'

                return (
                    <div
                        key={site.id}
                        className={styles.siteRow}
                        onClick={() => onSiteClick && onSiteClick(site)}
                    >
                        <div className={styles.siteRowMain}>
                            <div className={styles.siteRowThumb}>
                                {site.photo ? (
                                    <img
                                        src={site.photo}
                                        alt=""
                                        className={styles.siteRowPhoto}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <div className={styles.siteRowPhotoPlaceholder} aria-hidden="true">
                                        <Camera className={styles.siteRowPhotoIcon} />
                                    </div>
                                )}
                                <span
                                    className={styles.siteRowThumbDot}
                                    style={{ backgroundColor: color }}
                                    aria-hidden="true"
                                />
                            </div>

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