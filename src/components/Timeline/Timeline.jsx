import { useEffect, useState } from 'react'
import { fetchWorkers } from '../../services/supabase'
import { formatDateLocal } from '../../utils/dateHelpers'

export function Timeline({ shifts, sites = [], date, onClose, isFullscreen, hideHeader }) {
    const [workers, setWorkers] = useState([])
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        const loadWorkers = async () => {
            try {
                const workersData = await fetchWorkers()
                setWorkers(workersData || [])
            } catch (error) {
                console.error('Ошибка загрузки работников:', error)
            } finally {
                setTimeout(() => setIsReady(true), 100)
            }
        }
        loadWorkers()
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
        const worker = workers.find(w => w.id === workerId)
        return worker ? worker.name : 'Неизвестный работник'
    }

    const renderContent = () => {
        if (dayShifts.length === 0) {
            return (
                <div className="card empty-state">
                    <div className="empty-icon">📭</div>
                    <div className="empty-text">В этот день никто не работал</div>
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
            if (workerName) {
                sitesMap[siteId].workers.add(workerName)
            }
        })

        return Object.entries(sitesMap).map(([siteId, data]) => {
            const color = data.siteColor

            return (
                <div 
                    key={siteId} 
                    className="card timeline-card"
                    style={{
                        opacity: isReady ? 1 : 0,
                        transform: isReady ? 'translateY(0)' : 'translateY(8px)',
                        transition: 'opacity 0.3s ease, transform 0.3s ease',
                        borderLeft: `5px solid ${color}`,
                        borderRadius: '12px',
                        paddingLeft: '12px'
                    }}
                >
                    <div className="card-header" style={{ marginBottom: '6px' }}>
                        <span className="card-title" style={{ fontSize: '16px', fontWeight: 600 }}>
                            {data.siteName}
                        </span>
                        {data.siteAddress && (
                            <span style={{ 
                                fontSize: '13px', 
                                color: '#888', 
                                marginLeft: '8px',
                                fontWeight: 400
                            }}>
                                {data.siteAddress}
                            </span>
                        )}
                    </div>
                    <div className="card-body">
                        {Array.from(data.workers).map((workerName, idx) => (
                            <div 
                                key={idx} 
                                className="worker-chip"
                                style={{
                                    opacity: isReady ? 1 : 0,
                                    transform: isReady ? 'translateX(0)' : 'translateX(-8px)',
                                    transition: `opacity 0.25s ease ${idx * 0.05}s, transform 0.25s ease ${idx * 0.05}s`,
                                    padding: '4px 0'
                                }}
                            >
                                <span className="worker-chip-name" style={{ fontSize: '14px' }}>
                                    {workerName}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        })
    }

    if (isFullscreen || hideHeader) {
        return <>{renderContent()}</>
    }

    return (
        <div className="timeline-mini">
            <div className="timeline-mini-header">
                <span className="timeline-mini-date">
                    {date.getDate()} {['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'][date.getMonth()]} {date.getFullYear()}
                </span>
                <span className="timeline-mini-count">
                    {dayShifts.length} {dayShifts.length === 1 ? 'смена' : 'смен'}
                </span>
            </div>
            {renderContent()}
        </div>
    )
}
