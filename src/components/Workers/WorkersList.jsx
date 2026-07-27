// src/components/Workers/WorkersList.jsx

import { useRef, useMemo } from 'react'
import { useAvatars } from '../../context/AvatarContext'
import styles from '../../styles/workers.module.css'

// === ПЛОСКАЯ ИКОНКА ДЛЯ БРИГАДЫ ===
const WorkersIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
)

export function WorkersList({ workers, onWorkerClick }) {
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

    // === ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ДАТЫ ПОСЛЕДНЕГО ОТКРЫТИЯ ===
    const getLastOpened = (workerId) => {
        try {
            const stored = localStorage.getItem('workerLastOpened')
            if (!stored) return null
            const data = JSON.parse(stored)
            return data[workerId] || null
        } catch (e) {
            return null
        }
    }

    // === ПОЛУЧАЕМ ID НОВОГО РАБОТНИКА ===
    const getNewWorkerId = () => {
        try {
            return localStorage.getItem('newWorkerId') || null
        } catch (e) {
            return null
        }
    }

    // === СОРТИРОВКА ===
    const sortedWorkers = useMemo(() => {
        if (!workers || !Array.isArray(workers)) return []
        
        const newWorkerId = getNewWorkerId()
        
        // Разделяем на активных и неактивных
        const activeWorkers = workers.filter(w => w?.status === 'active' || !w?.status)
        const inactiveWorkers = workers.filter(w => w?.status === 'inactive')
        
        // Сортируем активных
        const sortedActive = activeWorkers.sort((a, b) => {
            // Новый работник — всегда в начале активных
            const isNewA = newWorkerId && a?.id === parseInt(newWorkerId)
            const isNewB = newWorkerId && b?.id === parseInt(newWorkerId)
            
            if (isNewA && !isNewB) return -1
            if (isNewB && !isNewA) return 1
            
            // По дате последнего открытия
            const lastOpenedA = getLastOpened(a?.id)
            const lastOpenedB = getLastOpened(b?.id)
            
            if (lastOpenedA && lastOpenedB) {
                return new Date(lastOpenedB).getTime() - new Date(lastOpenedA).getTime()
            }
            if (lastOpenedA) return -1
            if (lastOpenedB) return 1
            
            // По дате создания
            return new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime()
        })
        
        // Сортируем неактивных
        const sortedInactive = inactiveWorkers.sort((a, b) => {
            // По дате последнего открытия
            const lastOpenedA = getLastOpened(a?.id)
            const lastOpenedB = getLastOpened(b?.id)
            
            if (lastOpenedA && lastOpenedB) {
                return new Date(lastOpenedB).getTime() - new Date(lastOpenedA).getTime()
            }
            if (lastOpenedA) return -1
            if (lastOpenedB) return 1
            
            // По дате создания
            return new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime()
        })
        
        return { active: sortedActive, inactive: sortedInactive }
    }, [workers])

    // === КЕШИРОВАННЫЙ СПИСОК ===
    const cachedWorkers = useMemo(() => {
        const activeCached = sortedWorkers.active.map((worker) => {
            const avatar = getAvatar(worker?.name)
            return {
                ...worker,
                hasPhoto: !!avatar,
                avatarData: avatar,
                initials: getInitials(worker?.name),
                avatarColor: getAvatarColor(worker?.name),
                status: worker?.status || 'active'
            }
        })
        
        const inactiveCached = sortedWorkers.inactive.map((worker) => {
            const avatar = getAvatar(worker?.name)
            return {
                ...worker,
                hasPhoto: !!avatar,
                avatarData: avatar,
                initials: getInitials(worker?.name),
                avatarColor: getAvatarColor(worker?.name),
                status: worker?.status || 'inactive'
            }
        })
        
        return { active: activeCached, inactive: inactiveCached }
    }, [sortedWorkers, getAvatar])

    const allWorkersCount = workers?.length || 0
    const hasActive = cachedWorkers.active.length > 0
    const hasInactive = cachedWorkers.inactive.length > 0

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

    return (
        <div ref={containerRef} className={styles.workersGridContainer}>
            {/* АКТИВНЫЕ РАБОТНИКИ */}
            {hasActive && (
                <>
                    <div className={styles.workersSectionHeader}>
                        Работники в статусе активные
                    </div>
                    <div className={styles.workersGrid}>
                        {cachedWorkers.active.map((worker) => {
                            const { hasPhoto, avatarData, initials, avatarColor, status } = worker
                            const isActive = status === 'active'

                            return (
                                <div 
                                    key={worker?.id} 
                                    className={styles.workerGridCard}
                                    onClick={() => onWorkerClick(worker)}
                                >
                                    <div className={styles.workerGridAvatar} style={{ 
                                        backgroundColor: hasPhoto ? 'transparent' : avatarColor,
                                        border: hasPhoto ? '2px solid #e8eaed' : 'none',
                                        overflow: 'hidden',
                                        borderRadius: '50%',
                                        width: '64px',
                                        height: '64px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        fontWeight: 600,
                                        color: 'white',
                                        flexShrink: 0,
                                        margin: '0 auto'
                                    }}>
                                        {hasPhoto ? (
                                            <img 
                                                src={avatarData} 
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
                                    <div className={styles.workerGridNameWrapper}>
                                        <span 
                                            className={styles.workerStatusDot}
                                            style={{ 
                                                backgroundColor: isActive ? 'rgb(16, 180, 0)' : 'rgb(141, 141, 141)',
                                                boxShadow: isActive ? '0 0 6px rgba(16, 180, 0, 0.5)' : 'none'
                                            }}
                                        />
                                        <span className={styles.workerGridName}>{worker?.name || 'Без имени'}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {/* РАЗДЕЛИТЕЛЬ (ТОЛЬКО ЕСЛИ ЕСТЬ И АКТИВНЫЕ И НЕАКТИВНЫЕ) */}
            {hasActive && hasInactive && (
                <div className={styles.workersDivider} />
            )}

            {/* НЕАКТИВНЫЕ РАБОТНИКИ */}
            {hasInactive && (
                <>
                    <div className={styles.workersSectionHeader}>
                        Работники в статусе не активные
                    </div>
                    <div className={styles.workersGrid}>
                        {cachedWorkers.inactive.map((worker) => {
                            const { hasPhoto, avatarData, initials, avatarColor, status } = worker
                            const isActive = status === 'active'

                            return (
                                <div 
                                    key={worker?.id} 
                                    className={styles.workerGridCard}
                                    onClick={() => onWorkerClick(worker)}
                                >
                                    <div className={styles.workerGridAvatar} style={{ 
                                        backgroundColor: hasPhoto ? 'transparent' : avatarColor,
                                        border: hasPhoto ? '2px solid #e8eaed' : 'none',
                                        overflow: 'hidden',
                                        borderRadius: '50%',
                                        width: '64px',
                                        height: '64px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        fontWeight: 600,
                                        color: 'white',
                                        flexShrink: 0,
                                        margin: '0 auto'
                                    }}>
                                        {hasPhoto ? (
                                            <img 
                                                src={avatarData} 
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
                                    <div className={styles.workerGridNameWrapper}>
                                        <span 
                                            className={styles.workerStatusDot}
                                            style={{ 
                                                backgroundColor: isActive ? 'rgb(16, 180, 0)' : 'rgb(141, 141, 141)',
                                                boxShadow: isActive ? '0 0 6px rgba(16, 180, 0, 0.5)' : 'none'
                                            }}
                                        />
                                        <span className={styles.workerGridName}>{worker?.name || 'Без имени'}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}
