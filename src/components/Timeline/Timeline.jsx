import { fetchSites, fetchWorkers } from '../../services/supabase'
import { useState, useEffect } from 'react'

export function Timeline({ shifts, date, onClose, isFullscreen }) {
    const [sites, setSites] = useState([])
    const [workers, setWorkers] = useState([])
    
    // Загружаем объекты и работников
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
            const siteId = s.site_id
            if (!sitesMap[siteId]) {
                sitesMap[siteId] = { 
                    siteName: getSiteName(siteId),
                    workers: new Set() 
                }
            }
            // Добавляем работника через worker_id
            if (s.worker_id) {
                sitesMap[siteId].workers.add(getWorkerName(s.worker_id))
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

    // Если isFullscreen — просто контент без шапки
    if (isFullscreen) {
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
