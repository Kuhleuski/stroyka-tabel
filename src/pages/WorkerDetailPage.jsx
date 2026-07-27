// src/pages/WorkerDetailPage.jsx

import { useState, useRef, useEffect } from 'react'
import { WorkerCalendar } from '../components/Workers/WorkerCalendar'
import { useAvatars } from '../context/AvatarContext'
import { updateWorkerStatus } from '../services/supabase'
import styles from '../styles/workers.module.css'
import compStyles from '../styles/components.module.css'

export function WorkerDetailPage({ worker, onClose, onDelete, shifts, onEdit, onStatusChange }) {
    const [showConfirm, setShowConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [status, setStatus] = useState(worker.status || 'active')
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const menuRef = useRef(null)
    const { getAvatar } = useAvatars()

    // Функция для получения цвета аватарки на основе имени
    const getAvatarColor = (name) => {
        const colors = ['#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#FDD835', '#FFB300', '#FB8C00', '#F4511E', '#6D4C41', '#78909C']
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return colors[index % colors.length]
    }

    // Функция для получения инициалов
    const getInitials = (name) => {
        if (!name) return '?'
        const parts = name.trim().split(' ')
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    }

    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await onDelete(worker.id)
            onClose()
        } catch (error) {
            console.error('Ошибка удаления:', error)
            alert('Не удалось удалить работника')
        } finally {
            setDeleting(false)
            setShowConfirm(false)
        }
    }

    const handleEdit = () => {
        setShowMenu(false)
        if (onEdit) {
            onEdit(worker)
        }
    }

    const handleMenuToggle = () => {
        setShowMenu(!showMenu)
    }

    // === ОБРАБОТЧИК ИЗМЕНЕНИЯ СТАТУСА ===
    const handleStatusChange = async (newStatus) => {
        if (newStatus === status || isUpdatingStatus) return
        
        setIsUpdatingStatus(true)
        try {
            const updated = await updateWorkerStatus(worker.id, newStatus)
            setStatus(newStatus)
            // Обновляем данные в родителе
            if (onStatusChange) {
                onStatusChange({ ...worker, status: newStatus })
            }
        } catch (error) {
            console.error('Ошибка обновления статуса:', error)
            alert('Не удалось обновить статус')
        } finally {
            setIsUpdatingStatus(false)
        }
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

    // Обновляем статус при изменении worker
    useEffect(() => {
        if (worker.status) {
            setStatus(worker.status)
        }
    }, [worker.status])

    // Фильтруем смены только для этого работника
    const workerShifts = shifts ? shifts.filter(s => s.worker_name === worker.name) : []

    // === ПОЛУЧАЕМ АВАТАРКУ ИЗ КОНТЕКСТА ===
    const avatarUrl = getAvatar(worker.name)
    const hasPhoto = !!avatarUrl
    const initials = getInitials(worker.name)
    const avatarColor = getAvatarColor(worker.name)

    return (
        <div className={styles.workerDetailPage}>
            {/* === ХЕДЕР === */}
            <div className={styles.workerDetailHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    {/* КНОПКА НАЗАД */}
                    <button 
                        className={styles.workerDetailBackBtn}
                        onClick={onClose}
                        aria-label="Назад"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>

                    {/* АВАТАРКА */}
                    <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        backgroundColor: hasPhoto ? 'transparent' : avatarColor,
                        border: hasPhoto ? '2px solid #e8eaed' : 'none',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        fontWeight: 600,
                        color: 'white',
                        flexShrink: 0
                    }}>
                        {hasPhoto ? (
                            <img 
                                src={avatarUrl} 
                                alt={worker.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: '50%'
                                }}
                                onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.parentNode.style.backgroundColor = avatarColor
                                    e.target.parentNode.style.border = 'none'
                                    e.target.parentNode.textContent = initials
                                }}
                            />
                        ) : (
                            initials
                        )}
                    </div>
                    <span className={styles.workerDetailTitle}>{worker.name}</span>
                </div>

                {/* === ТРИ ТОЧКИ (МЕНЮ) === */}
                <div className={styles.workerDetailMenuWrapper} ref={menuRef}>
                    <button 
                        className={styles.workerDetailMenuBtn}
                        onClick={handleMenuToggle}
                        aria-label="Меню"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2.5" />
                            <circle cx="12" cy="12" r="2.5" />
                            <circle cx="12" cy="19" r="2.5" />
                        </svg>
                    </button>

                    {/* ВЫПАДАЮЩЕЕ МЕНЮ */}
                    {showMenu && (
                        <div className={styles.workerDetailMenu}>
                            <button 
                                className={styles.workerDetailMenuItem}
                                onClick={handleEdit}
                            >
                                <span className={styles.workerDetailMenuItemIcon}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 20h9"/>
                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                    </svg>
                                </span>
                                Редактировать инфо
                            </button>
                            <button 
                                className={styles.workerDetailMenuItem}
                                onClick={() => {
                                    setShowMenu(false)
                                    setShowConfirm(true)
                                }}
                            >
                                <span className={styles.workerDetailMenuItemIcon}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                </span>
                                Удалить работника
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* === СТАТУС (ПЕРЕКЛЮЧАТЕЛЬ) === */}
            <div className={styles.workerStatusSection}>
                <div className={styles.workerStatusLabel}>Статус</div>
                <div className={styles.workerStatusToggle}>
                    <button 
                        className={`${styles.workerStatusBtn} ${status === 'active' ? styles.workerStatusActive : ''}`}
                        onClick={() => handleStatusChange('active')}
                        disabled={isUpdatingStatus}
                    >
                        <span className={styles.workerStatusDot} style={{ backgroundColor: '#2d7d46' }} />
                        Активен
                    </button>
                    <button 
                        className={`${styles.workerStatusBtn} ${status === 'inactive' ? styles.workerStatusActive : ''}`}
                        onClick={() => handleStatusChange('inactive')}
                        disabled={isUpdatingStatus}
                    >
                        <span className={styles.workerStatusDot} style={{ backgroundColor: '#78909C' }} />
                        Неактивен
                    </button>
                </div>
                {isUpdatingStatus && (
                    <span className={styles.workerStatusUpdating}>Обновление...</span>
                )}
            </div>
            
            {/* === КОНТЕНТ === */}
            <div className={styles.workerDetailContent}>
                <div className={styles.workerDetailField}>
                    <span className={styles.workerDetailLabel}>Имя</span>
                    <span className={styles.workerDetailValue}>{worker.name}</span>
                </div>
                
                <div className={styles.workerDetailField}>
                    <span className={styles.workerDetailLabel}>Дата добавления</span>
                    <span className={styles.workerDetailValue}>{formatDate(worker.created_at)}</span>
                </div>

                {/* Календарь */}
                <div className={styles.workerDetailCalendarSection}>
                    <div className={styles.workerDetailSectionTitle}>📅 График работы</div>
                    <WorkerCalendar 
                        shifts={workerShifts} 
                        workerName={worker.name}
                    />
                </div>
                
                <div className={styles.workerDetailHint}>
                    Здесь будет статистика по работнику
                </div>
            </div>

            {/* === КНОПКА "ЗАКРЫТЬ" ВНИЗУ (ФИКСИРОВАННАЯ) === */}
            <div className={styles.workerDetailFooter}>
                <button 
                    className={styles.workerDetailCloseBtn}
                    onClick={onClose}
                >
                    Закрыть
                </button>
            </div>

            {/* === ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ === */}
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
                        <div className={compStyles.confirmTitle}>Удалить работника?</div>
                        <div className={compStyles.confirmText}>
                            Вы уверены, что хотите удалить работника <strong>«{worker.name}»</strong>?
                            <br />
                            <span style={{ fontSize: '13px', color: '#999' }}>
                                Это действие нельзя отменить.
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
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? 'Удаление...' : 'Удалить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
