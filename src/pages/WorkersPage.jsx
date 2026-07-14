import { WorkersList } from '../components/Workers/WorkersList'

export function WorkersPage({ shifts, loading }) {
    if (loading) {
        return <div className="loading-text">⏳ Загрузка...</div>
    }

    return (
        <>
            <div className="page-title">👷 Бригада</div>
            <div className="page-subtitle">Все рабочие</div>
            <WorkersList shifts={shifts} />
        </>
    )
}