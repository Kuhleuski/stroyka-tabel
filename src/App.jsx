import { useState, useEffect } from 'react'
import { useShifts } from './hooks/useShifts'
import { useAuth, AuthProvider } from './context/AuthContext'
import { AvatarProvider } from './context/AvatarContext'
import { Header } from './components/Layout/Header'
import { BottomNav } from './components/Layout/BottomNav'
import { SettingsModal } from './components/SettingsModal'
import { SitesPage } from './pages/SitesPage'
import { WorkersPage } from './pages/WorkersPage'
import { MyTabelPage } from './pages/MyTabelPage'
import { SalaryPage } from './pages/SalaryPage'
import { ExtraPage } from './pages/ExtraPage'
import { LoginPage } from './pages/LoginPage'
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
    
    // ⭐ НОВОЕ: состояние для скрытия BottomNav
    const [hideBottomNav, setHideBottomNav] = useState(false)
    
    const { shifts, loading, error, refetch } = useShifts()
    const { user, loginByPhone, logout } = useAuth()

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'dark')
    }, [])

    if (!user) {
        return <LoginPage onLogin={loginByPhone} />
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

    // ⭐ НОВЫЕ: функции для управления BottomNav
    const handleOpenWorkerStats = () => {
        setHideBottomNav(true)
    }

    const handleCloseWorkerStats = () => {
        setHideBottomNav(false)
        // Обновляем данные при закрытии
        refetch()
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'my-tabel':
                return <MyTabelPage key={`my-tabel-${pageKey}`} shifts={shifts} />
            case 'calendar':
                return <TestPage key={`calendar-${pageKey}`} />
            case 'sites':
                return <SitesPage key={`sites-${pageKey}`} />
            case 'workers':
                return <WorkersPage 
                    key={`workers-${pageKey}`} 
                    shifts={shifts}
                    onOpenWorkerStats={handleOpenWorkerStats}   // ← передаем
                    onCloseWorkerStats={handleCloseWorkerStats} // ← передаем
                />
            case 'salary':
                return <SalaryPage key={`salary-${pageKey}`} />
            case 'extra':
                return <ExtraPage key={`extra-${pageKey}`} />
            case 'statistics':
                return <StatisticsPage key={`statistics-${pageKey}`} />
            case 'costs':
                return <CostsPage key={`costs-${pageKey}`} />
            default:
                return <TestPage key={`calendar-${pageKey}`} />
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
            
            {/* ⭐ ПОКАЗЫВАЕМ BottomNav ТОЛЬКО если не скрыт */}
            {!hideBottomNav && (
                <BottomNav 
                    currentPage={currentPage} 
                    onNavigate={handleNavigate}
                />
            )}

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