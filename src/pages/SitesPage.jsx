import { useState } from 'react'
import { SitesList } from '../components/Sites/SitesList'
import { AddSitePage } from './AddSitePage'
import { addSite } from '../services/supabase'

export function SitesPage({ shifts, loading, onAddSite }) {
    const [showAddForm, setShowAddForm] = useState(false)

    const handleSave = async (name, address) => {
        try {
            const newSite = await addSite(name, address)
            if (onAddSite) {
                onAddSite(newSite[0])
            }
            setShowAddForm(false)
        } catch (error) {
            throw error
        }
    }

    if (loading) {
        return <div className="loading-text">⏳ Загрузка...</div>
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
            <SitesList shifts={shifts} />
        </>
    )
}
