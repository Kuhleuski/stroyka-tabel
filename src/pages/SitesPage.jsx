import { useState } from 'react'
import { SitesList } from '../components/Sites/SitesList'
import { AddSitePage } from './AddSitePage'
import { addSite } from '../services/supabase'
import { useSites } from '../hooks/useSites'

export function SitesPage({ onAddSite }) {
    const [showAddForm, setShowAddForm] = useState(false)
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
                    className="add-site-button"
                    onClick={() => setShowAddForm(true)}
                >
                    +
                </button>
            </div>
            <SitesList sites={sites} />
        </>
    )
}
