import { useState } from 'react'
import { useShifts } from './hooks/useShifts'
import { Header } from './components/Layout/Header'
import { BottomNav } from './components/Layout/BottomNav'
import { MainPage } from './pages/MainPage'
import { SitesPage } from './pages/SitesPage'
import { WorkersPage } from './pages/WorkersPage'
import './App.css'

function App() {
    const [currentPage, setCurrentPage] = useState('main')
    const { shifts, loading, error } = useShifts()

    if (error) {
        return (
            <div className="error-container">
                <div className="error-icon">❌</div>
                <div className="error-text">Ошибка загрузки данных</div>
                <div className="error-detail">{error}</div>
            </div>
        )
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'sites':
                return <SitesPage />
            case 'workers':
                return <WorkersPage shifts={shifts} />
            default:
                return <MainPage shifts={shifts} loading={loading} />
        }
    }

    return (
        <div className="app">
            <Header />
            <div className="container">
                {renderPage()}
            </div>
            <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
        </div>
    )
}

export default App
