import { useState, useEffect } from 'react'
import { useShifts } from './hooks/useShifts'
import { useAuth, AuthProvider } from './context/AuthContext'
import { AvatarProvider } from './context/AvatarContext'
import { Header } from './components/Layout/Header'
import { BottomNav } from './components/Layout/BottomNav'
import { SettingsModal } from './components/SettingsModal'
import { MainPage } from './pages/MainPage'
import { SitesPage } from './pages/SitesPage'
import { WorkersPage } from './pages/WorkersPage'
import { MyTabelPage } from './pages/MyTabelPage'
import { SalaryPage } from './pages/SalaryPage'
import { ExtraPage } from './pages/ExtraPage'
import { LoginPage } from './pages/LoginPage'
// Убираем импорт NotificationsPage
// import { NotificationsPage } from './pages/NotificationsPage'
import { StatisticsPage } from './pages/StatisticsPage'
import { CostsPage } from './pages/CostsPage'
import TestPage from './pages/TestPage'
import layoutStyles from './styles/layout.module.css'

function AppContent() {
    const [currentPage, setCurrentPage] = useState('calendar')
    const [showSettings, setShowSettings] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [unreadCount, setUnreadCount] = useState(1)
    const [pageKey, setPageKey] = useState(0)
    
    const { shifts, loading, error, refetch } = useShifts()
    const { user, login, logout } = useAuth()

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme === 'dark' || savedTheme === 'light') {
            document.documentElement.setAttribute('data-theme', savedTheme)
        }
    }, [])

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

    const handleCloseNotifications = () => {
        setShowNotifications(false)
    }

    const handleNavigate = (page) => {
        if (page === 'settings') {
            setShowSettings(true)
            return
        }
        
        setCurrentPage(page)
        if (page === 'calendar') {
            setPageKey(prev => prev + 1)
            refetch()
        }
    }

    const handleCloseSettings = () => {
        setShowSettings(false)
    }

    const handleOpenSettings = () => {
        setShowSettings(true)
    }

    // Удаляем блок showNotifications, так как теперь уведомления открываются через модалку в Header
    // if (showNotifications) {
    //     return (
    //         <div className={layoutStyles.app}>
    //             <div className="container">
    //                 <NotificationsPage onClose={handleCloseNotifications} />
    //             </div>
    //         </div>
    //     )
    // }

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
            case 'statistics':
                return <StatisticsPage key={`statistics-${pageKey}`} />
            case 'costs':
                return <CostsPage key={`costs-${pageKey}`} />
            case 'test':
                return <TestPage key={`test-${pageKey}`} />
            default:
                return <MainPage key={`calendar-${pageKey}`} shifts={shifts} loading={loading} refetchShifts={refetch} />
        }
    }

    return (
        <div className={layoutStyles.app}>
            <Header 
                onSettings={handleOpenSettings}
                onNotifications={handleOpenNotifications}
                unreadCount={unreadCount}
                userId={user?.id}
            />
            
            <div className="container">
                {renderPage()}
            </div>
            
            <BottomNav 
                currentPage={currentPage} 
                onNavigate={handleNavigate}
            />

            <SettingsModal 
                isOpen={showSettings}
                onClose={handleCloseSettings}
                onLogout={logout}
            />
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