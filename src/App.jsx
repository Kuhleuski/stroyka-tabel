import { useState } from 'react'
import { useShifts } from './hooks/useShifts'
import { useAuth, AuthProvider } from './context/AuthContext'
import { AvatarProvider } from './context/AvatarContext'
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
import layoutStyles from './styles/layout.module.css'
import compStyles from './styles/components.module.css'

function AppContent() {
    const [currentPage, setCurrentPage] = useState('calendar')
    const [showSettings, setShowSettings] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [unreadCount, setUnreadCount] = useState(1)
    const [pageKey, setPageKey] = useState(0)
    
    const { shifts, loading, error, refetch } = useShifts()
    const { user, login, logout } = useAuth()

    if (!user) {
        return <LoginPage onLogin={login} />
    }

    if (error) {
        return (
            <div className={globalsStyles.errorContainer}>
                <div className={globalsStyles.errorIcon}>❌</div>
                <div className={globalsStyles.errorText}>Ошибка загрузки данных</div>
                <div className={globalsStyles.errorDetail}>{error}</div>
            </div>
        )
    }

    const handleOpenNotifications = () => {
        setShowNotifications(true)
        setUnreadCount(0)
    }

    const handleNavigate = (page) => {
        setCurrentPage(page)
        if (page === 'calendar') {
            setPageKey(prev => prev + 1)
            refetch()
        }
    }

    if (showSettings) {
        return (
            <div className={layoutStyles.app}>
                <Header 
                    onLogout={logout} 
                    onSettings={() => setShowSettings(true)}
                    onNotifications={handleOpenNotifications}
                    unreadCount={unreadCount}
                />
                <div className={globalsStyles.container}>
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
            <div className={layoutStyles.app}>
                <Header 
                    onLogout={logout} 
                    onSettings={() => setShowSettings(true)}
                    onNotifications={handleOpenNotifications}
                    unreadCount={unreadCount}
                />
                <div className={globalsStyles.container}>
                    <NotificationsPage onClose={() => setShowNotifications(false)} />
                </div>
            </div>
        )
    }

    const renderPage = () => {
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
        <div className={layoutStyles.app}>
            <Header 
                onLogout={logout} 
                onSettings={() => setShowSettings(true)}
                onNotifications={handleOpenNotifications}
                unreadCount={unreadCount}
            />
            <div className={globalsStyles.container}>
                {renderPage()}
            </div>
            <BottomNav currentPage={currentPage} onNavigate={handleNavigate} />
        </div>
    )
}

function App() {
    return (
        <AuthProvider>
            <AvatarProvider>
                <AppContent />
            </AvatarProvider>
        </AuthProvider>
    )
}

export default App
