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
import { Ellipsis, PersonPencil, ArrowsRotateLeft, Calendar as CalendarIcon, Wallet, ArrowLeft, TrashBin } from '@gravity-ui/icons'
import styles from '../styles/workerStats.module.css'
import { WorkerStatsFooter } from '../components/WorkerStatsFooter'

export function WorkerStatsPage({ worker, shifts, sites, archivedSites = [], onClose, onEdit, onRefresh, onArchive }) {
    const { getAvatar } = useAvatars()
    const [activeTab, setActiveTab] = useState('month')

    const [status, setStatus] = useState(worker?.status || 'active')
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const menuRef = useRef(null)

    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const [periodStart, setPeriodStart] = useState(null)
    const [periodEnd, setPeriodEnd] = useState(null)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [direction, setDirection] = useState(0)
    const [expandedSites, setExpandedSites] = useState(new Set())
    const [isDetailVisible, setIsDetailVisible] = useState(true)

    const [workPeriodMode, setWorkPeriodMode] = useState('month')

    const [sitesFilterMode, setSitesFilterMode] = useState('all')
    const [showPeriodModal, setShowPeriodModal] = useState(false)
    const [sitesPeriodStart, setSitesPeriodStart] = useState('')
    const [sitesPeriodEnd, setSitesPeriodEnd] = useState('')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)

    const chipsRef = useRef(null)

    const [tempStartDate, setTempStartDate] = useState(null)
    const [tempEndDate, setTempEndDate] = useState(null)

    const monthKeyRef = useRef(0)
    const isFirstRenderRef = useRef(true)
    const detailTimerRef = useRef(null)

    const [currentQuarterStart, setCurrentQuarterStart] = useState(() => {
        const now = new Date()
        const currentMonth = now.getMonth()
        const quarterStartMonth = currentMonth - 2
        const year = now.getFullYear()
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
            if (detailTimerRef.current) clearTimeout(detailTimerRef.current)
            if (quarterTimerRef.current) clearTimeout(quarterTimerRef.current)
        }
    }, [])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false)
            }
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (activeTab !== 'month') return
        const container = chipsRef.current
        if (!container) return
        const active = container.querySelector('[data-mode-active="true"]')
        if (!active) return

        const LEFT_FADE = 16
        const RIGHT_FADE = 32

        const containerRect = container.getBoundingClientRect()
        const chipRect = active.getBoundingClientRect()

        const visibleLeft = containerRect.left + LEFT_FADE
        const visibleRight = containerRect.right - RIGHT_FADE

        if (chipRect.left < visibleLeft) {
            const delta = visibleLeft - chipRect.left
            container.scrollBy({ left: -delta, behavior: 'smooth' })
        } else if (chipRect.right > visibleRight) {
            const delta = chipRect.right - visibleRight
            container.scrollBy({ left: delta, behavior: 'smooth' })
        }
    }, [workPeriodMode, activeTab])

    useEffect(() => {
        if (activeTab !== 'month') return
        const container = chipsRef.current
        if (!container) return

        const updateFades = () => {
            const hasLeft = container.scrollLeft > 1
            const hasRight = container.scrollLeft < container.scrollWidth - container.clientWidth - 1
            container.classList.toggle(styles.workPeriodChipsFadeLeft, hasLeft)
            container.classList.toggle(styles.workPeriodChipsNoFadeRight, !hasRight)
        }

        updateFades()
        container.addEventListener('scroll', updateFades, { passive: true })

        const ro = new ResizeObserver(updateFades)
        ro.observe(container)

        return () => {
            container.removeEventListener('scroll', updateFades)
            ro.disconnect()
            container.classList.remove(styles.workPeriodChipsFadeLeft)
            container.classList.remove(styles.workPeriodChipsNoFadeRight)
        }
    }, [activeTab, workPeriodMode])

    const workerShifts = useMemo(() => {
        if (!shifts || !worker) return []
        return shifts.filter(s => s.worker_id === worker.id)
    }, [shifts, worker])

    const getDaysLabel = (count) => {
        if (count === 0) return 'рабочих дней'
        const lastDigit = count % 10
        const lastTwoDigits = count % 100
        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'рабочих дней'
        if (lastDigit === 1) return 'рабочий день'
        if (lastDigit >= 2 && lastDigit <= 4) return 'рабочих дня'
        return 'рабочих дней'
    }

    const getDaysWord = (count) => {
        if (count === 0) return 'дней'
        const lastDigit = count % 10
        const lastTwoDigits = count % 100
        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'дней'
        if (lastDigit === 1) return 'день'
        if (lastDigit >= 2 && lastDigit <= 4) return 'дня'
        return 'дней'
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
            0: 'январе', 1: 'феврале', 2: 'марте', 3: 'апреле',
            4: 'мае', 5: 'июне', 6: 'июле', 7: 'августе',
            8: 'сентябре', 9: 'октябре', 10: 'ноябре', 11: 'декабре'
        }
        return months[month]
    }

    const handleStatusToggle = async () => {
        if (!worker || isUpdatingStatus) return
        const newStatus = status === 'active' ? 'inactive' : 'active'
        const prevStatus = status
        setStatus(newStatus)
        setIsUpdatingStatus(true)
        setIsMenuOpen(false)
        try {
            await updateWorkerStatus(worker.id, newStatus)
            if (onRefresh) await onRefresh()
        } catch (error) {
            console.error('Ошибка обновления статуса:', error)
            setStatus(prevStatus)
            alert('Не удалось обновить статус')
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const handleEditProfile = () => {
        setIsMenuOpen(false)
        if (onEdit && worker) onEdit(worker)
    }

    const handleOpenDeleteModal = () => {
        setIsMenuOpen(false)
        setShowDeleteModal(true)
    }

    const handleCancelDelete = () => {
        if (isDeleting) return
        setShowDeleteModal(false)
    }

    const handleConfirmDelete = async () => {
        if (!worker || isDeleting) return
        setIsDeleting(true)
        try {
            if (onArchive) {
                await onArchive(worker.id)
            }
            setShowDeleteModal(false)
            if (onClose) onClose()
        } catch (error) {
            console.error('❌ Ошибка удаления работника:', error)
            alert('Не удалось удалить работника: ' + (error?.message || 'неизвестная ошибка'))
        } finally {
            setIsDeleting(false)
        }
    }

    const toggleSite = (siteId) => {
        const newSet = new Set(expandedSites)
        if (newSet.has(siteId)) newSet.delete(siteId)
        else newSet.add(siteId)
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
                    monthShifts.push({ date: dateStr, sites: [siteName], siteIds: [siteId], colors: [color], dateObj })
                }
            }
        })

        monthShifts.sort((a, b) => a.dateObj - b.dateObj)
        const uniqueSites = new Set()
        monthShifts.forEach(item => item.sites.forEach(site => uniqueSites.add(site)))

        return {
            totalDays: monthShifts.length,
            totalSites: uniqueSites.size,
            shifts: monthShifts,
            siteList: Array.from(uniqueSites),
            year, month
        }
    }

    const monthData = useMemo(() => getMonthData(currentMonth), [currentMonth, workerShifts, allSites])

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
        if (detailTimerRef.current) clearTimeout(detailTimerRef.current)
        detailTimerRef.current = setTimeout(() => setIsDetailVisible(true), 350)
    }

    const goNextMonth = () => {
        if (!canGoNext()) return
        setDirection(1)
        setIsDetailVisible(false)
        const newMonth = new Date(currentMonth)
        newMonth.setMonth(newMonth.getMonth() + 1)
        setCurrentMonth(newMonth)
        monthKeyRef.current += 1
        if (detailTimerRef.current) clearTimeout(detailTimerRef.current)
        detailTimerRef.current = setTimeout(() => setIsDetailVisible(true), 350)
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
                    periodShifts.push({ date: dateStr, sites: [siteName], siteIds: [siteId], colors: [color], dateObj })
                }
            }
        })

        periodShifts.sort((a, b) => a.dateObj - b.dateObj)
        const uniqueSites = new Set()
        periodShifts.forEach(item => item.sites.forEach(site => uniqueSites.add(site)))

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
            const site = allSites.find(site => site.id === s.site_id)
            if (!site) return
            if (!siteMap[site.id]) {
                siteMap[site.id] = { siteId: site.id, siteName: site.name, color: site.color || '#666', dates: [] }
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
                periodText = firstMonth === lastMonth ? `Период: ${firstMonth}` : `Период: ${firstMonth} - ${lastMonth}`
            }
            return { ...item, dates: sortedDates, periodText, totalDays: sortedDates.length }
        }).sort((a, b) => a.siteName.localeCompare(b.siteName))
    }

    const siteStats = getSiteStats()

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
                return { ...site, dates: filteredDates, totalDays: filteredDates.length }
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
        return dayShifts.colors.slice(0, 3)
    }

    const tileClassName = ({ date: tileDate, view }) => {
        if (view !== 'month') return null
        const isToday = formatDateLocal(tileDate) === formatDateLocal(new Date())
        const colors = getDayColors(tileDate)
        const classes = []
        if (isToday) classes.push('today-day')
        if (colors && colors.length > 0) classes.push('colored-day')
        return classes.length > 0 ? classes : null
    }

    const tileContent = ({ date: tileDate, view }) => {
        if (view !== 'month') return null
        const colors = getDayColors(tileDate)
        if (!colors || colors.length === 0) return null
        let background = ''
        if (colors.length === 1) background = colors[0]
        else if (colors.length === 2) background = `linear-gradient(to right, ${colors[0]} 50%, ${colors[1]} 50%)`
        else if (colors.length === 3) background = `linear-gradient(to right, ${colors[0]} 33.33%, ${colors[1]} 33.33%, ${colors[1]} 66.66%, ${colors[2]} 66.66%)`
        return (
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background, borderRadius: '8px', zIndex: 0, pointerEvents: 'none',
            }} />
        )
    }

    const handleDragEnd = (event, info) => {
        if (Math.abs(info.offset.y) > Math.abs(info.offset.x)) return
        const threshold = 30
        if (info.offset.x < -threshold) goNextMonth()
        else if (info.offset.x > threshold) goPrevMonth()
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
        if (!sitesPeriodStart && !sitesPeriodEnd) setSitesFilterMode('all')
    }

    const getQuarterMonths = (startDate) => {
        const year = startDate.getFullYear()
        const month = startDate.getMonth()
        return [
            new Date(year, month, 1),
            new Date(year, month + 1, 1),
            new Date(year, month + 2, 1)
        ]
    }

    const getQuarterLabelParts = (startDate) => {
        const months = getQuarterMonths(startDate)
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
        const startMonth = monthNames[months[0].getMonth()]
        const endMonth = monthNames[months[2].getMonth()]
        const year = startDate.getFullYear()
        return { top: `${startMonth} – ${endMonth}`, bottom: String(year) }
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
                        monthShifts.push({ date: dateStr, sites: [siteName], siteIds: [siteId], colors: [color], dateObj })
                    }
                    if (!siteMap[siteName]) siteMap[siteName] = { name: siteName, color, count: 0 }
                    siteMap[siteName].count += 1
                }
            })

            monthShifts.sort((a, b) => a.dateObj - b.dateObj)
            const uniqueSites = new Set()
            monthShifts.forEach(item => item.sites.forEach(site => uniqueSites.add(site)))

            monthDataArray.push({
                totalDays: monthShifts.length,
                shifts: monthShifts,
                siteList: Array.from(uniqueSites),
                month, year
            })
        })

        const sortedSites = Object.values(siteMap).sort((a, b) => b.count - a.count)

        return {
            monthDataArray,
            totalDays: monthDataArray.reduce((acc, m) => acc + m.totalDays, 0),
            siteList: sortedSites
        }
    }

    const [quarterData, setQuarterData] = useState(() => {
        const now = new Date()
        const currentMonth = now.getMonth()
        const quarterStartMonth = currentMonth - 2
        const year = now.getFullYear()
        let startDate
        if (quarterStartMonth < 0) startDate = new Date(year - 1, 12 + quarterStartMonth, 1)
        else startDate = new Date(year, quarterStartMonth, 1)
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
        setQuarterData(getQuarterData(newStart))
        if (quarterTimerRef.current) clearTimeout(quarterTimerRef.current)
        quarterTimerRef.current = setTimeout(() => setIsQuarterDetailVisible(true), 350)
    }

    const goNextQuarter = () => {
        if (!canGoNextQuarter()) return
        setQuarterDirection(1)
        setIsQuarterDetailVisible(false)
        const newStart = new Date(currentQuarterStart)
        newStart.setMonth(newStart.getMonth() + 3)
        setCurrentQuarterStart(newStart)
        quarterKeyRef.current += 1
        setQuarterData(getQuarterData(newStart))
        if (quarterTimerRef.current) clearTimeout(quarterTimerRef.current)
        quarterTimerRef.current = setTimeout(() => setIsQuarterDetailVisible(true), 350)
    }

    const handleQuarterDragEnd = (event, info) => {
        if (Math.abs(info.offset.y) > Math.abs(info.offset.x)) return
        const threshold = 30
        if (info.offset.x < -threshold) goNextQuarter()
        else if (info.offset.x > threshold) goPrevQuarter()
    }

    const variants = {
        enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (direction) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
    }

    if (!worker) return null
    const shouldAnimate = !isFirstRenderRef.current
    const monthParts = monthName.split(' ')
    const monthText = monthParts[0] || ''
    const yearText = monthParts[1] || ''

    const quarterLabelParts = getQuarterLabelParts(currentQuarterStart)

    // Склонение для счётчика объектов на вкладке «За весь период»
    const getObjectsWord = (n) => {
        if (n % 10 === 1 && n % 100 !== 11) return 'объект'
        if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'объекта'
        return 'объектов'
    }

    const allPeriodTotalDays = siteStatsSortedByRelevance.reduce((acc, s) => acc + s.totalDays, 0)

    return (
        <div className={styles.workerStatsPage}>
            <div className={styles.workerStatsTopBar}>
                <div className={styles.workerStatsHeader}>
                    <button
                        className={styles.workerStatsBackArrowBtn}
                        onClick={onClose}
                        aria-label="Назад"
                    >
                        <span className={styles.workerStatsBackArrowIcon}>
                            <ArrowLeft />
                        </span>
                    </button>

                    <div className={styles.workerStatsAvatarWrapper}>
                        <div className={styles.workerStatsAvatar}>
                            {hasPhoto ? (
                                <img src={avatarUrl} alt={worker.name} />
                            ) : (
                                <span style={{ background: avatarColor }}>{initials}</span>
                            )}
                        </div>
                    </div>

                    <div className={styles.workerStatsInfo}>
                        <span className={styles.workerStatsName}>{worker.name}</span>
                        <div className={styles.workerStatsStatusRow}>
                            <span className={styles.workerStatsStatusLabel}>Статус: </span>
                            <span className={styles.workerStatsStatusText}>
                                <span className={`${styles.statusText} ${status === 'active' ? styles.statusActive : styles.statusInactive}`}>
                                    {status === 'active' ? 'Работает' : 'Не работает'}
                                </span>
                            </span>
                        </div>
                    </div>

                    <div className={styles.workerStatsMenuWrapper} ref={menuRef}>
                        <button
                            className={styles.workerStatsMenuBtn}
                            onClick={() => setIsMenuOpen(prev => !prev)}
                            aria-label="Меню"
                            aria-haspopup="menu"
                            aria-expanded={isMenuOpen}
                        >
                            <span className={styles.workerStatsMenuIcon}>
                                <Ellipsis />
                            </span>
                        </button>

                        {isMenuOpen && (
                            <div className={styles.workerStatsDropdown} role="menu">
                                <button
                                    className={styles.workerStatsDropdownItem}
                                    onClick={handleEditProfile}
                                    role="menuitem"
                                >
                                    <span className={styles.workerStatsDropdownItemIcon}>
                                        <PersonPencil />
                                    </span>
                                    <span className={styles.workerStatsDropdownItemText}>
                                        Редактировать профиль
                                    </span>
                                </button>

                                <div className={styles.workerStatsDropdownDivider} />

                                <button
                                    className={`${styles.workerStatsDropdownItem} ${styles.workerStatsDropdownItemStatus}`}
                                    onClick={handleStatusToggle}
                                    disabled={isUpdatingStatus}
                                    role="menuitem"
                                >
                                    <span className={styles.workerStatsDropdownItemIcon}>
                                        <ArrowsRotateLeft />
                                    </span>
                                    <span className={styles.workerStatsDropdownItemText}>
                                        <span className={styles.workerStatsDropdownItemTitle}>Установить статус:</span>
                                        <span
                                            className={`${styles.workerStatsDropdownItemStatusValue} ${status === 'active' ? styles.statusInactive : styles.statusActive}`}
                                        >
                                            {isUpdatingStatus
                                                ? 'Обновление…'
                                                : (status === 'active' ? 'Не работает' : 'Работает')}
                                        </span>
                                    </span>
                                </button>

                                <div className={styles.workerStatsDropdownDivider} />

                                <button
                                    className={`${styles.workerStatsDropdownItem} ${styles.workerStatsDropdownItemDanger}`}
                                    onClick={handleOpenDeleteModal}
                                    role="menuitem"
                                >
                                    <span className={styles.workerStatsDropdownItemIcon}>
                                        <TrashBin />
                                    </span>
                                    <span className={styles.workerStatsDropdownItemText}>
                                        Удалить работника
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.workerStatsTabs}>
                    <button
                        className={`${styles.workerStatsTab} ${activeTab === 'month' ? styles.active : ''}`}
                        onClick={() => setActiveTab('month')}
                    >
                        <span className={styles.workerStatsTabIcon}>
                            <CalendarIcon />
                        </span>
                        <span className={styles.workerStatsTabLabel}>Рабочие дни</span>
                    </button>
                    <button
                        className={`${styles.workerStatsTab} ${activeTab === 'salary' ? styles.active : ''}`}
                        onClick={() => setActiveTab('salary')}
                    >
                        <span className={styles.workerStatsTabIcon}>
                            <Wallet />
                        </span>
                        <span className={styles.workerStatsTabLabel}>Зарплата</span>
                    </button>
                </div>

                {activeTab === 'month' && (
                    <div className={styles.workPeriodRow}>
                        <span className={styles.workPeriodCaption}>Показать:</span>
                        <div className={styles.workPeriodChips} ref={chipsRef}>
                            <button
                                className={`${styles.workPeriodChip} ${workPeriodMode === 'month' ? styles.active : ''}`}
                                onClick={() => setWorkPeriodMode('month')}
                                data-mode="month"
                                data-mode-active={workPeriodMode === 'month' ? 'true' : 'false'}
                            >
                                За месяц
                            </button>
                            <button
                                className={`${styles.workPeriodChip} ${workPeriodMode === 'quarter' ? styles.active : ''}`}
                                onClick={() => setWorkPeriodMode('quarter')}
                                data-mode="quarter"
                                data-mode-active={workPeriodMode === 'quarter' ? 'true' : 'false'}
                            >
                                За квартал
                            </button>
                            <button
                                className={`${styles.workPeriodChip} ${workPeriodMode === 'all' ? styles.active : ''}`}
                                onClick={() => setWorkPeriodMode('all')}
                                data-mode="all"
                                data-mode-active={workPeriodMode === 'all' ? 'true' : 'false'}
                            >
                                За весь период
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.workerStatsContent}>
                {activeTab === 'month' && (
                    <div className={styles.tabContent}>
                        {workPeriodMode === 'month' && (
                            <>
                                <div className={styles.monthSummary}>
                                    <div className={styles.monthSummaryCell}>
                                        <div className={styles.monthSummaryMonth}>{monthText}</div>
                                        <div className={styles.monthSummaryYear}>{yearText}</div>
                                    </div>
                                    <div className={styles.monthSummaryCell}>
                                        <div className={styles.monthSummaryNumber}>{monthData.totalDays}</div>
                                        <div className={styles.monthSummaryLabel}>{getDaysLabel(monthData.totalDays)}</div>
                                    </div>
                                </div>

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
                                                x: { type: "spring", stiffness: 500, damping: 35, mass: 0.5 },
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
                                                    <span className={styles.detailStatsName}>{worker.name.split(' ')[0]}</span>
                                                    {' работал в '}
                                                    <span className={styles.detailStatsMonth}>{getMonthPrepositional(currentMonth)}</span>
                                                    {monthData.siteList.length === 1 ? ' на объекте:' : ' на объектах:'}
                                                </div>
                                                <div className={styles.detailStatsObjects}>
                                                    {monthData.siteList.map((siteName) => {
                                                        const site = allSites.find(s => s.name === siteName)
                                                        const color = site?.color || '#666'
                                                        const siteShifts = monthData.shifts.filter(shift => shift.sites.includes(siteName))
                                                        const daysCount = siteShifts.length
                                                        const dayWord = getDaysWord(daysCount)
                                                        return (
                                                            <div key={siteName} className={styles.detailStatsObjectRow}>
                                                                <div className={styles.detailStatsObjectLeft}>
                                                                    <span
                                                                        className={styles.detailStatsObjectDot}
                                                                        style={{ backgroundColor: color, boxShadow: `0 0 16px ${color}, 0 0 32px ${color}40` }}
                                                                    />
                                                                    <span className={styles.detailStatsObjectName}>{siteName}</span>
                                                                </div>
                                                                <div className={styles.detailStatsObjectRight}>
                                                                    {daysCount} {dayWord}
                                                                </div>
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
                                <div className={styles.monthSummary}>
                                    <div className={styles.monthSummaryCell}>
                                        <div className={styles.monthSummaryMonth}>{quarterLabelParts.top}</div>
                                        <div className={styles.monthSummaryYear}>{quarterLabelParts.bottom}</div>
                                    </div>
                                    <div className={styles.monthSummaryCell}>
                                        <div className={styles.monthSummaryNumber}>{quarterData.totalDays}</div>
                                        <div className={styles.monthSummaryLabel}>{getDaysLabel(quarterData.totalDays)}</div>
                                    </div>
                                </div>

                                <AnimatePresence mode="popLayout" custom={quarterDirection}>
                                    <motion.div
                                        key={quarterKeyRef.current}
                                        custom={quarterDirection}
                                        variants={variants}
                                        initial={shouldAnimate ? "enter" : false}
                                        animate="center"
                                        exit="exit"
                                        transition={{
                                            x: { type: "spring", stiffness: 500, damping: 35, mass: 0.5 },
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
                                                const colors = getQuarterDayColors(tileDate)
                                                const classes = []
                                                if (colors && colors.length > 0) classes.push('colored-day')
                                                return classes.length > 0 ? classes : null
                                            }

                                            const quarterTileContent = ({ date: tileDate, view }) => {
                                                if (view !== 'month') return null
                                                const colors = getQuarterDayColors(tileDate)
                                                if (!colors || colors.length === 0) return null
                                                let background = ''
                                                if (colors.length === 1) background = colors[0]
                                                else if (colors.length === 2) background = `linear-gradient(to right, ${colors[0]} 50%, ${colors[1]} 50%)`
                                                else if (colors.length === 3) background = `linear-gradient(to right, ${colors[0]} 33.33%, ${colors[1]} 33.33%, ${colors[1]} 66.66%, ${colors[2]} 66.66%)`
                                                return (
                                                    <div style={{
                                                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                        background, borderRadius: '4px', zIndex: 0, pointerEvents: 'none',
                                                    }} />
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
                                                    <span className={styles.detailStatsName}>{worker.name.split(' ')[0]}</span>
                                                    {' работал за квартал на объектах:'}
                                                </div>
                                                <div className={styles.detailStatsObjects}>
                                                    {quarterData.siteList.map((site) => {
                                                        const fullSite = allSites.find(s => s.name === site.name)
                                                        const color = fullSite?.color || site.color || '#666'
                                                        const dayWord = getDaysWord(site.count)
                                                        return (
                                                            <div key={site.name} className={styles.detailStatsObjectRow}>
                                                                <div className={styles.detailStatsObjectLeft}>
                                                                    <span
                                                                        className={styles.detailStatsObjectDot}
                                                                        style={{ backgroundColor: color, boxShadow: `0 0 16px ${color}, 0 0 32px ${color}40` }}
                                                                    />
                                                                    <span className={styles.detailStatsObjectName}>{site.name}</span>
                                                                </div>
                                                                <div className={styles.detailStatsObjectRight}>
                                                                    {site.count} {dayWord}
                                                                </div>
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
                            <div className={styles.allPeriodBlock}>
                                <div className={styles.allPeriodHeader}>
                                    <div className={styles.allPeriodTitle}>Объекты за весь период</div>
                                    {siteStatsSortedByRelevance.length > 0 && (
                                        <div className={styles.allPeriodSummary}>
                                            {siteStatsSortedByRelevance.length} {getObjectsWord(siteStatsSortedByRelevance.length)}
                                            {' · '}
                                            {allPeriodTotalDays} {getDaysWord(allPeriodTotalDays)}
                                        </div>
                                    )}
                                </div>

                                {siteStatsSortedByRelevance.length > 0 ? (
                                    <div className={styles.allPeriodList}>
                                        {siteStatsSortedByRelevance.map((site) => {
                                            const isExpanded = expandedSites.has(site.siteId)
                                            return (
                                                <div
                                                    key={site.siteId}
                                                    className={`${styles.allPeriodCard} ${isExpanded ? styles.allPeriodCardExpanded : ''}`}
                                                >
                                                    <button
                                                        type="button"
                                                        className={styles.allPeriodCardHeader}
                                                        onClick={() => toggleSite(site.siteId)}
                                                        aria-expanded={isExpanded}
                                                    >
                                                        <span
                                                            className={styles.allPeriodDot}
                                                            style={{ backgroundColor: site.color }}
                                                        />
                                                        <span className={styles.allPeriodCardText}>
                                                            <span className={styles.allPeriodCardName}>{site.siteName}</span>
                                                            <span className={styles.allPeriodCardMeta}>{site.periodText}</span>
                                                        </span>
                                                        <span className={styles.allPeriodCardRight}>
                                                            <span className={styles.allPeriodCardDays}>
                                                                {site.totalDays} {getDaysWord(site.totalDays)}
                                                            </span>
                                                            <span className={`${styles.allPeriodChevron} ${isExpanded ? styles.allPeriodChevronOpen : ''}`}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="6 9 12 15 18 9"/>
                                                                </svg>
                                                            </span>
                                                        </span>
                                                    </button>
                                                    {isExpanded && (
                                                        <div className={styles.allPeriodCardBody}>
                                                            {site.dates.map((date) => (
                                                                <div key={date} className={styles.allPeriodDateRow}>
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
                                    <div className={styles.allPeriodEmpty}>Нет объектов за весь период</div>
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
                            <div className={styles.salaryPlaceholderText}>Информация о зарплате появится позже</div>
                        </div>
                    </div>
                )}
            </div>

            {showDeleteModal && (
                <div
                    className={styles.workerStatsDeleteModalOverlay}
                    onClick={handleCancelDelete}
                >
                    <div
                        className={styles.workerStatsDeleteModal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.workerStatsDeleteModalTitle}>Удалить работника</div>
                        <div className={styles.workerStatsDeleteModalText}>
                            Вы уверены, что хотите удалить <strong>{worker.name}</strong>?
                            <br />
                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
                                Работник будет перемещён в архив.
                            </span>
                        </div>
                        <div className={styles.workerStatsDeleteModalActions}>
                            <button
                                className={styles.workerStatsDeleteModalCancelBtn}
                                onClick={handleCancelDelete}
                                disabled={isDeleting}
                            >
                                Отмена
                            </button>
                            <button
                                className={styles.workerStatsDeleteModalConfirmBtn}
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Удаление…' : 'Удалить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <WorkerStatsFooter onEdit={onEdit} onClose={onClose} worker={worker} />
        </div>
    )
}