import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import styles from '../styles/my-tabel.module.css'

export function MyTabelPage({ shifts }) {
    const { user } = useAuth()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(null)
    const [showDayDetail, setShowDayDetail] = useState(false)
    const [dayNote, setDayNote] = useState('')

    const roleLabels = {
        admin: 'Администратор',
        worker: 'Работник'
    }

    const getWeekDays = (date) => {
        const day = date.getDay()
        const diff = date.getDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(date)
        monday.setDate(diff)
        
        const week = []
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday)
            d.setDate(monday.getDate() + i)
            week.push(d)
        }
        return week
    }

    const weekDays = getWeekDays(currentDate)

    const changeWeek = (direction) => {
        const newDate = new Date(currentDate)
        newDate.setDate(newDate.getDate() + direction * 7)
        setCurrentDate(newDate)
    }

    const handleDayClick = (date) => {
        setSelectedDate(date)
        setShowDayDetail(true)
        setDayNote('')
    }

    const handleCloseDetail = () => {
        setShowDayDetail(false)
        setSelectedDate(null)
    }

    const formatDate = (date) => {
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

    const siteColors = {
        'Здравушка': '#2d7d46',
        'КХП': '#1a6b8a',
        'Коровники': '#8d6e63',
        'Дом на Ленина, 15': '#6a1b9a',
        'Коттедж в Сосновке': '#c62828',
        'Офис на Мира, 10': '#e65100',
    }

    const getSiteColor = (siteName) => {
        return siteColors[siteName] || '#2d7d46'
    }

    const getDayShifts = (date) => {
        const dateStr = date.toISOString().split('T')[0]
        if (!shifts) return []
        return shifts.filter(s => s.work_date === dateStr && s.worker_name === user.name)
    }

    const isToday = (date) => {
        const today = new Date()
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear()
    }

    const selectedDayShifts = selectedDate ? getDayShifts(selectedDate) : []

    // Детальный просмотр дня
    if (showDayDetail && selectedDate) {
        return (
            <div className={styles.myTabelPage}>
                <div className={styles.myTabelHeader}>
                    <button className={styles.myTabelBackBtn} onClick={handleCloseDetail}>
                        ← Назад
                    </button>
                    <span className={styles.myTabelDetailTitle}>
                        {formatDate(selectedDate)}
                    </span>
                </div>

                <div className={styles.myTabelDetailContent}>
                    <div className={styles.myTabelDetailShifts}>
                        <div className={styles.myTabelDetailLabel}>📍 Объекты</div>
                        {selectedDayShifts.length > 0 ? (
                            selectedDayShifts.map((s, idx) => (
                                <div key={idx} className={styles.myTabelDetailShiftItem}>
                                    <span 
                                        className={styles.myTabelDetailShiftDot}
                                        style={{ background: getSiteColor(s.site_name) }}
                                    />
                                    <span className={styles.myTabelDetailShiftSite}>{s.site_name}</span>
                                    <span className={styles.myTabelDetailShiftHours}>{s.hours} ч.</span>
                                </div>
                            ))
                        ) : (
                            <div className={styles.myTabelDetailEmpty}>В этот день не работал</div>
                        )}
                    </div>

                    <div className={styles.myTabelDetailNote}>
                        <div className={styles.myTabelDetailLabel}>📝 Заметки</div>
                        <textarea
                            className={styles.myTabelDetailTextarea}
                            value={dayNote}
                            onChange={(e) => setDayNote(e.target.value)}
                            placeholder="Добавьте заметку..."
                            rows={3}
                        />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.myTabelPage}>
            <div className={styles.myTabelHeader}>
                <div className={styles.myTabelUserInfo}>
                    <div className={styles.myTabelAvatarSmall}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className={styles.myTabelName}>{user.name}</div>
                        <div className={styles.myTabelRole}>{roleLabels[user.role] || user.role}</div>
                    </div>
                </div>
            </div>

            {/* Неделя */}
            <div className={styles.myTabelWeekSection}>
                <div className={styles.myTabelWeekNav}>
                    <div className={styles.myTabelNavGroup}>
                        <button className={styles.myTabelNavBtn} onClick={() => changeWeek(-1)}>‹</button>
                        <span className={styles.myTabelWeekLabel}>
                            {weekDays[0].getDate()} {monthNames[weekDays[0].getMonth()]} – {weekDays[6].getDate()} {monthNames[weekDays[6].getMonth()]} {weekDays[0].getFullYear()}
                        </span>
                        <button className={styles.myTabelNavBtn} onClick={() => changeWeek(1)}>›</button>
                    </div>
                    <button 
                        className={styles.myTabelTodayBtn}
                        onClick={() => setCurrentDate(new Date())}
                    >
                        Сегодня
                    </button>
                </div>

                <div className={styles.myTabelWeekDays}>
                    {weekDays.map((day, index) => {
                        const dayShifts = getDayShifts(day)
                        const hasShifts = dayShifts.length > 0
                        const today = isToday(day)
                        const isSelected = selectedDate && 
                            day.getDate() === selectedDate.getDate() &&
                            day.getMonth() === selectedDate.getMonth() &&
                            day.getFullYear() === selectedDate.getFullYear()
                        
                        return (
                            <div 
                                key={index}
                                className={`${styles.myTabelWeekDay} ${today ? styles.today : ''} ${isSelected ? styles.selected : ''}`}
                                onClick={() => handleDayClick(day)}
                            >
                                <div className={styles.myTabelWeekDayName}>{dayNames[index]}</div>
                                <div className={styles.myTabelWeekDayNumber}>{day.getDate()}</div>
                                {hasShifts && (
                                    <div className={styles.myTabelWeekDayDots}>
                                        {dayShifts.map((s, idx) => (
                                            <span 
                                                key={idx}
                                                className={styles.myTabelWeekDayDot}
                                                style={{ background: getSiteColor(s.site_name) }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
