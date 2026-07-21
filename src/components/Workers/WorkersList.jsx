import { useRef } from 'react'

export function WorkersList({ workers, onWorkerClick }) {
    const containerRef = useRef(null)

    // Функция для получения цвета аватарки на основе имени
    const getAvatarColor = (name) => {
        const colors = ['#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#FDD835', '#FFB300', '#FB8C00', '#F4511E', '#6D4C41', '#78909C']
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return colors[index % colors.length]
    }

    // Функция для получения инициалов
    const getInitials = (name) => {
        if (!name) return '?'
        const parts = name.trim().split(' ')
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
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
                const hasPhoto = worker.avatar_url && worker.avatar_url.startsWith('http')
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
                            overflow: 'hidden'
                        }}>
                            {hasPhoto ? (
                                <img 
                                    src={worker.avatar_url} 
                                    alt={worker.name}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '50%'
                                    }}
                                    onError={(e) => {
                                        // Если фото не загрузилось — показываем букву
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
                                {/* Можно добавить статистику, если есть */}
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
