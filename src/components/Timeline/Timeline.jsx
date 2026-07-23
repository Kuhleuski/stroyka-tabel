import { useEffect, useState } from 'react'
import { formatDateLocal } from '../../utils/dateHelpers'
import { useAvatars } from '../../context/AvatarContext'
import styles from '../../styles/timeline.module.css'

export function Timeline({ shifts, sites = [], date, onClose, isFullscreen, hideHeader }) {
    const [isReady, setIsReady] = useState(false)
    const { getAvatar, getWorker, workers } = useAvatars()

    useEffect(() => {
        setTimeout(() => setIsReady(true), 100)
    }, [])

    if (!date) return null

    const dateStr = formatDateLocal(date)
    const dayShifts = shifts.filter(s => s.work_date === dateStr)

    const getSite = (siteId) => {
        return sites.find(s => s.id === siteId)
    }

    const getSiteName = (siteId) => {
        const site = getSite(siteId)
        return site ? site.name : 'Неизвестный объект'
    }

    const getSiteColor = (siteId) => {
        const site = getSite(siteId)
        return site ? site.color : '#cccccc'
    }

    const getSiteAddress = (siteId) => {
        const site = getSite(siteId)
        return site && site.address ? site.address : null
    }

    const getWorkerName = (workerId) => {
        if (!workerId) return 'Неизвестный работник'
        const worker = workers.find(w => w.id === workerId || w.id === Number(workerId))
        return worker ? worker.name : 'Неизвестный работник'
    }

    const getWorkerAvatarData = (workerName) => {
        if (!workerName) return null
        const worker = workers.find(w => w.name === workerName)
        return worker ? getAvatar(workerName) : null
    }

    const getWorkerAvatar = (workerName) => {
        if (!workerName) return '?'
        return workerName.charAt(0).toUpperCase()
    }

    const getWorkerColor = (workerName) => {
        const colors = ['#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#FDD835', '#FFB300', '#FB8C00', '#F4511E', '#6D4C41', '#78909C']
        const index = workerName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return colors[index % colors.length]
    }

    const renderContent = () => {
        if (dayShifts.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📭</div>
                    <div className={styles.emptyText}>В этот день никто не работал</div>
                </div>
            )
        }

        const sitesMap = {}
        dayShifts.forEach(s => {
            const siteId = s.site_id || s.site_name
            if (!sitesMap[siteId]) {
                sitesMap[siteId] = { 
                    siteName: s.site_id ? getSiteName(s.site_id) : s.site_name,
                    siteColor: s.site_id ? getSiteColor(s.site_id) : '#cccccc',
                    siteAddress: s.site_id ? getSiteAddress(s.site_id) : null,
                    workers: new Set() 
                }
            }
            
            const workerName = s.worker_id ? getWorkerName(s.worker_id) : s.worker_name
            if (workerName && workerName !== 'Неизвестный работник') {
                sitesMap[siteId].workers.add(workerName)
            }
        })

        return Object.entries(sitesMap).map(([siteId, data]) => {
            const color = data.siteColor
            const workerList = Array.from(data.workers)

            return (
                <div 
                    key={siteId} 
                    className={styles.timelineCard}
                    style={{
                        opacity: isReady ? 1 : 0,
                        transform: isReady ? 'translateY(0)' : 'translateY(8px)',
                        transition: 'opacity 0.3s ease, transform 0.3s ease',
                        borderRadius: '12px',
                        padding: '16px',
                        backgroundColor: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        marginBottom: '12px'
                    }}
                >
                    {/* Заголовок с цветным прямоугольником */}
                    <div className={styles.cardHeader} style={{ 
                        marginBottom: '12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        flexWrap: 'wrap'
                    }}>
                        <span style={{
                            display: 'inline-block',
                            backgroundColor: color,
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '15px',
                            padding: '4px 14px',
                            borderRadius: '8px',
                            textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                            whiteSpace: 'nowrap'
                        }}>
                            {data.siteName}
                        </span>
                        {data.siteAddress && (
                            <span style={{ 
                                fontSize: '13px', 
                                color: '#888', 
                                fontWeight: 400
                            }}>
                                {data.siteAddress}
                            </span>
                        )}
                    </div>

                    {/* Аватарки работников */}
                    <div style={{ 
                        display: 'flex', 
                        gap: '10px', 
                        flexWrap: 'wrap',
                        alignItems: 'center'
                    }}>
                        {workerList.map((workerName, idx) => {
                            const avatarData = getWorkerAvatarData(workerName)
                            const hasPhoto = !!avatarData
                            const avatarLetter = getWorkerAvatar(workerName)
                            const avatarColor = getWorkerColor(workerName)

                            return (
                                <div 
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px',
                                        opacity: isReady ? 1 : 0,
                                        transform: isReady ? 'scale(1)' : 'scale(0.8)',
                                        transition: `opacity 0.25s ease ${idx * 0.05}s, transform 0.25s ease ${idx * 0.05}s`
                                    }}
                                >
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        backgroundColor: hasPhoto ? 'transparent' : avatarColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '22px',
                                        fontWeight: 600,
                                        color: 'white',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        flexShrink: 0,
                                        overflow: 'hidden',
                                        border: hasPhoto ? '2px solid #e8eaed' : 'none'
                                    }}>
                                        {hasPhoto ? (
                                            <img 
                                                src={avatarData} 
                                                alt={workerName}
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
                                                    e.target.parentNode.textContent = avatarLetter
                                                }}
                                            />
                                        ) : (
                                            avatarLetter
                                        )}
                                    </div>
                                    <span style={{
                                        fontSize: '10px',
                                        color: '#555',
                                        textAlign: 'center',
                                        maxWidth: '60px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {workerName}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )
        })
    }

    if (isFullscreen || hideHeader) {
        return <>{renderContent()}</>
    }

    return (
        <div className={styles.timelineMini}>
            <div className={styles.timelineMiniHeader}>
                <span className={styles.timelineMiniDate}>
                    {date.getDate()} {['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'][date.getMonth()]} {date.getFullYear()}
                </span>
                <span className={styles.timelineMiniCount}>
                    {dayShifts.length} {dayShifts.length === 1 ? 'смена' : 'смен'}
                </span>
            </div>
            {renderContent()}
        </div>
    )
}
