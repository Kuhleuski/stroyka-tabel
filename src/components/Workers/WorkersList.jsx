import { useRef, useMemo } from 'react'
import { useAvatars } from '../../context/AvatarContext'

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
        const colors = ['#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#FDD835', '#FFB300', '#FB8C00', '#F4511E', '#6D4C41', '#78909C']
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return colors[index % colors.length]
    }

    const getInitials = (name) => {
        if (!name) return '?'
        const parts = name.trim().split(' ')
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    }

    // === СОРТИРОВКА: ПОСЛЕДНИЙ СОЗДАННЫЙ — ПЕРВЫЙ ===
    const sortedWorkers = useMemo(() => {
        return [...workers].sort((a, b) => {
            const dateA = new Date(a.created_at || 0)
            const dateB = new Date(b.created_at || 0)
            return dateB - dateA // по убыванию (новые сверху)
        })
    }, [workers])

    // === КЕШИРОВАННЫЙ СПИСОК ===
    const cachedWorkers = useMemo(() => {
        return sortedWorkers.map((worker) => {
            const avatar = getAvatar(worker.name)
            return {
                ...worker,
                hasPhoto: !!avatar,
                avatarData: avatar,
                initials: getInitials(worker.name),
                avatarColor: getAvatarColor(worker.name)
            }
        })
    }, [sortedWorkers, getAvatar])

    if (workers.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">
                    <WorkersIcon />
                </div>
                <div className="empty-text">Нет добавленных работников</div>
            </div>
        )
    }

    return (
        <div ref={containerRef} className="workers-grid-container">
            {cachedWorkers.map((worker) => {
                const { hasPhoto, avatarData, initials, avatarColor } = worker

                return (
                    <div 
                        key={worker.id} 
                        className="worker-grid-card"
                        onClick={() => onWorkerClick(worker)}
                    >
                        <div className="worker-grid-avatar" style={{ 
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
                                    alt={worker.name}
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
                        <div className="worker-grid-name">{worker.name}</div>
                    </div>
                )
            })}
        </div>
    )
}
