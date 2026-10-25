// src/components/AddSiteModal.jsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import Xmark from '@gravity-ui/icons/Xmark'
import { Camera } from '@gravity-ui/icons'
import styles from '../styles/components.module.css'

// 30 цветов для объектов.
// ВАЖНО: первые 10 (существующие) сохранены байт-в-байт — на них уже созданы объекты в БД.
// #FFC470 — первый (дефолт). Остальные 29 перемешаны.
const COLORS = [
    '#FFC470', // Light Yellow — дефолт (существующий)
    // === 9 существующих (перемешаны) ===
    '#27B4E0', // Light Blue
    '#B5B4B4', // Gray
    '#C03F3F', // Reddish
    '#2264F3', // Dark Blue
    '#139520', // Dark Green
    '#C0317E', // Pink
    '#E88210', // Dark Orange
    '#27F0C1', // Aquamarine
    '#C2217D', // Violet
    // === 20 новых (перемешаны по спектру) ===
    '#F5A623', // Amber
    '#D0021B', // Crimson
    '#8B572A', // Brown
    '#7ED321', // Lime
    '#417505', // Forest
    '#50E3C2', // Teal
    '#4A90E2', // Sky Blue
    '#9013FE', // Purple
    '#BD10E0', // Magenta
    '#F8E71C', // Bright Yellow
    '#FF6F61', // Coral
    '#6B5B95', // Slate Purple
    '#88B04B', // Moss
    '#F7CAC9', // Rose Quartz
    '#92A8D1', // Serenity
    '#955251', // Marsala
    '#B565A7', // Orchid
    '#009B77', // Emerald
    '#DD4124', // Tangerine
    '#45B8AC', // Turquoise
]

// Паттерн закраски мини-календаря (28 ячеек, индексы 0..27).
// Воскресенья (6, 13, 20, 27) — пустые.
// Субботы: 5, 12 — пустые; 19, 26 — заняты.
const MINI_CAL_FILLED = new Set([
    0, 1, 2, 3, 4,
    8, 9, 11,
    14, 15, 16, 17, 18,
    19,
    22, 23, 25,
    26,
])

// Подписи дней недели над мини-календарём
const WEEKDAY_LABELS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']

// Случайный дефолтный цвет: из неиспользованных, иначе из всех
function pickDefaultColor(usedColors) {
    const used = new Set((usedColors || []).filter(Boolean))
    const available = COLORS.filter(c => !used.has(c))
    const pool = available.length > 0 ? available : COLORS
    return pool[Math.floor(Math.random() * pool.length)]
}

// Форматирование зарплаты: 50000 → «50 000»
function formatSalary(raw) {
    const digits = (raw || '').replace(/\D/g, '')
    if (!digits) return ''
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// Маленькая модалка выбора цвета (центрированная карточка)
function ColorPickerModal({ isOpen, currentColor, onSelect, onClose }) {
    const [tempColor, setTempColor] = useState(currentColor)

    if (!isOpen) return null

    const handleConfirm = () => {
        onSelect(tempColor)
        onClose()
    }

    return (
        <div className={styles.colorPickerOverlay} onClick={onClose}>
            <div className={styles.colorPickerCard} onClick={(e) => e.stopPropagation()}>
                <div className={styles.colorPickerHeader}>
                    <span className={styles.colorPickerTitle}>Цвет объекта</span>
                </div>

                <div className={styles.colorPickerGrid}>
                    {COLORS.map((color) => (
                        <button
                            key={color}
                            type="button"
                            className={`${styles.colorPickerSwatch} ${tempColor === color ? styles.colorPickerSwatchActive : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setTempColor(color)}
                            aria-label={`Цвет ${color}`}
                        />
                    ))}
                </div>

                <div className={styles.colorPickerFooter}>
                    <button
                        type="button"
                        className={styles.colorPickerCancelBtn}
                        onClick={onClose}
                    >
                        Отмена
                    </button>
                    <button
                        type="button"
                        className={styles.colorPickerConfirmBtn}
                        onClick={handleConfirm}
                    >
                        Выбрать
                    </button>
                </div>
            </div>
        </div>
    )
}

// Нижний отступ трека скроллбара: 24px + safe-area
// (чтобы на iPhone трек не заезжал под home-индикатор).
const SCROLL_TRACK_BOTTOM_PADDING = 24

// Обязательные поля. Расширяемо: добавляешь новый объект — он автоматически
// участвует в валидации, скролле и подсветке.
const REQUIRED_FIELDS = [
    {
        key: 'name',
        label: 'Название объекта',
        message: 'Укажите название объекта',
        isEmpty: (value) => !value || !String(value).trim(),
    },
]

export function AddSiteModal({ isOpen, onClose, onSave, usedColors = [] }) {
    const [name, setName] = useState('')
    const [address, setAddress] = useState('')
    const [selectedColor, setSelectedColor] = useState(COLORS[0])
    const [salaryPart, setSalaryPart] = useState('')
    const [photoFile, setPhotoFile] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showColorPicker, setShowColorPicker] = useState(false)

    // === Валидация: какие поля сейчас в ошибке ===
    // { [key]: true } — подсветка + сообщение под полем.
    const [invalidFields, setInvalidFields] = useState({})
    // Плашки, которые сейчас плавно гаснут при раннем вводе (280мс)
    const [hidingErrors, setHidingErrors] = useState({})
    // Таймеры автосброса подсветки (3 сек), чтобы «не висело» бесконечно
    const invalidTimersRef = useRef({})
    // Таймеры плавного ухода плашки при раннем вводе (280мс)
    const hideTimersRef = useRef({})

    const photoInputRef = useRef(null)
    const dragControls = useDragControls()

    // Ссылки на DOM-элементы полей (для скролла и фокуса)
    const fieldRefs = useRef({})

    // === Свой постоянный скроллбар внутри .yandexBody ===
    const bodyRef = useRef(null)
    const [scrollbar, setScrollbar] = useState({
        visible: false,
        top: 0,
        height: 0,
        trackTop: 0,
        trackHeight: 0,
    })

    const updateScrollbar = useCallback(() => {
        const el = bodyRef.current
        if (!el) return

        const { scrollTop, scrollHeight, clientHeight } = el
        const hasOverflow = scrollHeight - clientHeight > 1

        if (!hasOverflow) {
            setScrollbar((prev) =>
                prev.visible
                    ? { visible: false, top: 0, height: 0, trackTop: 0, trackHeight: 0 }
                    : prev
            )
            return
        }

        // Позиция .yandexBody относительно .yandexSheet.
        // .yandexSheet имеет position: relative — absolute-трек
        // позиционируется именно относительно шторки.
        const sheet = el.closest('[class*="yandexSheet"]')
        let bodyOffsetTop = 0
        if (sheet) {
            const sheetRect = sheet.getBoundingClientRect()
            const bodyRect = el.getBoundingClientRect()
            bodyOffsetTop = bodyRect.top - sheetRect.top
        }

        // Видимая высота трека = высота .yandexBody минус нижний отступ
        // (24px + safe-area), чтобы трек не уходил под низ шторки.
        const safeArea = (() => {
            if (typeof window === 'undefined' || !window.getComputedStyle) return 0
            const probe = document.createElement('div')
            probe.style.position = 'fixed'
            probe.style.bottom = '0'
            probe.style.height = 'env(safe-area-inset-bottom, 0px)'
            probe.style.visibility = 'hidden'
            probe.style.pointerEvents = 'none'
            document.body.appendChild(probe)
            const h = probe.getBoundingClientRect().height
            document.body.removeChild(probe)
            return h
        })()

        const bottomInset = SCROLL_TRACK_BOTTOM_PADDING + safeArea
        const visibleTrackH = Math.max(0, clientHeight - bottomInset)

        if (visibleTrackH <= 0) {
            setScrollbar((prev) =>
                prev.visible
                    ? { visible: false, top: 0, height: 0, trackTop: 0, trackHeight: 0 }
                    : prev
            )
            return
        }

        // thumb в 2 раза короче пропорционального, но не меньше 28px.
        // Трек (visibleTrackH) остаётся на всю видимую высоту,
        // поэтому thumb проезжает всю амплитуду и упирается в низ трека,
        // когда контент доскроллен до конца.
        const proportionalThumbH = (clientHeight / scrollHeight) * visibleTrackH
        const thumbH = Math.max(28, proportionalThumbH * 0.5)
        const maxScrollTop = scrollHeight - clientHeight
        const maxThumbTop = visibleTrackH - thumbH
        const thumbTop = maxScrollTop > 0
            ? (scrollTop / maxScrollTop) * maxThumbTop
            : 0

        setScrollbar({
            visible: true,
            top: thumbTop,
            height: thumbH,
            trackTop: bodyOffsetTop,
            trackHeight: visibleTrackH,
        })
    }, [])

    // Пересчёт при открытии + при скролле + при ресайзе + при изменениях контента
    useEffect(() => {
        if (!isOpen) return
        const el = bodyRef.current
        if (!el) return

        const raf = requestAnimationFrame(updateScrollbar)

        el.addEventListener('scroll', updateScrollbar, { passive: true })

        const ro = new ResizeObserver(updateScrollbar)
        ro.observe(el)
        Array.from(el.children).forEach((child) => ro.observe(child))

        window.addEventListener('resize', updateScrollbar)

        return () => {
            cancelAnimationFrame(raf)
            el.removeEventListener('scroll', updateScrollbar)
            ro.disconnect()
            window.removeEventListener('resize', updateScrollbar)
        }
    }, [isOpen, updateScrollbar])

    // usedColors в ref — чтобы useEffect зависел только от isOpen,
    // и рандомный дефолт не пересчитывался на каждый ререндер SitesPage.
    const usedColorsRef = useRef(usedColors)
    usedColorsRef.current = usedColors

    // Дефолтный цвет — только при переходе «закрыто → открыто».
    const prevIsOpenRef = useRef(false)
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            setSelectedColor(pickDefaultColor(usedColorsRef.current))
        }
        prevIsOpenRef.current = isOpen
    }, [isOpen])

    // Блокировка скролла фона, пока модалка открыта
    useEffect(() => {
        if (!isOpen) return

        const scrollY = window.scrollY
        const originalOverflow = document.body.style.overflow
        const originalPosition = document.body.style.position
        const originalTop = document.body.style.top
        const originalWidth = document.body.style.width

        document.body.style.overflow = 'hidden'
        document.body.style.position = 'fixed'
        document.body.style.top = `-${scrollY}px`
        document.body.style.width = '100%'

        return () => {
            document.body.style.overflow = originalOverflow
            document.body.style.position = originalPosition
            document.body.style.top = originalTop
            document.body.style.width = originalWidth
            window.scrollTo(0, scrollY)
        }
    }, [isOpen])

    // Освобождение objectURL при смене/закрытии
    useEffect(() => {
        return () => {
            if (photoPreview) URL.revokeObjectURL(photoPreview)
        }
    }, [photoPreview])

    // При закрытии модалки — чистим все таймеры подсветки и плашек
    useEffect(() => {
        if (isOpen) return
        Object.values(invalidTimersRef.current).forEach(clearTimeout)
        Object.values(hideTimersRef.current).forEach(clearTimeout)
        invalidTimersRef.current = {}
        hideTimersRef.current = {}
        setInvalidFields({})
        setHidingErrors({})
    }, [isOpen])

    const handlePhotoSelect = (e) => {
        const file = e.target.files && e.target.files[0]
        if (!file) return
        if (photoPreview) URL.revokeObjectURL(photoPreview)
        setPhotoFile(file)
        setPhotoPreview(URL.createObjectURL(file))
        e.target.value = ''
    }

    const handleRemovePhoto = () => {
        if (photoPreview) URL.revokeObjectURL(photoPreview)
        setPhotoFile(null)
        setPhotoPreview(null)
    }

    // Enter → blur (для текстовых полей «Название», «Адрес»)
    const blurOnEnter = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
        }
    }

    // Клик по пустому месту в теле формы — скрыть клавиатуру
    const handleBodyClick = (e) => {
        const tag = (e.target.tagName || '').toLowerCase()
        if (tag === 'input' || tag === 'textarea' || tag === 'button') return
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur()
        }
    }

    // === Вспомогательные функции валидации ===

    // Снять подсветку с поля (например, когда пользователь начал печатать).
    // Плашка и обводка уходят плавно (~280мс), затем DOM очищается.
    const clearFieldError = (key) => {
        if (!invalidFields[key] && !hidingErrors[key]) return

        // Снимаем таймаут автосброса (3с)
        if (invalidTimersRef.current[key]) {
            clearTimeout(invalidTimersRef.current[key])
            delete invalidTimersRef.current[key]
        }

        // Переводим плашку в плавно угасающую фазу
        setHidingErrors(prev => ({ ...prev, [key]: true }))

        if (hideTimersRef.current[key]) {
            clearTimeout(hideTimersRef.current[key])
        }
        hideTimersRef.current[key] = setTimeout(() => {
            setInvalidFields(prev => {
                if (!prev[key]) return prev
                const next = { ...prev }
                delete next[key]
                return next
            })
            setHidingErrors(prev => {
                if (!prev[key]) return prev
                const next = { ...prev }
                delete next[key]
                return next
            })
            delete hideTimersRef.current[key]
        }, 280)
    }

    // Показать подсветку для поля + автосброс через 3 секунды,
    // если пользователь так и не начал печатать.
    const markFieldInvalid = (key) => {
        setInvalidFields(prev => ({ ...prev, [key]: true }))
        if (invalidTimersRef.current[key]) {
            clearTimeout(invalidTimersRef.current[key])
        }
        invalidTimersRef.current[key] = setTimeout(() => {
            setInvalidFields(prev => {
                if (!prev[key]) return prev
                const next = { ...prev }
                delete next[key]
                return next
            })
            delete invalidTimersRef.current[key]
        }, 3000)
    }

    // Плавный скролл к полю + фокус (если браузер позволяет)
    const scrollToField = (key) => {
        const node = fieldRefs.current[key]
        if (!node) return
        try {
            node.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } catch (e) {
            // fallback, если scrollIntoView с опциями не поддерживается
            node.scrollIntoView()
        }
        // Небольшая задержка, чтобы скролл успел стартовать,
        // и фокус не отменял плавность.
        setTimeout(() => {
            try {
                const input = node.querySelector('input, textarea, select')
                if (input && typeof input.focus === 'function') {
                    input.focus({ preventScroll: true })
                }
            } catch (e) { /* no-op */ }
        }, 300)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // 1. Собираем все невалидные обязательные поля
        const values = { name }
        const invalidKeys = REQUIRED_FIELDS
            .filter(field => field.isEmpty(values[field.key]))
            .map(field => field.key)

        if (invalidKeys.length > 0) {
            // 2. Подсвечиваем ВСЕ невалидные поля и ставим таймеры автосброса
            invalidKeys.forEach(key => markFieldInvalid(key))
            // 3. Скроллим к первому невалидному полю
            scrollToField(invalidKeys[0])
            // 4. POST не отправляем
            return
        }

        setLoading(true)
        setError('')

        try {
            // Фото остаётся заглушкой (в onSave не передаётся).
            // Зарплатная часть передаётся 4-м аргументом; SitesPage приведёт её к числу/null.
            await onSave(name.trim(), address.trim(), selectedColor, salaryPart)
            setName('')
            setAddress('')
            setSalaryPart('')
            handleRemovePhoto()
            setInvalidFields({})
            setHidingErrors({})
            onClose()
        } catch (err) {
            setError(err.message || 'Ошибка при добавлении')
        } finally {
            setLoading(false)
        }
    }

    const handleDragEnd = (event, info) => {
        if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose()
        }
    }

    // Проверка, есть ли у поля ошибка
    const isInvalid = (key) => !!invalidFields[key]

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="add-site-bottom-sheet"
                        className={styles.yandexOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                    >
                        <motion.div
                            className={styles.yandexSheet}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'tween', duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                            drag="y"
                            dragControls={dragControls}
                            dragListener={false}
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={{ top: 0, bottom: 0.2 }}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div
                                className={styles.yandexHandleZone}
                                onPointerDown={(e) => dragControls.start(e)}
                            >
                                <div className={styles.yandexHandle} />
                            </div>

                            <div
                                className={styles.yandexHeader}
                                onPointerDown={(e) => dragControls.start(e)}
                            >
                                <h2 className={styles.yandexTitle}>Добавить объект</h2>
                                <button
                                    type="button"
                                    className={styles.yandexCloseBtn}
                                    onClick={onClose}
                                    aria-label="Закрыть"
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <Xmark />
                                </button>
                            </div>

                            <div
                                ref={bodyRef}
                                className={styles.yandexBody}
                                onClick={handleBodyClick}
                            >
                                {error && (
                                    <div className={styles.modalError}>{error}</div>
                                )}

                                {/* === Название объекта (обязательное) === */}
                                <div
                                    className={`${styles.yandexField} ${styles.yandexFieldRequired}`}
                                    ref={(el) => { fieldRefs.current.name = el }}
                                >
                                    <label className={styles.yandexLabel}>
                                        Название объекта
                                        <span className={styles.yandexRequired}>обязательно</span>
                                    </label>
                                    <input
                                        className={`${styles.yandexInput} ${isInvalid('name') ? styles.yandexInputError : ''}`}
                                        type="text"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value)
                                            if (isInvalid('name') && e.target.value.trim()) {
                                                clearFieldError('name')
                                            }
                                        }}
                                        onKeyDown={blurOnEnter}
                                        enterKeyHint="done"
                                        placeholder="Например: Дом на Ленина"
                                        aria-invalid={isInvalid('name')}
                                    />
                                    {(isInvalid('name') || hidingErrors.name) && (
                                        <div
                                            className={`${styles.yandexFieldError} ${hidingErrors.name ? styles.yandexFieldErrorHiding : ''}`}
                                        >
                                            Укажите название объекта
                                        </div>
                                    )}
                                </div>

                                <div className={`${styles.yandexField} ${styles.yandexFieldAddress}`}>
                                    <label className={styles.yandexLabel}>Адрес</label>
                                    <input
                                        className={styles.yandexInput}
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        onKeyDown={blurOnEnter}
                                        enterKeyHint="done"
                                        placeholder="Например: ул. Ленина, 15"
                                    />
                                </div>

                                {/* Цвет: серая область — подсказка сверху, кнопка+календарь */}
                                <div className={`${styles.yandexField} ${styles.yandexFieldColor}`}>
                                    <div className={styles.yandexColorBox}>
                                        <p className={styles.yandexColorHint}>
                                            Цвет, которым отмечаются рабочие дни в календаре
                                        </p>

                                        <div className={styles.yandexColorRow}>
                                            <button
                                                type="button"
                                                className={styles.yandexColorTriggerCompact}
                                                onClick={() => setShowColorPicker(true)}
                                            >
                                                <span
                                                    className={styles.yandexColorSwatch}
                                                    style={{ backgroundColor: selectedColor }}
                                                />
                                                <span className={styles.yandexColorTriggerLabel}>Выбрать цвет</span>
                                                <span className={styles.yandexColorChevron}>›</span>
                                            </button>

                                            <button
                                                type="button"
                                                className={styles.yandexMiniCalendarWrap}
                                                onClick={() => setShowColorPicker(true)}
                                                aria-label="Выбрать цвет"
                                            >
                                                {WEEKDAY_LABELS.map((d, i) => (
                                                    <span key={`d-${i}`} className={styles.yandexMiniCalendarDayLabel}>
                                                        {d}
                                                    </span>
                                                ))}
                                                {Array.from({ length: 28 }).map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className={styles.yandexMiniCalendarCell}
                                                        style={
                                                            MINI_CAL_FILLED.has(i)
                                                                ? { backgroundColor: selectedColor }
                                                                : undefined
                                                        }
                                                    />
                                                ))}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.yandexField}>
                                    <label className={styles.yandexLabel}>Зарплатная часть</label>
                                    <div className={styles.yandexSalaryWrap}>
                                        <input
                                            className={`${styles.yandexInput} ${styles.yandexSalaryInput}`}
                                            type="text"
                                            inputMode="numeric"
                                            value={salaryPart}
                                            onChange={(e) => setSalaryPart(formatSalary(e.target.value))}
                                            placeholder="Например: 50 000"
                                        />
                                        <span className={styles.yandexSalarySuffix}>BYN</span>
                                    </div>
                                </div>

                                {/* Фото — в конце, зона-дропзона */}
                                <div className={styles.yandexField}>
                                    <label className={styles.yandexLabel}>Фото объекта</label>

                                    {photoPreview ? (
                                        <div className={styles.yandexPhotoPreviewWrap}>
                                            <img
                                                src={photoPreview}
                                                alt="Превью"
                                                className={styles.yandexPhotoPreview}
                                            />
                                            <button
                                                type="button"
                                                className={styles.yandexPhotoRemove}
                                                onClick={handleRemovePhoto}
                                                aria-label="Удалить фото"
                                            >
                                                <Xmark />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className={styles.yandexPhotoZone}
                                            onClick={() => photoInputRef.current && photoInputRef.current.click()}
                                        >
                                            <Camera className={styles.yandexPhotoZoneIcon} />
                                            <span className={styles.yandexPhotoZoneText}>Загрузить фото</span>
                                        </button>
                                    )}

                                    <input
                                        ref={photoInputRef}
                                        type="file"
                                        accept="image/*"
                                        className={styles.yandexHiddenInput}
                                        onChange={handlePhotoSelect}
                                    />
                                </div>

                                {/* === НОВЫЙ потоковый футер (внизу контента) === */}
                                <div className={styles.yandexFooterInline}>
                                    <button
                                        type="button"
                                        className={styles.yandexSaveBtnInline}
                                        onClick={handleSubmit}
                                        disabled={loading}
                                    >
                                        {loading ? 'Сохранение...' : 'Сохранить'}
                                    </button>
                                </div>
                            </div>

                            {/* === Свой постоянный скроллбар (виден при переполнении) === */}
                            {scrollbar.visible && (
                                <div
                                    className={styles.yandexBodyScrollTrack}
                                    style={{
                                        top: scrollbar.trackTop,
                                        height: scrollbar.trackHeight,
                                    }}
                                    aria-hidden="true"
                                >
                                    <div
                                        className={styles.yandexBodyScrollThumb}
                                        style={{
                                            top: scrollbar.top,
                                            height: scrollbar.height,
                                        }}
                                    />
                                </div>
                            )}

                            {/* === СТАРЫЙ футер (flex-bottom) — закомментирован, не удалён === */}
                            {/*
                            <div className={styles.yandexFooter}>
                                <button
                                    type="button"
                                    className={styles.yandexSaveBtn}
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? 'Сохранение...' : 'Сохранить'}
                                </button>
                            </div>
                            */}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ColorPickerModal
                isOpen={showColorPicker}
                currentColor={selectedColor}
                onSelect={setSelectedColor}
                onClose={() => setShowColorPicker(false)}
            />
        </>
    )
}