import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSites } from '../hooks/useSites'
import { useWorkers } from '../hooks/useWorkers'
import { Camera, ArrowLeft, TrashBin } from '@gravity-ui/icons'
import ArrowsRotateLeft from '@gravity-ui/icons/ArrowsRotateLeft'
import styles from '../styles/archive.module.css'


const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const getAvatarColor = (name) => {
    const colors = [
        '#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#1E88E5',
        '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342',
        '#FDD835', '#FFB300', '#FB8C00', '#F4511E', '#6D4C41', '#78909C'
    ]
    if (!name) return '#666'
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
}

const isBase64Image = (str) => str && str.startsWith('data:image')

export function ArchivePage({ onBack }) {
    const [activeTab, setActiveTab] = useState('sites')
    const { archivedSites, restoreSiteInState, refreshArchivedSites, deleteSitePermanentlyInState } = useSites()
    const { archivedWorkers, restoreWorkerInState, refreshArchivedWorkers, deleteWorkerPermanentlyInState } = useWorkers()

    const [confirmTarget, setConfirmTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [restoringId, setRestoringId] = useState(null)

    useEffect(() => {
        refreshArchivedSites()
        refreshArchivedWorkers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const visibleSites = archivedSites.filter(s => s.deleted !== true)
    const visibleWorkers = archivedWorkers.filter(w => w.deleted !== true)

    const handleRestore = async (id, type) => {
        setRestoringId(id)
        try {
            if (type === 'site') {
                await restoreSiteInState(id)
                await refreshArchivedSites()
            } else {
                await restoreWorkerInState(id)
                await refreshArchivedWorkers()
            }
        } catch (e) {
            console.error('❌ Ошибка восстановления:', e)
            alert('Не удалось восстановить: ' + e.message)
        } finally {
            setRestoringId(null)
        }
    }

    const handleDeleteForeverClick = (item, type) => {
        setConfirmTarget({
            id: item.id,
            type,
            name: item.name || (type === 'site' ? 'объект' : 'работник')
        })
    }

    const handleConfirmDelete = async () => {
        if (!confirmTarget) return
        setDeleting(true)
        try {
            if (confirmTarget.type === 'site') {
                await deleteSitePermanentlyInState(confirmTarget.id)
            } else {
                await deleteWorkerPermanentlyInState(confirmTarget.id)
            }
            setConfirmTarget(null)
        } catch (e) {
            console.error('❌ Ошибка удаления навсегда:', e)
            alert('Не удалось удалить: ' + e.message)
        } finally {
            setDeleting(false)
        }
    }

    const handleCancelDelete = () => {
        if (deleting) return
        setConfirmTarget(null)
    }

    const isSite = confirmTarget?.type === 'site'

    return (
        <div className={styles.archivePage}>

            {/* === СКРОЛЛЯЩАЯСЯ ЧАСТЬ (шапка + сегменты + карточки) === */}
            <div className={styles.archiveBody}>

                {/* Шапка: стрелка как в WorkerStats + заголовок */}
                <div className={styles.archiveTopBar}>
                    <div className={styles.archiveHeader}>
                        <button
                            type="button"
                            className={styles.archiveBackBtn}
                            onClick={onBack}
                            aria-label="Назад"
                        >
                            <span className={styles.archiveBackIcon}>
                                <ArrowLeft />
                            </span>
                        </button>
                        <h1 className={styles.archiveTitle}>Архив</h1>
                    </div>
                </div>

                {/* PILL-СЕГМЕНТ */}
                <div className={styles.archiveSegmented}>
                    <button
                        type="button"
                        className={`${styles.archiveSegment} ${activeTab === 'sites' ? styles.archiveSegmentActive : ''}`}
                        onClick={() => setActiveTab('sites')}
                    >
                        Объекты
                        <span className={styles.archiveSegmentBadge}>{visibleSites.length}</span>
                    </button>
                    <button
                        type="button"
                        className={`${styles.archiveSegment} ${activeTab === 'workers' ? styles.archiveSegmentActive : ''}`}
                        onClick={() => setActiveTab('workers')}
                    >
                        Работники
                        <span className={styles.archiveSegmentBadge}>{visibleWorkers.length}</span>
                    </button>
                </div>

                {/* СПИСОК КАРТОЧЕК */}
                <div className={styles.archiveCards}>
                    {activeTab === 'sites' && visibleSites.length === 0 && (
                        <div className={styles.archiveEmptyBlock}>
                            <div className={styles.archiveEmptyIconWrap}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                            </div>
                            <div className={styles.archiveEmptyTitle}>Архив пуст</div>
                            <div className={styles.archiveEmptySubtitle}>
                                Здесь появятся объекты, которые вы уберёте из работы
                            </div>
                        </div>
                    )}

                    {activeTab === 'sites' && visibleSites.map(site => {
                        const isRestoring = restoringId === site.id
                        return (
                            <div key={site.id} className={styles.archiveCard}>
                                <div className={styles.archiveCardThumb}>
                                    {isBase64Image(site.photo) ? (
                                        <img src={site.photo} alt="" className={styles.archiveCardPhoto} />
                                    ) : (
                                        <div className={styles.archiveCardPhotoPlaceholder}>
                                            <Camera className={styles.archiveCardPhotoIcon} />
                                        </div>
                                    )}
                                </div>

                                <div className={styles.archiveCardText}>
                                    <span className={styles.archiveCardName}>{site.name}</span>
                                    {site.address ? (
                                        <span className={styles.archiveCardSub}>{site.address}</span>
                                    ) : (
                                        <span className={styles.archiveCardSubMuted}>Без адреса</span>
                                    )}
                                </div>

                                <div className={styles.archiveCardActions}>
                                    <button
                                        type="button"
                                        className={styles.archiveActionBtnRestore}
                                        onClick={() => handleRestore(site.id, 'site')}
                                        disabled={isRestoring}
                                        aria-label="Восстановить"
                                        title="Восстановить"
                                    >
                                        <ArrowsRotateLeft className={styles.archiveActionIcon} />
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.archiveActionBtnDelete}
                                        onClick={() => handleDeleteForeverClick(site, 'site')}
                                        aria-label="Удалить навсегда"
                                        title="Удалить навсегда"
                                    >
                                        <TrashBin className={styles.archiveActionIcon} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}

                    {activeTab === 'workers' && visibleWorkers.length === 0 && (
                        <div className={styles.archiveEmptyBlock}>
                            <div className={styles.archiveEmptyIconWrap}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <div className={styles.archiveEmptyTitle}>Архив пуст</div>
                            <div className={styles.archiveEmptySubtitle}>
                                Здесь появятся работники, которых вы уберёте из бригады
                            </div>
                        </div>
                    )}

                    {activeTab === 'workers' && visibleWorkers.map(worker => {
                        const hasPhoto = isBase64Image(worker.avatar)
                        const initials = getInitials(worker.name)
                        const avatarColor = getAvatarColor(worker.name)
                        const isRestoring = restoringId === worker.id

                        return (
                            <div key={worker.id} className={styles.archiveCard}>
                                <div className={styles.archiveCardThumb}>
                                    <div
                                        className={styles.archiveCardAvatar}
                                        style={{ backgroundColor: hasPhoto ? 'transparent' : avatarColor }}
                                    >
                                        {hasPhoto ? (
                                            <img src={worker.avatar} alt="" className={styles.archiveCardPhoto} />
                                        ) : (
                                            initials
                                        )}
                                    </div>
                                </div>

                                <div className={styles.archiveCardText}>
                                    <span className={styles.archiveCardName}>{worker.name}</span>
                                    {worker.phone ? (
                                        <span className={styles.archiveCardSub}>{worker.phone}</span>
                                    ) : (
                                        <span className={styles.archiveCardSubMuted}>Без телефона</span>
                                    )}
                                </div>

                                <div className={styles.archiveCardActions}>
                                    <button
                                        type="button"
                                        className={styles.archiveActionBtnRestore}
                                        onClick={() => handleRestore(worker.id, 'worker')}
                                        disabled={isRestoring}
                                        aria-label="Восстановить"
                                        title="Восстановить"
                                    >
                                        <ArrowsRotateLeft className={styles.archiveActionIcon} />
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.archiveActionBtnDelete}
                                        onClick={() => handleDeleteForeverClick(worker, 'worker')}
                                        aria-label="Удалить навсегда"
                                        title="Удалить навсегда"
                                    >
                                        <TrashBin className={styles.archiveActionIcon} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* === НИЖНИЙ ФУТЕР — как .yandexFooter в AddSiteModal === */}
            <div className={styles.archiveFooter}>
    <button
        type="button"
        className={styles.archiveCloseBtn}
        onClick={onBack}
    >
        Назад
    </button>
</div>

            {/* === CONFIRM-ШИТ: УДАЛИТЬ НАВСЕГДА === */}
            {confirmTarget && createPortal(
                <div
                    className={styles.confirmSheetOverlay}
                    onClick={handleCancelDelete}
                >
                    <div
                        className={styles.confirmSheet}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className={styles.confirmSheetHandleZone}>
                            <span className={styles.confirmSheetHandle} />
                        </div>

                        <div className={styles.confirmSheetHeader}>
                            <h2 className={styles.confirmSheetTitle}>Удалить навсегда?</h2>
                            <button
                                type="button"
                                className={styles.confirmSheetCloseBtn}
                                onClick={handleCancelDelete}
                                aria-label="Закрыть"
                                disabled={deleting}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className={styles.confirmSheetBody}>
                            <p className={styles.confirmSheetText}>
                                {isSite ? 'Объект' : 'Работник'}{' '}
                                <strong>«{confirmTarget.name}»</strong>{' '}
                                будет скрыт из приложения.
                            </p>
                            <p className={styles.confirmSheetHint}>
                                История смен сохранится — в календаре останутся записи о работе на этом {isSite ? 'объекте' : 'работнике'}.
                            </p>
                        </div>

                        <div className={styles.confirmSheetFooter}>
                            <button
                                type="button"
                                className={styles.confirmSheetCancelBtn}
                                onClick={handleCancelDelete}
                                disabled={deleting}
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                className={styles.confirmSheetDeleteBtn}
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                            >
                                {deleting ? 'Удаляем...' : 'Удалить навсегда'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}