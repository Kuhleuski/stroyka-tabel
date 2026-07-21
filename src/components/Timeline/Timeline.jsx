import { useEffect, useState } from 'react'
import { fetchSites, fetchWorkers } from '../../services/supabase'
import { formatDateLocal } from '../../utils/dateHelpers'

export function Timeline({ shifts, date, onClose, isFullscreen, hideHeader }) {
    const [sites, setSites] = useState([])
    const [workers, setWorkers] = useState([])

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

    const dateStr = formatDateLocal(date)
    const dayShifts = shifts.filter(s => s.work_date === dateStr)

    const getSiteName = (siteId) => {
        const site = sites.find(s => s.id === siteId)
        return site ? site.name : 'Неизвестный объект'
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
                    <span className="card-icon">📍</span
