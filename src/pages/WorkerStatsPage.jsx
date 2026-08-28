import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAvatars } from '../context/AvatarContext'
import { updateWorkerStatus } from '../services/supabase'
import { formatDateLocal } from '../utils/dateHelpers'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ru } from 'date-fns/locale'
import styles from '../styles/workerStats.module.css'
import { WorkerStatsFooter } from '../components/WorkerStatsFooter'

export function WorkerStatsPage({ worker, shifts, sites, archivedSites = [], onClose, onEdit, onRefresh }) {
    const { getAvatar } = useAvatars()
    const [activeTab, setActiveTab] = useState('month')
    
    const [status, setStatus] = useState(worker?.status || 'active')
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [periodStart, setPeriodStart] = useState(null)
    const [periodEnd, setPeriodEnd] = useState(null)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [direction, setDirection] = useState(0)
    const [expandedSites, setExpandedSites] = useState(new Set())
    const [isDetailVisible, setIsDetailVisible] = useState(true)
    
    // ⭐ Для переключения режима вкладки "Рабочие дни"
    const [workPeriodMode, setWorkPeriodMode] = useState('month') // 'month' | 'quarter' | 'all'
    
    // ⭐ Для фильтра объектов
    const [sitesFilterMode, setSitesFilterMode] = useState('all')
    const [showPeriodModal, setShowPeriodModal] = useState(false)
    const [sitesPeriodStart, setSitesPeriodStart] = useState('')
    const [sitesPeriodEnd, setSitesPeriodEnd] = useState('')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)

    // ⭐ Для DatePicker
    const [tempStartDate, setTempStartDate] = useState(null)
    const [tempEndDate, setTempEndDate] = useState(null)
    
    const monthKeyRef = useRef(0)
    const isFirstRenderRef = useRef(true)
    const detailTimerRef = useRef(null)

// ⭐ Для квартала (от текущего месяца — три месяца назад)
const [currentQuarterStart, setCurrentQuarterStart] = useState(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    // От текущего месяца отнимаем 2, чтобы получить начало квартала (3 месяца назад)
    const quarterStartMonth = currentMonth - 2
    const year = now.getFullYear()
    // Корректировка для перехода через год
    if (quarterStartMonth < 0) {
        return new Date(year - 1, 12 + quarterStartMonth, 1)
    }
    return new Date(year, quarterStartMonth, 1)
})
    const [quarterDirection, setQuarterDirection] = useState(0)
    const [isQuarterDetailVisible, setIsQuarterDetailVisible] = useState(true)
    const quarterKeyRef = useRef(0)
    const quarterTimerRef = useRef(null)

    const avatarUrl = getAvatar(worker?.name)
    const hasPhoto = !!avatarUrl
    const initials = worker?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
    const avatarColor = useMemo(() => {
        const colors = ['#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#FDD835', '#FFB300', '#FB8C00', '#F4511E', '#6D4C41', '#78909C']
        const index = (worker?.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return colors[index % colors.length]
    }, [worker?.name])

    // === ОБЪЕДИНЯЕМ ВСЕ ОБЪЕКТЫ (активные + архивные) ===
    const allSites = useMemo(() => {
        return [...sites, ...archivedSites]
    }, [sites, archivedSites])

    useEffect(() => {
        if (isFirstRenderRef.current) {
            const timer = setTimeout(() => {
                isFirstRenderRef.current = false
            }, 50)
            return () => clearTimeout(timer)
        }
    }, [])

    useEffect(() => {
        return () => {
            if (detailTimerRef.current) {
                clearTimeout(detailTimerRef.current)
            }
            if (quarterTimerRef.current) {
                clearTimeout(quarterTimerRef.current)
            }
        }
    }, [])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const workerShifts = useMemo(() => {
        if (!shifts || !worker) return []
        return shifts.filter(s => s.worker_id === worker.id)
    }, [shifts, worker])

    const getDaysLabel = (count) => {
        if (count === 0) return 'рабочих дней'
        
        const lastDigit = count % 10
        const lastTwoDigits = count % 100
        
        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
            return 'рабочих дней'
        }
        
        if (lastDigit === 1) {
            return 'рабочий день'
        }
        
        if (lastDigit >= 2 && lastDigit <= 4) {
            return 'рабочих дня'
        }
        
        return 'рабочих дней'
    }

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return { date: '', dayOfWeek: '' }
        const date = new Date(dateStr + 'T00:00:00')
        const dayOfWeek = date.toLocaleDateString('ru-RU', { weekday: 'long' })
        const formattedDate = date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
        return { date: formattedDate, dayOfWeek }
    }

    const getMonthPrepositional = (date) => {
        const month = date.getMonth()
        const months = {
            0: 'январе',
            1: 'феврале',
            2: 'марте',
            3: 'апреле',
            4: 'мае',
            5: 'июне',
            6: 'июле',
            7: 'августе',
            8: 'сентябре',
            9: 'октябре',
            10: 'ноябре',
            11: 'декабре'
        }
        return months[month]
    }

    const handleStatusToggle = async () => {
        if (!worker) return
        
        const newStatus = status === 'active' ? 'inactive' : 'active'
        
        setStatus(newStatus)
        setIsUpdatingStatus(true)

        try {
            await updateWorkerStatus(worker.id, newStatus)
            if (onRefresh) {
                await onRefresh()
            }
        } catch (error) {
            console.error('Ошибка обновления статуса:', error)
            setStatus(status)
            alert('Не удалось обновить статус')
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const toggleSite = (siteId) => {
        const newSet = new Set(expandedSites)
        if (newSet.has(siteId)) {
            newSet.delete(siteId)
        } else {
            newSet.add(siteId)
        }
        setExpandedSites(newSet)
    }

    const getMonthData = (monthDate) => {
        const year = monthDate.getFullYear()
        const month = monthDate.getMonth()
        
        const monthShifts = []

        workerShifts.forEach(s => {
            if (!s.work_date) return
            
            const dateStr = s.work_date
            const dateObj = new Date(dateStr + 'T00:00:00')
            
            if (dateObj.getMonth() === month && dateObj.getFullYear() === year) {
                // Ищем объект ВО ВСЕХ объектах (включая архивные)
                const site = allSites.find(site => site.id === s.site_id)
                const siteName = site?.name || 'Неизвестный объект'
                const siteId = site?.id || null
                const color = site?.color || '#666'
                
                const existing = monthShifts.find(item => item.date === dateStr)
                if (existing) {
                    if (!existing.sites.includes(siteName)) {
                        existing.sites.push(siteName)
                        existing.siteIds.push(siteId)
                        existing.colors.push(color)
                    }
                } else {
                    monthShifts.push({ 
                        date: dateStr, 
                        sites: [siteName],
                        siteIds: [siteId],
                        colors: [color],
                        dateObj: dateObj
                    })
                }
            }
        })

        monthShifts.sort((a, b) => a.dateObj - b.dateObj)

        const uniqueSites = new Set()
        monthShifts.forEach(item => {
            item.sites.forEach(site => uniqueSites.add(site))
        })

        return {
            totalDays: monthShifts.length,
            totalSites: uniqueSites.size,
            shifts: monthShifts,
            siteList: Array.from(uniqueSites),
            year,
            month
        }
    }

    const monthData = useMemo(() => {
        return getMonthData(currentMonth)
    }, [currentMonth, workerShifts, allSites])

    const canGoPrev = () => {
        const now = new Date()
        const prevMonth = new Date(currentMonth)
        prevMonth.setMonth(prevMonth.getMonth() - 1)
        const yearAgo = new Date(now)
        yearAgo.setFullYear(yearAgo.getFullYear() - 1)
        return prevMonth >= yearAgo
    }

    const canGoNext = () => {
        const now = new Date()
        const nextMonth = new Date(currentMonth)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        return nextMonth <= now
    }

    const goPrevMonth = () => {
        if (!canGoPrev()) return
        setDirection(-1)
        setIsDetailVisible(false)
        
        const newMonth = new Date(currentMonth)
        newMonth.setMonth(newMonth.getMonth() - 1)
        setCurrentMonth(newMonth)
        monthKeyRef.current += 1
        
        if (detailTimerRef.current) {
            clearTimeout(detailTimerRef.current)
        }
        detailTimerRef.current = setTimeout(() => {
            setIsDetailVisible(true)
        }, 350)
    }

    const goNextMonth = () => {
        if (!canGoNext()) return
        setDirection(1)
        setIsDetailVisible(false)
        
        const newMonth = new Date(currentMonth)
        newMonth.setMonth(newMonth.getMonth() + 1)
        setCurrentMonth(newMonth)
        monthKeyRef.current += 1
        
        if (detailTimerRef.current) {
            clearTimeout(detailTimerRef.current)
        }
        detailTimerRef.current = setTimeout(() => {
            setIsDetailVisible(true)
        }, 350)
    }

    const monthName = currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
        .replace(' г.', '')
        .split(' ')
        .map((word, index) => index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)
        .join(' ')

    const getPeriodStats = () => {
        if (!periodStart || !periodEnd) return null

        const start = new Date(periodStart)
        start.setHours(0, 0, 0, 0)
        const end = new Date(periodEnd)
        end.setHours(23, 59, 59, 999)

        const periodShifts = []

        workerShifts.forEach(s => {
            if (!s.work_date) return
            
            const dateStr = s.work_date
            const dateObj = new Date(dateStr + 'T00:00:00')
            
            if (dateObj >= start && dateObj <= end) {
                // Ищем объект ВО ВСЕХ объектах (включая архивные)
                const site = allSites.find(site => site.id === s.site_id)
                const siteName = site?.name || 'Неизвестный объект'
                const siteId = site?.id || null
                const color = site?.color || '#666'
                
                const existing = periodShifts.find(item => item.date === dateStr)
                if (existing) {
                    if (!existing.sites.includes(siteName)) {
                        existing.sites.push(siteName)
                        existing.siteIds.push(siteId)
                        existing.colors.push(color)
                    }
                } else {
                    periodShifts.push({ 
                        date: dateStr, 
                        sites: [siteName],
                        siteIds: [siteId],
                        colors: [color],
                        dateObj: dateObj
                    })
                }
            }
        })

        periodShifts.sort((a, b) => a.dateObj - b.dateObj)

        const uniqueSites = new Set()
        periodShifts.forEach(item => {
            item.sites.forEach(site => uniqueSites.add(site))
        })

        return {
            totalDays: periodShifts.length,
            totalSites: uniqueSites.size,
            shifts: periodShifts,
            siteList: Array.from(uniqueSites)
        }
    }

    const periodStats = getPeriodStats()

    const getSiteStats = () => {
        const siteMap = {}
        
        workerShifts.forEach(s => {
            if (!s.work_date) return
            // Ищем объект ВО ВСЕХ объектах (включая архивные)
            const site = allSites.find(site => site.id === s.site_id)
            if (!site) return
            
            if (!siteMap[site.id]) {
                siteMap[site.id] = {
                    siteId: site.id,
                    siteName: site.name,
                    color: site.color || '#666',
                    dates: []
                }
            }
            siteMap[site.id].dates.push(s.work_date)
        })

        return Object.values(siteMap).map(item => {
            const sortedDates = item.dates.sort()
            const firstDate = sortedDates[0]
            const lastDate = sortedDates[sortedDates.length - 1]
            
            const formatMonthYear = (dateStr) => {
                const parts = dateStr.split('-')
                const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1)
                return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
            }
            
            let periodText = ''
            if (firstDate && lastDate) {
                const firstMonth = formatMonthYear(firstDate)
                const lastMonth = formatMonthYear(lastDate)
                if (firstMonth === lastMonth) {
                    periodText = `Период: ${firstMonth}`
                } else {
                    periodText = `Период: ${firstMonth} - ${lastMonth}`
                }
            }
            
            return {
                ...item,
                dates: sortedDates,
                periodText,
                totalDays: sortedDates.length
            }
        }).sort((a, b) => a.siteName.localeCompare(b.siteName))
    }

    const siteStats = getSiteStats()

    // ⭐ siteStats отсортированный по актуальности
const siteStatsSortedByRelevance = useMemo(() => {
    const sorted = [...siteStats]
    sorted.sort((a, b) => {
        const lastDateA = new Date(a.dates[a.dates.length - 1] + 'T00:00:00')
        const lastDateB = new Date(b.dates[b.dates.length - 1] + 'T00:00:00')
        return lastDateB - lastDateA
    })
    return sorted
}, [siteStats])

    const filteredSiteStats = useMemo(() => {
        let filtered = [...siteStats]
        
        if (sitesFilterMode === 'period' && sitesPeriodStart && sitesPeriodEnd) {
            const start = new Date(sitesPeriodStart)
            start.setHours(0, 0, 0, 0)
            const end = new Date(sitesPeriodEnd)
            end.setHours(23, 59, 59, 999)
            
            filtered = filtered.map(site => {
                const filteredDates = site.dates.filter(dateStr => {
                    const date = new Date(dateStr + 'T00:00:00')
                    return date >= start && date <= end
                })
                return {
                    ...site,
                    dates: filteredDates,
                    totalDays: filteredDates.length
                }
            }).filter(site => site.dates.length > 0)
        }
        
        filtered.sort((a, b) => {
            const lastDateA = new Date(a.dates[a.dates.length - 1] + 'T00:00:00')
            const lastDateB = new Date(b.dates[b.dates.length - 1] + 'T00:00:00')
            return lastDateB - lastDateA
        })
        
        return filtered
    }, [siteStats, sitesFilterMode, sitesPeriodStart, sitesPeriodEnd])

    const getDayColors = (date) => {
        const dateStr = formatDateLocal(date)
        const dayShifts = monthData.shifts.find(item => item.date === dateStr)
        if (!dayShifts || !dayShifts.colors || dayShifts.colors.length === 0) return null
        
        const colors = dayShifts.colors.slice(0, 3)
        return colors
    }

    const tileClassName = ({ date: tileDate, view }) => {
        if (view !== 'month') return null
        
        const isToday = formatDateLocal(tileDate) === formatDateLocal(new Date())
        const colors = getDayColors(tileDate)
        
        const classes = []
        
        if (isToday) {
            classes.push('today-day')
        }
        
        if (colors && colors.length > 0) {
            classes.push('colored-day')
        }
        
        return classes.length > 0 ? classes : null
    }

    const tileContent = ({ date: tileDate, view }) => {
        if (view !== 'month') return null
        
        const colors = getDayColors(tileDate)
        if (!colors || colors.length === 0) return null
        
        let background = ''
        
        if (colors.length === 1) {
            background = colors[0]
        } else if (colors.length === 2) {
            background = `linear-gradient(to right, ${colors[0]} 50%, ${colors[1]} 50%)`
        } else if (colors.length === 3) {
            background = `linear-gradient(to right, ${colors[0]} 33.33%, ${colors[1]} 33.33%, ${colors[1]} 66.66%, ${colors[2]} 66.66%)`
        }
        
        return (
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: background,
                    borderRadius: '8px',
                    zIndex: 0,
                    pointerEvents: 'none',
                }}
            />
        )
    }

    const formatDateDisplayFull = (dateStr) => {
        const parts = dateStr.split('-')
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const handleDragEnd = (event, info) => {
        if (Math.abs(info.offset.y) > Math.abs(info.offset.x)) {
            return
        }
        
        const threshold = 30
        if (info.offset.x < -threshold) {
            goNextMonth()
        } else if (info.offset.x > threshold) {
            goPrevMonth()
        }
    }

    const handleFilterChange = (mode) => {
        setSitesFilterMode(mode)
        setIsDropdownOpen(false)
        
        if (mode === 'all') {
            setSitesPeriodStart('')
            setSitesPeriodEnd('')
            setTempStartDate(null)
            setTempEndDate(null)
        } else if (mode === 'period') {
            setShowPeriodModal(true)
            if (sitesPeriodStart && sitesPeriodEnd) {
                setTempStartDate(new Date(sitesPeriodStart + 'T00:00:00'))
                setTempEndDate(new Date(sitesPeriodEnd + 'T00:00:00'))
            } else {
                const now = new Date()
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
                setTempStartDate(firstDay)
                setTempEndDate(now)
            }
        }
    }

    const handleApplyPeriod = () => {
        if (tempStartDate && tempEndDate) {
            const startStr = formatDateLocal(tempStartDate)
            const endStr = formatDateLocal(tempEndDate)
            setSitesPeriodStart(startStr)
            setSitesPeriodEnd(endStr)
            setSitesFilterMode('period')
            setShowPeriodModal(false)
        }
    }

    const handleCancelPeriod = () => {
        setShowPeriodModal(false)
        if (!sitesPeriodStart && !sitesPeriodEnd) {
            setSitesFilterMode('all')
        }
    }

// ⭐ ФУНКЦИИ ДЛЯ КВАРТАЛА (от текущего месяца — три месяца назад)
const getQuarterMonths = (startDate) => {
    const year = startDate.getFullYear()
    const month = startDate.getMonth()
    return [
        new Date(year, month, 1),
        new Date(year, month + 1, 1),
        new Date(year, month + 2, 1)
    ]
}

    const getQuarterLabel = (startDate) => {
        const months = getQuarterMonths(startDate)
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
        const startMonth = monthNames[months[0].getMonth()]
        const endMonth = monthNames[months[2].getMonth()]
        const year = startDate.getFullYear()
        return `${startMonth} - ${endMonth} ${year}`
    }

    const getQuarterData = (startDate) => {
        const months = getQuarterMonths(startDate)
        const monthDataArray = []
        const siteMap = {}

        months.forEach((monthDate, index) => {
            const year = monthDate.getFullYear()
            const month = monthDate.getMonth()
            const monthShifts = []

            workerShifts.forEach(s => {
                if (!s.work_date) return
                const dateStr = s.work_date
                const dateObj = new Date(dateStr + 'T00:00:00')
                
                if (dateObj.getMonth() === month && dateObj.getFullYear() === year) {
                    // Ищем объект ВО ВСЕХ объектах (включая архивные)
                    const site = allSites.find(site => site.id === s.site_id)
                    const siteName = site?.name || 'Неизвестный объект'
                    const siteId = site?.id || null
                    const color = site?.color || '#666'
                    
                    const existing = monthShifts.find(item => item.date === dateStr)
                    if (existing) {
                        if (!existing.sites.includes(siteName)) {
                            existing.sites.push(siteName)
                            existing.siteIds.push(siteId)
                            existing.colors.push(color)
                        }
                    } else {
                        monthShifts.push({ 
                            date: dateStr, 
                            sites: [siteName],
                            siteIds: [siteId],
                            colors: [color],
                            dateObj: dateObj
                        })
                    }
                    
                    if (!siteMap[siteName]) {
                        siteMap[siteName] = {
                            name: siteName,
                            color: color,
                            count: 0
                        }
                    }
                    siteMap[siteName].count += 1
                }
            })

            monthShifts.sort((a, b) => a.dateObj - b.dateObj)
            const uniqueSites = new Set()
            monthShifts.forEach(item => {
                item.sites.forEach(site => uniqueSites.add(site))
            })

            monthDataArray.push({
                totalDays: monthShifts.length,
                shifts: monthShifts,
                siteList: Array.from(uniqueSites),
                month: month,
                year: year
            })
        })

        const sortedSites = Object.values(siteMap).sort((a, b) => b.count - a.count)

        return {
            monthDataArray,
            totalDays: monthDataArray.reduce((acc, m) => acc + m.totalDays, 0),
            siteList: sortedSites
        }
    }

   // ⭐ Инициализация quarterData
const [quarterData, setQuarterData] = useState(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const quarterStartMonth = currentMonth - 2
    const year = now.getFullYear()
    let startDate
    if (quarterStartMonth < 0) {
        startDate = new Date(year - 1, 12 + quarterStartMonth, 1)
    } else {
        startDate = new Date(year, quarterStartMonth, 1)
    }
    return getQuarterData(startDate)
})

    const canGoPrevQuarter = () => {
        const now = new Date()
        const prevQuarter = new Date(currentQuarterStart)
        prevQuarter.setMonth(prevQuarter.getMonth() - 3)
        const yearAgo = new Date(now)
        yearAgo.setFullYear(yearAgo.getFullYear() - 1)
        return prevQuarter >= yearAgo
    }

    const canGoNextQuarter = () => {
        const now = new Date()
        const nextQuarter = new Date(currentQuarterStart)
        nextQuarter.setMonth(nextQuarter.getMonth() + 3)
        return nextQuarter <= now
    }

    const goPrevQuarter = () => {
        if (!canGoPrevQuarter()) return
        setQuarterDirection(-1)
        setIsQuarterDetailVisible(false)
        
        const newStart = new Date(currentQuarterStart)
        newStart.setMonth(newStart.getMonth() - 3)
        setCurrentQuarterStart(newStart)
        quarterKeyRef.current += 1
        
        const newData = getQuarterData(newStart)
        setQuarterData(newData)
        
        if (quarterTimerRef.current) {
            clearTimeout(quarterTimerRef.current)
        }
        quarterTimerRef.current = setTimeout(() => {
            setIsQuarterDetailVisible(true)
        }, 350)
    }

    const goNextQuarter = () => {
        if (!canGoNextQuarter()) return
        setQuarterDirection(1)
        setIsQuarterDetailVisible(false)
        
        const newStart = new Date(currentQuarterStart)
        newStart.setMonth(newStart.getMonth() + 3)
        setCurrentQuarterStart(newStart)
        quarterKeyRef.current += 1
        
        const newData = getQuarterData(newStart)
        setQuarterData(newData)
        
        if (quarterTimerRef.current) {
            clearTimeout(quarterTimerRef.current)
        }
        quarterTimerRef.current = setTimeout(() => {
            setIsQuarterDetailVisible(true)
        }, 350)
    }

    const handleQuarterDragEnd = (event, info) => {
        if (Math.abs(info.offset.y) > Math.abs(info.offset.x)) {
            return
        }
        const threshold = 30
        if (info.offset.x < -threshold) {
            goNextQuarter()
        } else if (info.offset.x > threshold) {
            goPrevQuarter()
        }
    }

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0,
        }),
    }

    if (!worker) return null

    const shouldAnimate = !isFirstRenderRef.current

    const monthParts = monthName.split(' ')
    const monthText = monthParts[0] || ''
    const yearText = monthParts[1] || ''

    return (
        <div className={styles.workerStatsPage}>
            {/* ХЕДЕР */}
            <div className={styles.workerStatsHeader}>
                {/* ⭐ КНОПКА НАЗАД */}
                <button 
                    className={styles.workerStatsBackBtn}
                    onClick={onClose}
                    aria-label="Назад"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>

                {/* АВАТАРКА */}
                <div 
                    className={styles.workerStatsAvatarWrapper}
                    onClick={() => onEdit(worker)}
                >
                    <div className={styles.workerStatsAvatar}>
                        {hasPhoto ? (
                            <img src={avatarUrl} alt={worker.name} />
                        ) : (
                            <span style={{ background: avatarColor }}>{initials}</span>
                        )}
                    </div>
                    <div className={styles.workerStatsEditBadge}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </div>
                </div>

                {/* ИНФОРМАЦИЯ */}
                <div className={styles.workerStatsInfo}>
                    <span className={styles.workerStatsName}>
                        {worker.name}
                    </span>
                    <div className={styles.workerStatsStatusRow}>
                        <span className={styles.workerStatsStatusLabel}>Статус: </span>
                        <span className={styles.workerStatsStatusText}>
                            <span 
                                className={`${styles.statusText} ${status === 'active' ? styles.statusActive : styles.statusInactive}`}
                            >
                                {status === 'active' ? 'Работает' : 'Не работает'}
                            </span>
                        </span>
                        <button 
                            className={`${styles.switch} ${status === 'active' ? styles.active : ''}`}
                            onClick={handleStatusToggle}
                            disabled={isUpdatingStatus}
                            aria-label="Переключить статус"
                        >
                            <span className={styles.switchSlider} />
                        </button>
                    </div>
                </div>
            </div>

           {/* ВКЛАДКИ */}
<div className={styles.workerStatsTabs}>
    <button 
        className={`${styles.workerStatsTab} ${activeTab === 'month' ? styles.active : ''}`}
        onClick={() => setActiveTab('month')}
    >
        Рабочие дни
    </button>
    <button 
        className={`${styles.workerStatsTab} ${activeTab === 'salary' ? styles.active : ''}`}
        onClick={() => setActiveTab('salary')}
    >
        Зарплата
    </button>
</div>

            {/* ⭐ ЧИПСЫ-ПЕРЕКЛЮЧАТЕЛИ (только для вкладки "Рабочие дни") */}
            {activeTab === 'month' && (
                <div className={styles.workPeriodChips}>
                    <button 
                        className={`${styles.workPeriodChip} ${workPeriodMode === 'month' ? styles.active : ''}`}
                        onClick={() => setWorkPeriodMode('month')}
                    >
                        Месяц
                    </button>
                    <button 
                        className={`${styles.workPeriodChip} ${workPeriodMode === 'quarter' ? styles.active : ''}`}
                        onClick={() => setWorkPeriodMode('quarter')}
                    >
                        Квартал
                    </button>
                    <button 
                        className={`${styles.workPeriodChip} ${workPeriodMode === 'all' ? styles.active : ''}`}
                        onClick={() => setWorkPeriodMode('all')}
                    >
                        За весь период
                    </button>
                </div>
            )}

            {/* КОНТЕНТ */}
            <div className={styles.workerStatsContent}>
                {activeTab === 'month' && (
                    <div className={styles.tabContent}>
                        {workPeriodMode === 'month' && (
                            <>
                                {/* ПЛАШКИ */}
                                <div className={styles.statsGrid}>
                                    <div className={styles.statsCard}>
                                        <div className={styles.statsCardMonth}>
                                            <span className={styles.statsCardMonthName}>{monthText}</span>
                                            <span className={styles.statsCardMonthYear}>{yearText}</span>
                                        </div>
                                    </div>
                                    <div className={styles.statsCard}>
                                        <div className={styles.statsCardNumber}>{monthData.totalDays}</div>
                                        <div className={styles.statsCardLabel}>{getDaysLabel(monthData.totalDays)}</div>
                                    </div>
                                </div>

                                {/* КАЛЕНДАРЬ */}
                                <div className={styles.calendarWrapper}>
                                    <AnimatePresence mode="popLayout" custom={direction}>
                                        <motion.div
                                            key={monthKeyRef.current}
                                            custom={direction}
                                            variants={variants}
                                            initial={shouldAnimate ? "enter" : false}
                                            animate="center"
                                            exit="exit"
                                            transition={{
                                                x: { 
                                                    type: "spring", 
                                                    stiffness: 500,
                                                    damping: 35,
                                                    mass: 0.5
                                                },
                                                opacity: { duration: 0.15 },
                                            }}
                                            drag="x"
                                            dragConstraints={{ left: 0, right: 0 }}
                                            dragElastic={0.5}
                                            dragMomentum={false}
                                            onDragEnd={handleDragEnd}
                                            style={{ width: '100%' }}
                                        >
                                            <Calendar
                                                key={currentMonth.getMonth() + '-' + currentMonth.getFullYear()}
                                                value={null}
                                                tileClassName={tileClassName}
                                                tileContent={tileContent}
                                                minDetail="month"
                                                maxDetail="month"
                                                prevLabel={null}
                                                nextLabel={null}
                                                next2Label={null}
                                                prev2Label={null}
                                                showNeighboringMonth={true}
                                                navigationLabel={null}
                                                activeStartDate={currentMonth}
                                            />
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* ПЛАШКА — ИНФОРМАЦИЯ О РАБОТЕ В МЕСЯЦЕ */}
                                <AnimatePresence>
                                    {isDetailVisible && monthData.shifts.length > 0 && (
                                        <motion.div
                                            key={`detail-${monthKeyRef.current}`}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 8 }}
                                            transition={{ duration: 0.3 }}
                                            className={styles.detailStatsWrapper}
                                        >
                                            <div className={styles.detailStatsCard}>
                                                <div className={styles.detailStatsText}>
                                                    <span className={styles.detailStatsName}>
                                                        {worker.name.split(' ')[0]}
                                                    </span>
                                                    {' работал в '}
                                                    <span className={styles.detailStatsMonth}>
                                                        {getMonthPrepositional(currentMonth)}
                                                    </span>
                                                    {monthData.siteList.length === 1 ? (
                                                        ' на объекте:'
                                                    ) : (
                                                        ' на объектах:'
                                                    )}
                                                </div>
                                                <div className={styles.detailStatsObjects}>
                                                    {monthData.siteList.map((siteName) => {
                                                        // Ищем объект ВО ВСЕХ объектах (включая архивные)
                                                        const site = allSites.find(s => s.name === siteName)
                                                        const color = site?.color || '#666'
                                                        
                                                        const siteShifts = monthData.shifts.filter(
                                                            shift => shift.sites.includes(siteName)
                                                        )
                                                        const daysCount = siteShifts.length
                                                        const dayLabel = getDaysLabel(daysCount)
                                                        
                                                        return (
                                                            <div key={siteName} className={styles.detailStatsObjectItem}>
                                                                <span 
                                                                    className={styles.detailStatsObjectDot}
                                                                    style={{ 
                                                                        backgroundColor: color,
                                                                        boxShadow: `0 0 16px ${color}, 0 0 32px ${color}40`
                                                                    }}
                                                                />
                                                                <span className={styles.detailStatsObjectName}>
                                                                    {siteName}
                                                                </span>
                                                                <span className={styles.detailStatsObjectCount}>
                                                                    — {daysCount} {dayLabel}
                                                                </span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}

                        {workPeriodMode === 'quarter' && (
    <div className={styles.quarterContainer}>
        {/* ⭐ ДВЕ ПЛАШКИ КАК ВО ВКЛАДКЕ МЕСЯЦ */}
        <div className={styles.quarterStatsGrid}>
            <div className={styles.quarterStatsCard}>
                <div className={styles.quarterStatsCardMonth}>
                    <span className={styles.quarterStatsCardMonthName}>
                        {getQuarterLabel(currentQuarterStart)}
                    </span>
                </div>
            </div>
            <div className={styles.quarterStatsCard}>
                <div className={styles.quarterStatsCardNumber}>
                    {quarterData.totalDays}
                </div>
                <div className={styles.quarterStatsCardLabel}>
                    {getDaysLabel(quarterData.totalDays)}
                </div>
            </div>
        </div>

        {/* ⭐ ТРИ КАЛЕНДАРЯ В РЯД (со свайпом) */}
        <AnimatePresence mode="popLayout" custom={quarterDirection}>
            <motion.div
                key={quarterKeyRef.current}
                custom={quarterDirection}
                variants={variants}
                initial={shouldAnimate ? "enter" : false}
                animate="center"
                exit="exit"
                transition={{
                    x: { 
                        type: "spring", 
                        stiffness: 500,
                        damping: 35,
                        mass: 0.5
                    },
                    opacity: { duration: 0.15 },
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                dragMomentum={false}
                onDragEnd={handleQuarterDragEnd}
                className={styles.quarterCalendarRow}
            >
                {getQuarterMonths(currentQuarterStart).map((monthDate, index) => {
                    const monthDataItem = quarterData.monthDataArray[index] || { totalDays: 0, shifts: [], siteList: [] }
                    const monthName = monthDate.toLocaleDateString('ru-RU', { month: 'long' })
                    
                    const getQuarterDayColors = (date) => {
                        const dateStr = formatDateLocal(date)
                        const dayShifts = monthDataItem.shifts.find(item => item.date === dateStr)
                        if (!dayShifts || !dayShifts.colors || dayShifts.colors.length === 0) return null
                        return dayShifts.colors.slice(0, 3)
                    }

                    const quarterTileClassName = ({ date: tileDate, view }) => {
                        if (view !== 'month') return null
                        const isToday = formatDateLocal(tileDate) === formatDateLocal(new Date())
                        const colors = getQuarterDayColors(tileDate)
                        const classes = []
                        if (isToday) {
                            classes.push('today-day')
                        }
                        if (colors && colors.length > 0) {
                            classes.push('colored-day')
                        }
                        return classes.length > 0 ? classes : null
                    }

                    const quarterTileContent = ({ date: tileDate, view }) => {
                        if (view !== 'month') return null
                        const colors = getQuarterDayColors(tileDate)
                        if (!colors || colors.length === 0) return null
                        
                        let background = ''
                        if (colors.length === 1) {
                            background = colors[0]
                        } else if (colors.length === 2) {
                            background = `linear-gradient(to right, ${colors[0]} 50%, ${colors[1]} 50%)`
                        } else if (colors.length === 3) {
                            background = `linear-gradient(to right, ${colors[0]} 33.33%, ${colors[1]} 33.33%, ${colors[1]} 66.66%, ${colors[2]} 66.66%)`
                        }
                        
                        return (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: background,
                                    borderRadius: '4px',
                                    zIndex: 0,
                                    pointerEvents: 'none',
                                }}
                            />
                        )
                    }

                    return (
                        <div key={index} className={styles.quarterMonthCard}>
                            <div className={styles.quarterMonthName}>{monthName}</div>
                            <div className={styles.quarterCalendarWrapper}>
                                <Calendar
                                    key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
                                    value={null}
                                    tileClassName={quarterTileClassName}
                                    tileContent={quarterTileContent}
                                    minDetail="month"
                                    maxDetail="month"
                                    prevLabel={null}
                                    nextLabel={null}
                                    next2Label={null}
                                    prev2Label={null}
                                    showNeighboringMonth={true}
                                    navigationLabel={null}
                                    activeStartDate={monthDate}
                                />
                            </div>
                           
                        </div>
                    )
                })}
            </motion.div>
        </AnimatePresence>

        {/* ⭐ ИНФОРМАЦИЯ ОБ ОБЪЕКТАХ ЗА КВАРТАЛ */}
        <AnimatePresence>
            {isQuarterDetailVisible && quarterData.siteList.length > 0 && (
                <motion.div
                    key={`quarter-detail-${quarterKeyRef.current}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.3 }}
                    className={styles.detailStatsWrapper}
                >
                    <div className={styles.detailStatsCard}>
                        <div className={styles.detailStatsText}>
                            <span className={styles.detailStatsName}>
                                {worker.name.split(' ')[0]}
                            </span>
                            {' работал за квартал на объектах:'}
                        </div>
                        <div className={styles.detailStatsObjects}>
                            {quarterData.siteList.map((site) => {
                                // Ищем объект ВО ВСЕХ объектах (включая архивные)
                                const fullSite = allSites.find(s => s.name === site.name)
                                const color = fullSite?.color || site.color || '#666'
                                
                                return (
                                    <div key={site.name} className={styles.detailStatsObjectItem}>
                                        <span 
                                            className={styles.detailStatsObjectDot}
                                            style={{ 
                                                backgroundColor: color,
                                                boxShadow: `0 0 16px ${color}, 0 0 32px ${color}40`
                                            }}
                                        />
                                        <span className={styles.detailStatsObjectName}>
                                            {site.name}
                                        </span>
                                        <span className={styles.detailStatsObjectCount}>
                                            — {site.count} {getDaysLabel(site.count)}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
)}

{workPeriodMode === 'all' && (
    <div className={styles.tabContent}>
        {/* ЗАГОЛОВОК */}
        <div className={styles.sitesHeader}>
            <div className={styles.sitesTitle}>
                Объекты, на которых работал {worker.name.split(' ')[0]} за весь период:
            </div>
        </div>

        {/* СПИСОК ОБЪЕКТОВ */}
        {siteStatsSortedByRelevance.length > 0 ? (
            <div className={styles.sitesList}>
                {siteStatsSortedByRelevance.map((site) => {
                    const dayText = site.totalDays === 1 ? 'рабочий день' : 'рабочих дней'
                    return (
                        <div key={site.siteId} className={styles.siteAccordion}>
                            <button 
                                className={styles.siteAccordionHeader}
                                onClick={() => toggleSite(site.siteId)}
                            >
                                <div className={styles.siteAccordionLeft}>
                                    <div 
                                        className={styles.siteAccordionDot}
                                        style={{ backgroundColor: site.color }}
                                    />
                                    <div>
                                        <div className={styles.siteAccordionName}>{site.siteName}</div>
                                        <div className={styles.siteAccordionPeriod}>{site.periodText}</div>
                                        <div className={styles.siteAccordionSub}>
                                            {site.totalDays} {dayText}
                                        </div>
                                    </div>
                                </div>
                                <span className={`${styles.siteAccordionArrow} ${expandedSites.has(site.siteId) ? styles.expanded : ''}`}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="6 9 12 15 18 9"/>
                                    </svg>
                                </span>
                            </button>
                            
                            {expandedSites.has(site.siteId) && (
                                <div className={styles.siteAccordionBody}>
                                    {site.dates.map((date) => (
                                        <div key={date} className={styles.siteAccordionDate}>
                                            {formatDateDisplay(date).date}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        ) : (
            <div className={styles.emptyState}>Нет объектов за весь период</div>
        )}
    </div>
)}
                    </div>
                )}

                {activeTab === 'salary' && (
                    <div className={styles.tabContent}>
                        <div className={styles.salaryPlaceholder}>
                            <div className={styles.salaryPlaceholderIcon}>💰</div>
                            <div className={styles.salaryPlaceholderTitle}>Зарплата</div>
                            <div className={styles.salaryPlaceholderText}>
                                Информация о зарплате появится позже
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ФУТЕР — ЧЕРЕЗ PORTAL */}
            <WorkerStatsFooter 
                onEdit={onEdit}
                onClose={onClose}
                worker={worker}
            />
        </div>
    )
}