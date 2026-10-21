// src/pages/SiteDetailPage.jsx

import { useState, useRef, useEffect, useMemo } from 'react'
import { useShifts } from '../hooks/useShifts'
import { useWorkers } from '../hooks/useWorkers'
import styles from '../styles/sites.module.css'
import compStyles from '../styles/components.module.css'

export function SiteDetailPage({ site, onClose, onArchive, onEdit }) {
    const [showConfirm, setShowConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef(null)

    // === ПОЛУЧАЕМ СМЕНЫ И РАБОТНИКОВ ===
    const { shifts } = useShifts()
    const { workers } = useWorkers()

    // === ФИЛЬТРУЕМ СМЕНЫ ДЛЯ ЭТОГО ОБЪЕКТА ===
    const siteShifts = useMemo(() => {
        if (!shifts || shifts.length === 0) return []
        return shifts.filter(shift => shift.site_id === site.id)
    }, [shifts, site.id])

    // === ВЫЧИСЛЯЕМ ДАТУ НАЧАЛА РАБОТ ===
    const startDate = useMemo(() => {
        if (siteShifts.length === 0) return null
        
        // Находим самую раннюю дату (используем work_date)
        const dates = siteShifts
            .map(shift => shift.work_date)
            .filter(date => date)
            .sort()
        
        return dates.length > 0 ? dates[0] : null
    }, [siteShifts])

    // === СОБИРАЕМ СТАТИСТИКУ ПО СОТРУДНИКАМ ===
    const workersStats = useMemo(() => {
        if (siteShifts.length === 0) return []
        
        // Считаем дни для каждого работника
        const statsMap = new Map()
        
        siteShifts.forEach(shift => {
            if (!shift.worker_id) return
            
            const workerId = shift.worker_id
            if (!statsMap.has(workerId)) {
                statsMap.set(workerId, {
                    workerId,
                    days: 0,
                    dates: new Set()
                })
            }
            
            const stat = statsMap.get(workerId)
            // Добавляем дату (убираем дубликаты в один день)
            if (shift.work_date) {
                stat.dates.add(shift.work_date)
            }
        })
        
        // Преобразуем в массив с количеством дней
        const statsArray = Array.from(statsMap.entries()).map(([workerId, data]) => ({
            workerId,
            days: data.dates.size
        }))
        
        // Сортируем по алфавиту (по имени работника)
        return statsArray.sort((a, b) => {
            const workerA = workers.find(w => w.id === a.workerId)
            const workerB = workers.find(w => w.id === b.workerId)
            
            const nameA = workerA?.name || ''
            const nameB = workerB?.name || ''
            
            return nameA.localeCompare(nameB, 'ru')
        })
    }, [siteShifts, workers])

    // === ФОРМАТИРОВАНИЕ ДАТЫ ===
    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString + 'T00:00:00')
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    // === ФОРМАТИРОВАНИЕ ДАТЫ С МЕСЯЦЕМ ===
    const formatDateWithMonth = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString + 'T00:00:00')
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
    }

    // === ПОЛУЧАЕМ ДАННЫЕ РАБОТНИКА ПО ID ===
    const getWorkerName = (workerId) => {
        const worker = workers.find(w => w.id === workerId)
        return worker?.name || 'Неизвестный'
    }

    const getWorkerAvatar = (workerId) => {
        const worker = workers.find(w => w.id === workerId)
        return worker?.avatar || null
    }

    const getWorkerInitials = (workerId) => {
        const worker = workers.find(w => w.id === workerId)
        if (!worker || !worker.name) return '?'
        const names = worker.name.split(' ')
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase()
        }
        return worker.name.slice(0, 2).toUpperCase()
    }

    // === ГЕНЕРАЦИЯ ЦВЕТА ДЛЯ АВАТАРКИ (на основе имени) ===
    const getColorFromName = (name) => {
        const colors = [
            '#2d7d46', '#1976D2', '#D32F2F', '#F57C00', 
            '#7B1FA2', '#00897B', '#C2185B', '#303F9F',
            '#E64A19', '#388E3C', '#1565C0', '#6D4C41'
        ]
        if (!name) return '#666'
        let hash = 0
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash)
        }
        return colors[Math.abs(hash) % colors.length]
    }

    // === ОБРАБОТЧИКИ ===
    const handleArchive = async () => {
        setDeleting(true)
        try {
            await onArchive(site.id)
            onClose()
        } catch (error) {
            console.error('Ошибка архивации:', error)
            alert(`Не удалось архивировать объект: ${error.message}`)
        } finally {
            setDeleting(false)
            setShowConfirm(false)
        }
    }

    const handleEdit = () => {
        setShowMenu(false)
        if (onEdit) {
            onEdit(site)
        }
    }

    const handleMenuToggle = () => {
        setShowMenu(!showMenu)
    }

    // Закрываем меню при клике вне его
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Получаем статус для отображения
    const getStatusDisplay = (status) => {
        switch (status) {
            case 'в работе':
                return { label: 'В работе', color: '#2d7d46' }
            case 'завершен':
                return { label: 'Завершен', color: '#78909C' }
            default:
                return { label: 'Не указан', color: '#FFB300' }
        }
    }

    const statusDisplay = getStatusDisplay(site.status)

    return (
        <div className={styles.siteDetailPage}>
            {/* === ХЕДЕР === */}
            <div className={styles.siteDetailHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        backgroundColor: site.color || '#2d7d46',
                        flexShrink: 0,
                        border: '2px solid #e8eaed'
                    }} />
                    <span className={styles.siteDetailTitle}>{site.name}</span>
                </div>

                {/* === ТРИ ТОЧКИ (МЕНЮ) === */}
                <div className={styles.siteDetailMenuWrapper} ref={menuRef}>
                    <button 
                        className={styles.siteDetailMenuBtn}
                        onClick={handleMenuToggle}
                        aria-label="Меню"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2.5" />
                            <circle cx="12" cy="12" r="2.5" />
                            <circle cx="12" cy="19" r="2.5" />
                        </svg>
                    </button>

                    {showMenu && (
                        <div className={styles.siteDetailMenu}>
                            <button 
                                className={styles.siteDetailMenuItem}
                                onClick={handleEdit}
                            >
                                <span className={styles.siteDetailMenuItemIcon}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 20h9"/>
                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                    </svg>
                                </span>
                                Редактировать объект
                            </button>
                            <button 
                                className={styles.siteDetailMenuItem}
                                onClick={() => {
                                    setShowMenu(false)
                                    setShowConfirm(true)
                                }}
                            >
                                <span className={styles.siteDetailMenuItemIcon}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </span>
                                Архивировать объект
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* === КОНТЕНТ === */}
            <div className={styles.siteDetailContent}>
                <div className={styles.siteDetailField}>
                    <span className={styles.siteDetailLabel}>Название</span>
                    <span className={styles.siteDetailValue}>{site.name}</span>
                </div>
                
                {site.address && (
                    <div className={styles.siteDetailField}>
                        <span className={styles.siteDetailLabel}>Адрес</span>
                        <span className={styles.siteDetailValue}>{site.address}</span>
                    </div>
                )}
                
                {/* === ДАТА НАЧАЛА РАБОТ (вместо даты создания) === */}
                <div className={styles.siteDetailField}>
                    <span className={styles.siteDetailLabel}>📅 Дата начала работ</span>
                    <span className={styles.siteDetailValue}>
                        {startDate ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{formatDateWithMonth(startDate)}</span>
                                <span style={{ 
                                    fontSize: '13px', 
                                    color: 'var(--text-muted)',
                                    fontWeight: '400'
                                }}>
                                    (первая смена)
                                </span>
                            </span>
                        ) : (
                            <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>
                                Нет данных
                            </span>
                        )}
                    </span>
                </div>

                {/* === СТАТУС === */}
                <div className={styles.siteDetailField}>
                    <span className={styles.siteDetailLabel}>Статус</span>
                    <span className={styles.siteDetailValue}>
                        <span 
                            className={styles.siteDetailStatusBadge}
                            style={{ 
                                backgroundColor: statusDisplay.color,
                                color: statusDisplay.color === '#2d7d46' ? 'white' : '#333'
                            }}
                        >
                            {statusDisplay.label}
                        </span>
                    </span>
                </div>

                {/* === СПИСОК СОТРУДНИКОВ === */}
                <div className={styles.siteDetailWorkersSection}>
                    <div className={styles.siteDetailSectionHeader}>
                        <span className={styles.siteDetailLabel}>👷 Сотрудники</span>
                        <span className={styles.siteDetailWorkersCount}>
                            {workersStats.length} {workersStats.length === 1 ? 'человек' : workersStats.length < 5 ? 'человека' : 'человек'}
                        </span>
                    </div>

                    {workersStats.length > 0 ? (
                        <div className={styles.siteDetailWorkersList}>
                            {workersStats.map((stat) => {
                                const workerName = getWorkerName(stat.workerId)
                                const avatar = getWorkerAvatar(stat.workerId)
                                const initials = getWorkerInitials(stat.workerId)
                                const color = getColorFromName(workerName)
                                
                                return (
                                    <div key={stat.workerId} className={styles.siteDetailWorkerItem}>
                                        <div 
                                            className={styles.siteDetailWorkerAvatar} 
                                            style={{ backgroundColor: color }}
                                        >
                                            {avatar ? (
                                                <img 
                                                    src={avatar} 
                                                    alt={workerName}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            ) : (
                                                initials
                                            )}
                                        </div>
                                        <div className={styles.siteDetailWorkerInfo}>
                                            <span className={styles.siteDetailWorkerName}>
                                                {workerName}
                                            </span>
                                            <span className={styles.siteDetailWorkerDays}>
                                                {stat.days} {stat.days === 1 ? 'день' : stat.days < 5 ? 'дня' : 'дней'}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className={styles.siteDetailEmptyWorkers}>
                            <span className={styles.siteDetailEmptyIcon}>👷</span>
                            <span>Нет сотрудников</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                На этом объекте пока нет смен
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* === КНОПКА "ЗАКРЫТЬ" ВНИЗУ === */}
            <div className={styles.siteDetailFooter}>
                <button 
                    className={styles.siteDetailCloseBtn}
                    onClick={onClose}
                >
                    Закрыть
                </button>
            </div>

            {/* === ПОДТВЕРЖДЕНИЕ АРХИВАЦИИ === */}
            {showConfirm && (
                <div className={compStyles.confirmOverlay}>
                    <div className={compStyles.confirmModal}>
                        <div className={compStyles.confirmIconWrapper}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                        </div>
                        <div className={compStyles.confirmTitle}>Архивировать объект?</div>
                        <div className={compStyles.confirmText}>
                            Вы уверены, что хотите архивировать объект <strong>«{site.name}»</strong>?
                            <br />
                            <span style={{ fontSize: '13px', color: '#999' }}>
                                Объект будет перемещён в архив.
                            </span>
                        </div>
                        <div className={compStyles.confirmButtons}>
                            <button 
                                className={`${compStyles.confirmBtn} ${compStyles.cancel}`}
                                onClick={() => setShowConfirm(false)}
                                disabled={deleting}
                            >
                                Отмена
                            </button>
                            <button 
                                className={`${compStyles.confirmBtn} ${compStyles.delete}`}
                                onClick={handleArchive}
                                disabled={deleting}
                            >
                                {deleting ? 'Архивация...' : 'Архивировать'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}