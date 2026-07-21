import { useState } from 'react'
import { SitesList } from '../components/Sites/SitesList'
import { AddSitePage } from './AddSitePage'
import { SiteDetailPage } from './SiteDetailPage'
import { addSite, deleteSite } from '../services/supabase'
import { useSites } from '../hooks/useSites'
import { Plus } from 'lucide-react'

// === ПЛОСКАЯ ИКОНКА ДЛЯ ЗАГОЛОВКА ===
const SitesIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
    </svg>
)

export function SitesPage({ onAddSite }) {
    const [showAddForm, setShowAddForm] = useState(false)
    const [selectedSite, setSelectedSite] = useState(null)
    const [scrollPosition, setScrollPosition] = useState(0)
    const { sites, loading, error, addSiteToState, removeSiteFromState } = useSites()

    const handleSave = async (name, address, color) => {
        try {
            const newSite = await addSite(name, address, color)
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

    const handleDelete = async (siteId) => {
        await deleteSite(siteId)
        removeSiteFromState(siteId)
    }

    const handleSiteClick = (site) => {
        const container = document.querySelector('.sites-list-container')
        if (container) {
            setScrollPosition(container.scrollTop)
        }
        setSelectedSite(site)
    }

    const handleCloseDetail = () => {
        setSelectedSite(null)
        setTimeout(() => {
            const container = document.querySelector('.sites-list-container')
            if (container) {
                container.scrollTop = scrollPosition
            }
        }, 50)
    }

    const handleOpenAddForm = () => {
        setShowAddForm(true)
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
                onDelete={handleDelete}
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
                    <div className="page-title">
                        <SitesIcon />
                        Объекты
                    </div>
                    <div className="page-subtitle">Все объекты</div>
                </div>
                <button 
                    className="add-site-btn"
                    onClick={handleOpenAddForm}
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

            {/* ПЛАВАЮЩАЯ КНОПКА (FAB) — дублирует "Добавить объект" */}
            <button 
                className="fab-add-site"
                onClick={handleOpenAddForm}
                aria-label="Добавить объект"
            >
                <Plus size={28} strokeWidth={2.5} />
            </button>
        </>
    )
}
