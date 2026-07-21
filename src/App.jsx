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
import { NotificationsPage } from './pages/NotificationsPage'
import './App.css'

function AppContent() {
    console.log('🏠 AppContent рендерится')
    
    const [currentPage, setCurrentPage] = useState('calendar')
    const [showSettings, setShowSettings] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [unreadCount, setUnreadCount] = useState(1)
    const [pageKey, setPageKey] = useState(0)
    
    const { shifts, loading, error, refetch } = useShifts()
    const { user, login, logout } = useAuth()

    console.log('🏠 shifts.length в AppContent:', shifts.length)

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

    const handleOpenNotifications = () => {
        setShowNotifications(true)
        setUnreadCount(0)
    }

    const handleNavigate = (page) => {
        console.log('🔄 handleNavigate:', page)
        setCurrentPage(page)
        
        if (page === 'calendar') {
            console.log('🔄 Переход на календарь: обновляем данные')
            setPageKey(prev => {
                const newKey = prev + 1
                console.log('🔄 pageKey:', newKey)
                return newKey
            })
            console.log('🔄 Вызываем refetch()')
            refetch()
        }
    }

    if (showSettings) {
        return (
            <div className="app">
                <Header 
                    onLogout={logout} 
                    onSettings={() => setShowSettings(true)}
                    onNotifications={handleOpenNotifications}
                    unreadCount={unreadCount}
                />
                <div className="container">
                    <SettingsPage 
                        onClose={() => setShowSettings(false)}
                        onLogout={logout}
                    />
                </div>
            </div>
        )
    }

    if (showNotifications) {
        return (
            <div className="app">
                <Header 
                    onLogout={logout} 
                    onSettings={() => setShowSettings(true)}
                    onNotifications={handleOpenNotifications}
                    unreadCount={unreadCount}
                />
                <div className="container">
                    <NotificationsPage onClose={() => setShowNotifications(false)} />
                </div>
            </div>
        )
    }

    const renderPage = () => {
        console.log('📄 renderPage:', currentPage, 'pageKey:', pageKey)
        switch (currentPage) {
            case 'my-tabel':
                return <MyTabelPage key={`my-tabel-${pageKey}`} shifts={shifts} />
            case 'calendar':
                return <MainPage key={`calendar-${pageKey}`} shifts={shifts} loading={loading} refetchShifts={refetch} />
            case 'sites':
                return <SitesPage key={`sites-${pageKey}`} />
            case 'workers':
                return <WorkersPage key={`workers-${pageKey}`} shifts={shifts} />
            case 'salary':
                return <SalaryPage key={`salary-${pageKey}`} />
            case 'extra':
                return <ExtraPage key={`extra-${pageKey}`} />
            default:
                return <MainPage key={`calendar-${pageKey}`} shifts={shifts} loading={loading} refetchShifts={refetch} />
        }
    }

    return (
        <div className="app">
            <Header 
                onLogout={logout} 
                onSettings={() => setShowSettings(true)}
                onNotifications={handleOpenNotifications}
                unreadCount={unreadCount}
            />
            <div className="container">
                {renderPage()}
            </div>
            <BottomNav currentPage={currentPage} onNavigate={handleNavigate} />
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
