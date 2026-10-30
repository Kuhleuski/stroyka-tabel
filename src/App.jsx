import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useShifts } from './hooks/useShifts'
import { useAuth, AuthProvider } from './context/AuthContext'
import { AvatarProvider } from './context/AvatarContext'
import { BottomNav } from './components/Layout/BottomNav'
import { SitesPage } from './pages/SitesPage'
import { WorkersPage } from './pages/WorkersPage'
import { MyTabelPage } from './pages/MyTabelPage'
import { SalaryPage } from './pages/SalaryPage'
import { ExtraPage } from './pages/ExtraPage'
import { LoginPage } from './pages/LoginPage'
import { StatisticsPage } from './pages/StatisticsPage'
import { CostsPage } from './pages/CostsPage'
import { ArchivePage } from './pages/ArchivePage'
import { MenuPage } from './pages/MenuPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { TelegramPage } from './pages/TelegramPage'
import { ProfilePage } from './pages/ProfilePage'
import { WorkersStatsPage } from './pages/WorkersStatsPage'
import TestPage from './pages/TestPage'
import layoutStyles from './styles/layout.module.css'

// ⭐ Слайд для страниц из меню: быстрый, чёткий (tween)
const slideInRight = {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
    transition: { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.22 }
}

// Для обычных страниц — без визуальной анимации, но motion.div нужен,
// чтобы AnimatePresence мог отслеживать смену key и проигрывать exit уходящей страницы
const noAnimation = {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 },
    transition: { duration: 0 }
}

function AppContent() {
    const [currentPage, setCurrentPage] = useState('tabel')
    const [pageKey, setPageKey] = useState(0)

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

    const handleNavigate = (page) => {
        setCurrentPage(page)
        if (page === 'tabel' || page === 'calendar') {
            setPageKey(prev => prev + 1)
            refetch()
        }
    }

    const handleOpenWorkerStats = () => {
        setHideBottomNav(true)
    }

    const handleCloseWorkerStats = () => {
        setHideBottomNav(false)
        refetch()
    }

    // === SiteDetail: скрыть/показать BottomNav ===
    const handleOpenSiteDetail = () => {
        setHideBottomNav(true)
    }

    const handleCloseSiteDetail = () => {
        setHideBottomNav(false)
    }

const menuPages = ['archive', 'notifications', 'telegram', 'profile']

const pagesWithoutBottomNav = ['workers-stats', 'notifications', 'telegram', 'archive', 'profile']
    const renderPageContent = () => {
        switch (currentPage) {
            case 'tabel':
            case 'calendar':
                return <TestPage key={`tabel-${pageKey}`} />
            case 'statistics':
                return <StatisticsPage key={`statistics-${pageKey}`} />
            case 'workers':
                return <WorkersPage
                    key={`workers-${pageKey}`}
                    shifts={shifts}
                    onOpenWorkerStats={handleOpenWorkerStats}
                    onCloseWorkerStats={handleCloseWorkerStats}
                />
            case 'sites':
                return <SitesPage
                    key={`sites-${pageKey}`}
                    shifts={shifts}
                    onOpenSiteDetail={handleOpenSiteDetail}
                    onCloseSiteDetail={handleCloseSiteDetail}
                />
            case 'menu':
                return <MenuPage
                    key={`menu-${pageKey}`}
                    onNavigate={handleNavigate}
                />
            case 'archive':
                return (
                    <ArchivePage
                        key={`archive-${pageKey}`}
                        onBack={() => handleNavigate('menu')}
                    />
                )
            case 'notifications':
                return (
                    <NotificationsPage
                        key={`notifications-${pageKey}`}
                        onBack={() => handleNavigate('menu')}
                    />
                )
            case 'telegram':
                return (
                    <TelegramPage
                        key={`telegram-${pageKey}`}
                        onBack={() => handleNavigate('menu')}
                    />
                )
            case 'profile':
                return (
                    <ProfilePage
                        key={`profile-${pageKey}`}
                        onBack={() => handleNavigate('menu')}
                        onLogout={logout}
                    />
                )
            
            case 'workers-stats':
                return <WorkersStatsPage key={`workers-stats-${pageKey}`} />
            case 'salary':
                return <SalaryPage key={`salary-${pageKey}`} />
            case 'costs':
                return <CostsPage key={`costs-${pageKey}`} />
            case 'my-tabel':
                return <MyTabelPage key={`my-tabel-${pageKey}`} shifts={shifts} />
            case 'extra':
                return <ExtraPage key={`extra-${pageKey}`} />
            default:
                return <TestPage key={`tabel-${pageKey}`} />
        }
    }

    const renderPage = () => {
        const pageContent = renderPageContent()
        const isMenuPage = menuPages.includes(currentPage)
        const animation = isMenuPage ? slideInRight : noAnimation

        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentPage}
                    initial={animation.initial}
                    animate={animation.animate}
                    exit={animation.exit}
                    transition={animation.transition}
                    className={layoutStyles.pageWrapper}
                >
                    {pageContent}
                </motion.div>
            </AnimatePresence>
        )
    }

    const shouldShowBottomNav = !hideBottomNav && !pagesWithoutBottomNav.includes(currentPage)

    return (
        <div className={layoutStyles.app}>
            <div className="container">
                {renderPage()}
            </div>

            {shouldShowBottomNav && (
                <BottomNav
                    currentPage={currentPage}
                    onNavigate={handleNavigate}
                />
            )}
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