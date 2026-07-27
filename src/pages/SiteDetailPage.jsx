// src/pages/SiteDetailPage.jsx

import { useState, useRef, useEffect } from 'react'
import styles from '../styles/sites.module.css'
import compStyles from '../styles/components.module.css'

export function SiteDetailPage({ site, onClose, onDelete, onEdit }) {
    const [showConfirm, setShowConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef(null)

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
            await onDelete(site.id)
            onClose()
        } catch (error) {
            console.error('Ошибка удаления:', error)
            alert(`Не удалось удалить объект: ${error.message}`)
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
                    {/* ЦВЕТНОЙ КРУГ */}
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

                    {/* ВЫПАДАЮЩЕЕ МЕНЮ */}
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
                                        <path d="M3 6h18"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                </span>
                                Удалить объект
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
                
                <div className={styles.siteDetailField}>
                    <span className={styles.siteDetailLabel}>Дата создания</span>
                    <span className={styles.siteDetailValue}>{formatDate(site.created_at)}</span>
                </div>

                {/* === СТАТУС (ТОЛЬКО ОТОБРАЖЕНИЕ) === */}
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
                
                <div className={styles.siteDetailHint}>
                    Здесь будет статистика по объекту
                </div>
            </div>

            {/* === КНОПКА "ЗАКРЫТЬ" ВНИЗУ (ФИКСИРОВАННАЯ) === */}
            <div className={styles.siteDetailFooter}>
                <button 
                    className={styles.siteDetailCloseBtn}
                    onClick={onClose}
                >
                    Закрыть
                </button>
            </div>

            {/* === ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ === */}
            {showConfirm && (
                <div className={compStyles.confirmOverlay}>
                    <div className={compStyles.confirmModal}>
                        <div className={compStyles.confirmIcon}>⚠️</div>
                        <div className={compStyles.confirmTitle}>Удалить объект?</div>
                        <div className={compStyles.confirmText}>
                            Вы уверены, что хотите удалить объект <strong>«{site.name}»</strong>?
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
