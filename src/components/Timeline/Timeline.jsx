import { useEffect, useState } from 'react'
import { fetchWorkers } from '../../services/supabase'
import { formatDateLocal } from '../../utils/dateHelpers'

export function Timeline({ shifts, sites = [], date, onClose, isFullscreen, hideHeader }) {
    const [workers, setWorkers] = useState([])

    // Загружаем только работников (объекты уже пришли из пропсов)
    useEffect(() => {
        const loadWorkers = async () => {
            try {
                const workersData = await fetchWorkers()
                setWorkers(workersData || [])
            } catch (error) {
                console.error('Ошибка загрузки работников:', error)
            }
        }
        loadWorkers()
    }, [])

    if (!date) return null

    const dateStr = formatDateLocal(date)
    const dayShifts = shifts.filter(s => s.work_date === dateStr)

    // Функция для получения имени объекта (из пропсов)
    const getSiteName = (siteId) => {
        if (!sites || sites.length === 0) return 'Загрузка...'
        const site = sites.find(s => s.id === siteId)
        return site ? site.name : 'Неизвестный объект'
    }

    // Функция для получения имени работника
    const getWorkerName = (workerId) => {
        if (!workers || workers.length === 0) return 'Загрузка...'
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
                    workers: new Set() 
                }
            }
            
            const workerName = s.worker_id ? getWorkerName(s.worker_id) : s.worker_name
            if (workerName) {
                sitesMap[siteId].workers.add(workerName)
            }
        })

        return Object.entries(sitesMap).map(([siteId, data]) => (
            <div key={siteId} className="card">
                <div className="card-header">
                    <span className="card-icon">📍</span>
                    <span className="card-title">{data.siteName}</span>
                </div>
                <div className="card-body">
                    {Array.from(data.workers).map((workerName, idx) => (
                        <div key={idx} className="worker-chip">
                            <span className="worker-chip-name">{workerName}</span>
                        </div>
                    ))}
                </div>
            </div>
        ))
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
