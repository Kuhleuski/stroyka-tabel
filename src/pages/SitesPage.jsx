import { useState } from 'react'
import { SitesList } from '../components/Sites/SitesList'
import { AddSitePage } from './AddSitePage'
import { SiteDetailPage } from './SiteDetailPage'
import { addSite } from '../services/supabase'
import { useSites } from '../hooks/useSites'

export function SitesPage({ onAddSite }) {
    const [showAddForm, setShowAddForm] = useState(false)
    const [selectedSite, setSelectedSite] = useState(null)
    const [scrollPosition, setScrollPosition] = useState(0)
    const { sites, loading, error, addSiteToState } = useSites()

    const handleSave = async (name, address) => {
        try {
            const newSite = await addSite(name, address)
            const siteData = newSite[0] || newSite
            addSiteToState(siteData)
            if (onAddSite) {
                onAddSite(siteData)
            }
            setShowAddForm(false)
        } catch (err) {
            throw err
        }
    }

    const handleSiteClick = (site) => {
        // Запоминаем позицию скролла
        const container = document.querySelector('.sites-list-container')
        if (container) {
            setScrollPosition(container.scrollTop)
        }
        setSelectedSite(site)
    }

    const handleCloseDetail = () => {
        setSelectedSite(null)
        // Восстанавливаем позицию после закрытия деталей
        setTimeout(() => {
            const container = document.querySelector('.sites-list-container')
            if (container) {
                container.scrollTop = scrollPosition
            }
        }, 50)
    }

    if (loading) {
        return <div className="loading-text">⏳ Загрузка...</div>
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-icon">❌</div>
                <div className="error-text">Ошибка загрузки объектов</div>
                <div className="error-detail">{error}</div>
            </div>
        )
    }

    if (selectedSite) {
        return (
            <SiteDetailPage 
                site={selectedSite}
                onClose={handleCloseDetail}
            />
        )
    }

    if (showAddForm) {
        return (
            <AddSitePage 
                onSave={handleSave}
                onCancel={() => setShowAddForm(false)}
            />
        )
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <div className="page-title">🏢 Объекты</div>
                    <div className="page-subtitle">Все стройплощадки</div>
                </div>
                <button 
                    className="add-site-btn"
                    onClick={() => setShowAddForm(true)}
                >
                    + Добавить объект
                </button>
            </div>
            <div className="sites-list-container">
                <SitesList 
                    sites={sites} 
                    onSiteClick={handleSiteClick}
                />
            </div>
        </>
    )
}
