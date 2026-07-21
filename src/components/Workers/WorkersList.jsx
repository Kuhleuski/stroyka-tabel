import { useRef } from 'react'

export function WorkersList({ workers, onWorkerClick }) {
    const containerRef = useRef(null)

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

    const isBase64Image = (str) => {
        return str && str.startsWith('data:image')
    }

    if (workers.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">👷</div>
                <div className="empty-text">Нет добавленных работников</div>
            </div>
        )
    }

    return (
        <div ref={containerRef}>
            {workers.map((worker) => {
                const hasPhoto = isBase64Image(worker.avatar)
                const initials = getInitials(worker.name)
                const avatarColor = getAvatarColor(worker.name)

                return (
                    <div 
                        key={worker.id} 
                        className="card worker-card"
                        onClick={() => onWorkerClick(worker)}
                    >
                        <div className="worker-card-avatar" style={{ 
                            backgroundColor: hasPhoto ? 'transparent' : avatarColor,
                            border: hasPhoto ? '2px solid #e8eaed' : 'none',
                            overflow: 'hidden',
                            borderRadius: '50%',
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            fontWeight: 600,
                            color: 'white',
                            flexShrink: 0
                        }}>
                            {hasPhoto ? (
                                <img 
                                    src={worker.avatar} 
                                    alt={worker.name}
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
                        <div className="worker-card-info">
                            <div className="worker-card-name">{worker.name}</div>
                            <div className="worker-card-stats">
                                <span>ID: {worker.id}</span>
                            </div>
                        </div>
                        <div className="worker-card-arrow">›</div>
                    </div>
                )
            })}
        </div>
    )
}
