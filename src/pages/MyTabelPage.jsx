import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

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

    const getMonthDays = (year, month) => {
        const firstDay = new Date(year, month, 1)
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const startDayOfWeek = firstDay.getDay() || 7
        
        const days = []
        for (let i = 1; i < startDayOfWeek; i++) {
            days.push({ empty: true })
        }
        
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i)
            const dateStr = date.toISOString().split('T')[0]
            const dayShifts = shifts ? shifts.filter(s => s.work_date === dateStr && s.worker_name === user.name) : []
            
            const sites = {}
            dayShifts.forEach(s => {
                if (!sites[s.site_name]) {
                    sites[s.site_name] = []
                }
                sites[s.site_name].push(s)
            })
            
            days.push({
                date,
                day: i,
                hasShifts: dayShifts.length > 0,
                sites: Object.keys(sites),
                siteColors: Object.keys(sites).map(name => getSiteColor(name))
            })
        }
        return days
    }

    const today = new Date()
    const currentMonthDays = getMonthDays(today.getFullYear(), today.getMonth())
    const prevMonthDays = getMonthDays(today.getFullYear(), today.getMonth() - 1)
    const prevPrevMonthDays = getMonthDays(today.getFullYear(), today.getMonth() - 2)

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
            <div className="my-tabel-page">
                <div className="my-tabel-header">
                    <button className="my-tabel-back-btn" onClick={handleCloseDetail}>
                        ← Назад
                    </button>
                    <span className="my-tabel-detail-title">
                        {formatDate(selectedDate)}
                    </span>
                </div>

                <div className="my-tabel-detail-content">
                    <div className="my-tabel-detail-shifts">
                        <div className="my-tabel-detail-label">📍 Объекты</div>
                        {selectedDayShifts.length > 0 ? (
                            selectedDayShifts.map((s, idx) => (
                                <div key={idx} className="my-tabel-detail-shift-item">
                                    <span 
                                        className="my-tabel-detail-shift-dot"
                                        style={{ background: getSiteColor(s.site_name) }}
                                    />
                                    <span className="my-tabel-detail-shift-site">{s.site_name}</span>
                                    <span className="my-tabel-detail-shift-hours">{s.hours} ч.</span>
                                </div>
                            ))
                        ) : (
                            <div className="my-tabel-detail-empty">В этот день не работал</div>
                        )}
                    </div>

                    <div className="my-tabel-detail-note">
                        <div className="my-tabel-detail-label">📝 Заметки</div>
                        <textarea
                            className="my-tabel-detail-textarea"
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
        <div className="my-tabel-page">
            <div className="my-tabel-header">
                <div className="my-tabel-user-info">
                    <div className="my-tabel-avatar-small">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="my-tabel-name">{user.name}</div>
                        <div className="my-tabel-role">{roleLabels[user.role] || user.role}</div>
                    </div>
                </div>
            </div>

            {/* Неделя */}
            <div className="my-tabel-week-section">
                <div className="my-tabel-week-nav">
                    <div className="my-tabel-nav-group">
                        <button className="my-tabel-nav-btn" onClick={() => changeWeek(-1)}>‹</button>
                        <span className="my-tabel-week-label">
                            {weekDays[0].getDate()} {monthNames[weekDays[0].getMonth()]} – {weekDays[6].getDate()} {monthNames[weekDays[6].getMonth()]} {weekDays[0].getFullYear()}
                        </span>
                        <button className="my-tabel-nav-btn" onClick={() => changeWeek(1)}>›</button>
                    </div>
                    <button 
                        className="my-tabel-today-btn"
                        onClick={() => setCurrentDate(new Date())}
                    >
                        Сегодня
                    </button>
                </div>

                <div className="my-tabel-week-days">
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
                                className={`my-tabel-week-day ${today ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleDayClick(day)}
                            >
                                <div className="my-tabel-week-day-name">{dayNames[index]}</div>
                                <div className="my-tabel-week-day-number">{day.getDate()}</div>
                                {hasShifts && (
                                    <div className="my-tabel-week-day-dots">
                                        {dayShifts.map((s, idx) => (
                                            <span 
                                                key={idx}
                                                className="my-tabel-week-day-dot"
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

            {/* Мини-календарь на 3 месяца */}
            <div className="my-tabel-mini-calendar">
                <div className="my-tabel-mini-month">
                    <div className="my-tabel-mini-month-label">
                        {monthNames[today.getMonth() - 2]} {today.getFullYear()}
                    </div>
                    <div className="my-tabel-mini-grid">
                        {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
                            <div key={d} className="my-tabel-mini-label">{d}</div>
                        ))}
                        {prevPrevMonthDays.map((day, idx) => (
                            <div key={idx} className={`my-tabel-mini-cell ${day.hasShifts ? 'has-shifts' : 'empty'}`}>
                                {!day.empty && (
                                    <>
                                        <span className="my-tabel-mini-day">{day.day}</span>
                                        {day.hasShifts && day.siteColors.length > 0 && (
                                            <div className="my-tabel-mini-dots">
                                                {day.siteColors.slice(0, 3).map((color, i) => (
                                                    <span key={i} className="my-tabel-mini-dot" style={{ background: color }} />
                                                ))}
                                                {day.siteColors.length > 3 && (
                                                    <span className="my-tabel-mini-dot-more">+{day.siteColors.length - 3}</span>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="my-tabel-mini-month">
                    <div className="my-tabel-mini-month-label">
                        {monthNames[today.getMonth() - 1]} {today.getFullYear()}
                    </div>
                    <div className="my-tabel-mini-grid">
                        {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
                            <div key={d} className="my-tabel-mini-label">{d}</div>
                        ))}
                        {prevMonthDays.map((day, idx) => (
                            <div key={idx} className={`my-tabel-mini-cell ${day.hasShifts ? 'has-shifts' : 'empty'}`}>
                                {!day.empty && (
                                    <>
                                        <span className="my-tabel-mini-day">{day.day}</span>
                                        {day.hasShifts && day.siteColors.length > 0 && (
                                            <div className="my-tabel-mini-dots">
                                                {day.siteColors.slice(0, 3).map((color, i) => (
                                                    <span key={i} className="my-tabel-mini-dot" style={{ background: color }} />
                                                ))}
                                                {day.siteColors.length > 3 && (
                                                    <span className="my-tabel-mini-dot-more">+{day.siteColors.length - 3}</span>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="my-tabel-mini-month current">
                    <div className="my-tabel-mini-month-label">
                        {monthNames[today.getMonth()]} {today.getFullYear()}
                    </div>
                    <div className="my-tabel-mini-grid">
                        {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
                            <div key={d} className="my-tabel-mini-label">{d}</div>
                        ))}
                        {currentMonthDays.map((day, idx) => (
                            <div key={idx} className={`my-tabel-mini-cell ${day.hasShifts ? 'has-shifts' : ''}`}>
                                {!day.empty && (
                                    <>
                                        <span className="my-tabel-mini-day">{day.day}</span>
                                        {day.hasShifts && day.siteColors.length > 0 && (
                                            <div className="my-tabel-mini-dots">
                                                {day.siteColors.slice(0, 3).map((color, i) => (
                                                    <span key={i} className="my-tabel-mini-dot" style={{ background: color }} />
                                                ))}
                                                {day.siteColors.length > 3 && (
                                                    <span className="my-tabel-mini-dot-more">+{day.siteColors.length - 3}</span>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
