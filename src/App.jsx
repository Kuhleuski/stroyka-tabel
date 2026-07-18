import { useState } from 'react'
import { useShifts } from './hooks/useShifts'
import { useAuth, AuthProvider } from './context/AuthContext'
import { Header } from './components/Layout/Header'
import { BottomNav } from './components/Layout/BottomNav'
import { MainPage } from './pages/MainPage'
import { SitesPage } from './pages/SitesPage'
import { WorkersPage } from './pages/WorkersPage'
import { LoginPage } from './pages/LoginPage'
import './App.css'

function AppContent() {
    const [currentPage, setCurrentPage] = useState('main')
    const { shifts, loading, error } = useShifts()
    const { user, login, logout } = useAuth()

    if (!user) {
        return <LoginPage onLogin={login} />
    }

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
            <Header onLogout={logout} />
            <div className="container">
                {renderPage()}
            </div>
            <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
        </div>
    )
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    )
}

export default App
