// src/components/Workers/WorkersList.jsx

import { useRef } from 'react'
import { useAvatars } from '../../context/AvatarContext'
import styles from '../../styles/workers.module.css'

const WorkersIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
)

export function WorkersList({ workers, onWorkerClick, refreshKey, filterStatus, onArchiveClick }) {
    const containerRef = useRef(null)
    const { getAvatar } = useAvatars()

    const getAvatarColor = (name) => {
        if (!name || typeof name !== 'string') {
            return '#78909C'
        }
        const colors = ['#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#FDD835', '#FFB300', '#FB8C00', '#F4511E', '#6D4C41', '#78909C']
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return colors[index % colors.length]
    }

    const getInitials = (name) => {
        if (!name || typeof name !== 'string') return '?'
        const parts = name.trim().split(' ')
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    }

    const getFilteredWorkers = () => {
        if (!workers || !Array.isArray(workers)) return []
        
        let filtered = [...workers]
        
        if (filterStatus === 'active') {
            filtered = filtered.filter(w => w?.status === 'active' || !w?.status)
        } else if (filterStatus === 'inactive') {
            filtered = filtered.filter(w => w?.status === 'inactive')
        }
        
        filtered.sort((a, b) => {
            const aIsActive = a?.status === 'active' || !a?.status
            const bIsActive = b?.status === 'active' || !b?.status
            
            if (aIsActive && !bIsActive) return -1
            if (!aIsActive && bIsActive) return 1
            
            return (a?.name || '').localeCompare(b?.name || '')
        })
        
        return filtered
    }

    const filteredWorkers = getFilteredWorkers()

    if (!workers || workers.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                    <WorkersIcon />
                </div>
                <div className={styles.emptyText}>Нет добавленных работников</div>
            </div>
        )
    }

    if (filteredWorkers.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>👷</div>
                <div className={styles.emptyText}>
                    {filterStatus === 'active' ? 'Нет активных работников' : 'Нет неактивных работников'}
                </div>
            </div>
        )
    }

    return (
        <div ref={containerRef} className={styles.workersListContainer} key={refreshKey}>
            {filteredWorkers.map((worker) => {
                const avatar = getAvatar(worker?.name)
                const hasPhoto = !!avatar
                const initials = getInitials(worker?.name)
                const avatarColor = getAvatarColor(worker?.name)
                const isActive = worker?.status === 'active' || !worker?.status
                const statusText = isActive ? 'Работает' : 'Не работает'

                return (
                    <div 
                        key={worker?.id} 
                        className={styles.workerListItem}
                        onClick={() => onWorkerClick(worker)}
                    >
                        <div 
                            className={styles.workerListAvatar}
                            style={{ 
                                backgroundColor: hasPhoto ? 'transparent' : avatarColor,
                                overflow: 'hidden',
                            }}
                        >
                            {hasPhoto ? (
                                <img 
                                    src={avatar} 
                                    alt={worker?.name || 'Работник'}
                                    loading="lazy"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '50%'
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none'
                                        e.target.parentNode.style.backgroundColor = avatarColor
                                        e.target.parentNode.textContent = initials
                                    }}
                                />
                            ) : (
                                initials
                            )}
                        </div>

                        <div className={styles.workerListInfo}>
                            <span className={styles.workerListName}>{worker?.name || 'Без имени'}</span>
                        </div>

                        <span className={`${styles.workerListStatusText} ${isActive ? styles.active : styles.inactive}`}>
                            {statusText}
                        </span>

                        {/* ⭐ Кнопка удаления временно скрыта (не удалена) */}
                        {/*
                        <button 
                            className={styles.workerListDeleteBtn}
                            onClick={(e) => {
                                e.stopPropagation()
                                if (onArchiveClick) {
                                    onArchiveClick(worker)
                                }
                            }}
                            aria-label="Архивировать работника"
                        >
                            <ArchiveIcon />
                        </button>
                        */}
                    </div>
                )
            })}
        </div>
    )
}