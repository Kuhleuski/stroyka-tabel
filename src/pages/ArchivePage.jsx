import { useState, useEffect } from 'react'
import { useSites } from '../hooks/useSites'
import { useWorkers } from '../hooks/useWorkers'
import styles from '../styles/archive.module.css'

const ArchiveIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8v13H3V8"/>
        <path d="M1 3h22v5H1z"/>
        <path d="M10 12h4"/>
    </svg>
)

export function ArchivePage() {
    const [activeTab, setActiveTab] = useState('sites')
    const { archivedSites, restoreSiteInState, refreshArchivedSites } = useSites()
    const { archivedWorkers, restoreWorkerInState, refreshArchivedWorkers } = useWorkers()

    useEffect(() => {
        refreshArchivedSites()
        refreshArchivedWorkers()
    }, [])

    const handleRestore = async (id, type) => {
        if (type === 'site') {
            await restoreSiteInState(id)
            await refreshArchivedSites()
        } else {
            await restoreWorkerInState(id)
            await refreshArchivedWorkers()
        }
    }

    const handleDeleteForever = (id, type) => {
        // Визуально удаляем из архива, но в базе остаётся
        if (type === 'site') {
            // Можно добавить поле hidden или просто удалить из состояния
            // Пока просто удаляем из списка архива
            // В базе остаётся archived = true
        } else {
            // Аналогично
        }
        // Обновляем список
        if (type === 'site') {
            refreshArchivedSites()
        } else {
            refreshArchivedWorkers()
        }
    }

    return (
        <div className={styles.archivePage}>
            <div className={styles.archiveHeader}>
                <div className={styles.archiveTitle}>
                    <ArchiveIcon />
                    Архив
                </div>
                <div className={styles.archiveSubtitle}>
                    Здесь хранятся архивированные объекты и работники
                </div>
            </div>

            <div className={styles.archiveTabs}>
                <button 
                    className={`${styles.archiveTab} ${activeTab === 'sites' ? styles.active : ''}`}
                    onClick={() => setActiveTab('sites')}
                >
                    Объекты ({archivedSites.length})
                </button>
                <button 
                    className={`${styles.archiveTab} ${activeTab === 'workers' ? styles.active : ''}`}
                    onClick={() => setActiveTab('workers')}
                >
                    Работники ({archivedWorkers.length})
                </button>
            </div>

            <div className={styles.archiveList}>
                {activeTab === 'sites' && archivedSites.length === 0 && (
                    <div className={styles.archiveEmpty}>Нет архивных объектов</div>
                )}
                {activeTab === 'workers' && archivedWorkers.length === 0 && (
                    <div className={styles.archiveEmpty}>Нет архивных работников</div>
                )}

                {activeTab === 'sites' && archivedSites.map(site => (
                    <div key={site.id} className={styles.archiveItem}>
                        <span className={styles.archiveItemName}>{site.name}</span>
                        <div className={styles.archiveItemActions}>
                            <button 
                                className={styles.archiveRestoreBtn}
                                onClick={() => handleRestore(site.id, 'site')}
                            >
                                Восстановить
                            </button>
                            <button 
                                className={styles.archiveDeleteBtn}
                                onClick={() => handleDeleteForever(site.id, 'site')}
                            >
                                Удалить навсегда
                            </button>
                        </div>
                    </div>
                ))}

                {activeTab === 'workers' && archivedWorkers.map(worker => (
                    <div key={worker.id} className={styles.archiveItem}>
                        <span className={styles.archiveItemName}>{worker.name}</span>
                        <div className={styles.archiveItemActions}>
                            <button 
                                className={styles.archiveRestoreBtn}
                                onClick={() => handleRestore(worker.id, 'worker')}
                            >
                                Восстановить
                            </button>
                            <button 
                                className={styles.archiveDeleteBtn}
                                onClick={() => handleDeleteForever(worker.id, 'worker')}
                            >
                                Удалить навсегда
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}