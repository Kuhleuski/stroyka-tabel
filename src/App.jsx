import { useState } from 'react'
import { useShifts } from './hooks/useShifts'
import { useAuth, AuthProvider } from './context/AuthContext'
import { Header } from './components/Layout/Header'
import { BottomNav } from './components/Layout/BottomNav'
import { MainPage } from './pages/MainPage'
import { SitesPage } from './pages/SitesPage'
import { WorkersPage } from './pages/WorkersPage'
import { MyTabelPage } from './pages/MyTabelPage'
import { SalaryPage } from './pages/SalaryPage'
import { ExtraPage } from './pages/ExtraPage'
import { LoginPage } from './pages/LoginPage'
import { SettingsPage } from './pages/SettingsPage'
import './App.css'

function AppContent() {
    const [currentPage, setCurrentPage] = useState('calendar')
    const [showSettings, setShowSettings] = useState(false)
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

    if (showSettings) {
        return (
            <div className="app">
                <Header onLogout={logout} onSettings={() => setShowSettings(true)} />
                <div className="container">
                    <SettingsPage 
                        onClose={() => setShowSettings(false)}
                        onLogout={logout}
                    />
                </div>
            </div>
        )
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'my-tabel':
                return <MyTabelPage />
            case 'calendar':
                return <MainPage shifts={shifts} loading={loading} />
            case 'sites':
                return <SitesPage />
            case 'workers':
                return <WorkersPage shifts={shifts} />
            case 'salary':
                return <SalaryPage />
            case 'extra':
                return <ExtraPage />
            default:
                return <MainPage shifts={shifts} loading={loading} />
        }
    }

    return (
        <div className="app">
            <Header onLogout={logout} onSettings={() => setShowSettings(true)} />
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
