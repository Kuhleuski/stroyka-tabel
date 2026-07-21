import { useEffect, useState } from 'react'
import { fetchSites, fetchWorkers } from '../../services/supabase'

export function Timeline({ shifts, date, onClose, isFullscreen, hideHeader }) {
    const [sites, setSites] = useState([])
    const [workers, setWorkers] = useState([])

    // Загружаем объекты и работников для получения имен по ID
    useEffect(() => {
        const loadData = async () => {
            try {
                const [sitesData, workersData] = await Promise.all([
                    fetchSites(),
                    fetchWorkers()
                ])
                setSites(sitesData || [])
                setWorkers(workersData || [])
            } catch (error) {
                console.error('Ошибка загрузки данных:', error)
            }
        }
        loadData()
    }, [])

    if (!date) return null

    const dateStr = date.toISOString().split('T')[0]
    const dayShifts = shifts.filter(s => s.work_date === dateStr)

    // Функция для получения имени объекта по ID
    const getSiteName = (siteId) => {
        const site = sites.find(s => s.id === siteId)
        return site ? site.name : 'Неизвестный объект'
    }

    // Функция для получения имени работника по ID
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

        // Группируем по объектам через site_id
        const sitesMap = {}
        dayShifts.forEach(s => {
            // Используем site_id, если есть, иначе site_name (для старых данных)
            const siteId = s.site_id || s.site_name
            if (!sitesMap[siteId]) {
                sitesMap[siteId] = { 
                    siteName: s.site_id ? getSiteName(s.site_id) : s.site_name,
                    workers: new Set() 
                }
            }
            
            // Используем worker_id, если есть, иначе worker_name (для старых данных)
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

    // Если hideHeader === true — НЕ ПОКАЗЫВАЕМ шапку с датой и счетчиком
    if (isFullscreen || hideHeader) {
        return <>{renderContent()}</>
    }

    // Обычный режим (мини-таймлайн под календарём)
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
