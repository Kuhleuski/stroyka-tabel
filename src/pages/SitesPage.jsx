import { SitesList } from '../components/Sites/SitesList'

export function SitesPage({ shifts, loading }) {
    if (loading) {
        return <div className="loading-text">⏳ Загрузка...</div>
    }

    return (
        <>
            <div className="page-title">🏢 Объекты</div>
            <div className="page-subtitle">Все стройплощадки</div>
            <SitesList shifts={shifts} />
        </>
    )
}