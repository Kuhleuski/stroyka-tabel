// src/pages/SitesPage.jsx

import { useState } from 'react'
import { SitesList } from '../components/Sites/SitesList'
import { SiteDetailPage } from './SiteDetailPage'
import { AddSiteModal } from '../components/AddSiteModal'
import { EditSiteModal } from '../components/EditSiteModal'
import { addSite, deleteSite, updateSite } from '../services/supabase'
import { useSites } from '../hooks/useSites'
import { Plus } from 'lucide-react'
import styles from '../styles/sites.module.css'
import globalsStyles from '../styles/globals.module.css'

// === ПЛОСКАЯ ИКОНКА ===
const SitesIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
    </svg>
)

export function SitesPage({ onAddSite }) {
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedSite, setSelectedSite] = useState(null)
    const [editingSite, setEditingSite] = useState(null)
    const [scrollPosition, setScrollPosition] = useState(0)
    const { sites, loading, error, addSiteToState, removeSiteFromState, updateSiteInState } = useSites()

    // === ФИЛЬТР С СОХРАНЕНИЕМ В localStorage ===
    const [filter, setFilter] = useState(() => {
        return localStorage.getItem('sitesFilter') || 'all'
    })

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter)
        localStorage.setItem('sitesFilter', newFilter)
    }

    // === СОХРАНЕНИЕ ДАТЫ ПОСЛЕДНЕГО ОТКРЫТИЯ ===
    const saveLastOpened = (siteId) => {
        try {
            const now = new Date().toISOString()
            const stored = localStorage.getItem('siteLastOpened')
            const data = stored ? JSON.parse(stored) : {}
            data[siteId] = now
            localStorage.setItem('siteLastOpened', JSON.stringify(data))
        } catch (e) {
            console.warn('Ошибка сохранения даты открытия:', e)
        }
    }

    const handleSave = async (name, address, color) => {
        try {
            const newSite = await addSite(name, address, color)
            const siteData = newSite[0] || newSite
            addSiteToState(siteData)
            if (onAddSite) {
                onAddSite(siteData)
            }
            setShowAddModal(false)
        } catch (err) {
            throw err
        }
    }

    const handleUpdate = async (siteId, name, address, color, status) => {
        try {
            console.log('🔄 handleUpdate вызван:', { siteId, name, address, color, status })
            const updated = await updateSite(siteId, name, address, color, status)
            console.log('🔄 updated получен:', updated)
            
            updateSiteInState(updated)
            
            if (selectedSite && selectedSite.id === siteId) {
                setSelectedSite(updated)
            }
            setShowEditModal(false)
        } catch (err) {
            console.error('❌ Ошибка обновления:', err)
            throw err
        }
    }

    const handleDelete = async (siteId) => {
        await deleteSite(siteId)
        removeSiteFromState(siteId)
        // Удаляем запись о последнем открытии
        try {
            const stored = localStorage.getItem('siteLastOpened')
            if (stored) {
                const data = JSON.parse(stored)
                delete data[siteId]
                localStorage.setItem('siteLastOpened', JSON.stringify(data))
            }
        } catch (e) {
            console.warn('Ошибка удаления даты открытия:', e)
        }
    }

    const handleSiteClick = (site) => {
        // Сохраняем дату открытия
        saveLastOpened(site.id)
        
        const container = document.querySelector('.sites-grid')
        if (container) {
            setScrollPosition(container.scrollTop)
        }
        setSelectedSite(site)
    }

    const handleCloseDetail = () => {
        setSelectedSite(null)
        setTimeout(() => {
            const container = document.querySelector('.sites-grid')
            if (container) {
                container.scrollTop = scrollPosition
            }
        }, 50)
    }

    const handleOpenAddModal = () => {
        setShowAddModal(true)
    }

    const handleOpenEditModal = (site) => {
        console.log('🔄 Открываем редактирование для:', site.name)
        setEditingSite(site)
        setShowEditModal(true)
    }

    if (loading) {
        return <div className={globalsStyles.loadingText}>⏳ Загрузка...</div>
    }

    if (error) {
        return (
            <div className={globalsStyles.errorContainer}>
                <div className={globalsStyles.errorIcon}>❌</div>
                <div className={globalsStyles.errorText}>Ошибка загрузки объектов</div>
                <div className={globalsStyles.errorDetail}>{error}</div>
            </div>
        )
    }

    if (selectedSite) {
        return (
            <>
                <SiteDetailPage 
                    site={selectedSite}
                    onClose={handleCloseDetail}
                    onDelete={handleDelete}
                    onEdit={handleOpenEditModal}
                />
                <EditSiteModal 
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleUpdate}
                    site={editingSite}
                />
            </>
        )
    }

    return (
        <>
            <div className={styles.pageHeader}>
                <div>
                    <div className={styles.pageTitle}>
                        <SitesIcon />
                        Объекты
                    </div>
                    <div className={styles.pageSubtitle}>Все объекты</div>
                </div>
            </div>

            {/* === ФИЛЬТР === */}
            <div className={styles.filterWrapper}>
                <span className={styles.filterLabel}>Показывать:</span>
                <div className={styles.filterButtons}>
                    <button 
                        className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`}
                        onClick={() => handleFilterChange('all')}
                    >
                        Все
                    </button>
                    <button 
                        className={`${styles.filterBtn} ${filter === 'active' ? styles.filterActive : ''}`}
                        onClick={() => handleFilterChange('active')}
                    >
                        <span className={styles.filterDot} style={{ backgroundColor: '#2d7d46' }} />
                        В работе
                    </button>
                    <button 
                        className={`${styles.filterBtn} ${filter === 'completed' ? styles.filterActive : ''}`}
                        onClick={() => handleFilterChange('completed')}
                    >
                        <span className={styles.filterDot} style={{ backgroundColor: '#78909C' }} />
                        Завершенные
                    </button>
                </div>
            </div>

            <SitesList 
                sites={sites} 
                filter={filter}
                onSiteClick={handleSiteClick}
            />

            <button 
                className={styles.fabAddSite}
                onClick={handleOpenAddModal}
                aria-label="Добавить объект"
            >
                <Plus size={28} strokeWidth={2.5} />
            </button>

            <AddSiteModal 
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={handleSave}
            />
        </>
    )
}
