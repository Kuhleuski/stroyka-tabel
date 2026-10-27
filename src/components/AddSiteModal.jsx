// src/components/AddSiteModal.jsx

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import Xmark from '@gravity-ui/icons/Xmark'
import { Camera } from '@gravity-ui/icons'
import { compressSquare } from '../services/supabase'
import styles from '../styles/components.module.css'

// 30 цветов для объектов.
// Первые 10 (существующие) сохранены байт-в-байт — на них уже созданы объекты в БД.
// #FFC470 — первый (дефолт). Остальные 29 перемешаны.
const COLORS = [
    '#FFC470',
    '#27B4E0',
    '#B5B4B4',
    '#C03F3F',
    '#2264F3',
    '#139520',
    '#C0317E',
    '#E88210',
    '#27F0C1',
    '#C2217D',
    '#F5A623',
    '#D0021B',
    '#8B572A',
    '#7ED321',
    '#417505',
    '#50E3C2',
    '#4A90E2',
    '#9013FE',
    '#BD10E0',
    '#F8E71C',
    '#FF6F61',
    '#6B5B95',
    '#88B04B',
    '#F7CAC9',
    '#92A8D1',
    '#955251',
    '#B565A7',
    '#009B77',
    '#DD4124',
    '#45B8AC',
]

const MINI_CAL_FILLED = new Set([
    0, 1, 2, 3, 4,
    8, 9, 11,
    14, 15, 16, 17, 18,
    19,
    22, 23, 25,
    26,
])

const WEEKDAY_LABELS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']

function pickDefaultColor(usedColors) {
    const used = new Set((usedColors || []).filter(Boolean))
    const available = COLORS.filter(c => !used.has(c))
    const pool = available.length > 0 ? available : COLORS
    return pool[Math.floor(Math.random() * pool.length)]
}

function formatSalary(raw) {
    const digits = (raw || '').replace(/\D/g, '')
    if (!digits) return ''
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// '' → null, '50 000' → 50000, '0' → 0
function parseSalary(raw) {
    if (raw === null || raw === undefined) return null
    const cleaned = String(raw).replace(/\D/g, '')
    if (cleaned === '') return null
    return Number(cleaned)
}

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
    // Base64 dataURL с префиксом — он же превью (квадрат 250×250)
    const [photoBase64, setPhotoBase64] = useState(null)
    const [photoProcessing, setPhotoProcessing] = useState(false)
    const [photoError, setPhotoError] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showColorPicker, setShowColorPicker] = useState(false)

    const [invalidFields, setInvalidFields] = useState({})
    const [hidingErrors, setHidingErrors] = useState({})
    const invalidTimersRef = useRef({})
    const hideTimersRef = useRef({})

    const photoInputRef = useRef(null)
    const dragControls = useDragControls()

    const fieldRefs = useRef({})

    const usedColorsRef = useRef(usedColors)
    usedColorsRef.current = usedColors

    const prevIsOpenRef = useRef(false)
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            setSelectedColor(pickDefaultColor(usedColorsRef.current))
        }
        prevIsOpenRef.current = isOpen
    }, [isOpen])

    // Блокировка скролла фона
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

    // При закрытии — сброс валидации и таймеров
    useEffect(() => {
        if (isOpen) return
        Object.values(invalidTimersRef.current).forEach(clearTimeout)
        Object.values(hideTimersRef.current).forEach(clearTimeout)
        invalidTimersRef.current = {}
        hideTimersRef.current = {}
        setInvalidFields({})
        setHidingErrors({})
    }, [isOpen])

    // Сброс полей при закрытии (чтобы не копилось между открытиями)
    useEffect(() => {
        if (isOpen) return
        setName('')
        setAddress('')
        setSalaryPart('')
        setPhotoBase64(null)
        setPhotoError('')
        setPhotoProcessing(false)
        setError('')
    }, [isOpen])

    const handlePhotoSelect = async (e) => {
        const file = e.target.files && e.target.files[0]
        e.target.value = ''
        if (!file) return

        setPhotoError('')
        setPhotoProcessing(true)
        try {
            const dataUrl = await compressSquare(file, 250, 0.82)
            setPhotoBase64(dataUrl)
        } catch (err) {
            setPhotoError(err.message || 'Не удалось обработать фото')
        } finally {
            setPhotoProcessing(false)
        }
    }

    const handleRemovePhoto = () => {
        setPhotoBase64(null)
        setPhotoError('')
    }

    const blurOnEnter = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
        }
    }

    const handleBodyClick = (e) => {
        const tag = (e.target.tagName || '').toLowerCase()
        if (tag === 'input' || tag === 'textarea' || tag === 'button') return
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur()
        }
    }

    const clearFieldError = (key) => {
        if (!invalidFields[key] && !hidingErrors[key]) return

        if (invalidTimersRef.current[key]) {
            clearTimeout(invalidTimersRef.current[key])
            delete invalidTimersRef.current[key]
        }

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

    const scrollToField = (key) => {
        const node = fieldRefs.current[key]
        if (!node) return
        try {
            node.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } catch (e) {
            node.scrollIntoView()
        }
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
        if (loading || photoProcessing) return

        const values = { name }
        const invalidKeys = REQUIRED_FIELDS
            .filter(field => field.isEmpty(values[field.key]))
            .map(field => field.key)

        if (invalidKeys.length > 0) {
            invalidKeys.forEach(key => markFieldInvalid(key))
            scrollToField(invalidKeys[0])
            return
        }

        setLoading(true)
        setError('')

        try {
            await onSave({
                name: name.trim(),
                address: address.trim(),
                color: selectedColor,
                salaryPart: parseSalary(salaryPart),
                photo: photoBase64 || null,
            })
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

    const isInvalid = (key) => !!invalidFields[key]
    const saveDisabled = loading || photoProcessing

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
                                className={styles.yandexBody}
                                onClick={handleBodyClick}
                            >
                                {error && (
                                    <div className={styles.modalError}>{error}</div>
                                )}

                                <div
                                    className={`${styles.yandexField} ${styles.yandexFieldRequired}`}
                                    ref={(el) => { fieldRefs.current.name = el }}
                                >
                                    <label className={styles.yandexLabel}>
                                        Название объекта
                                        <span className={styles.yandexRequiredStar} aria-hidden="true">*</span>
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

                                {/* Фото — сразу после адреса, отступ снизу 30px */}
                                <div className={`${styles.yandexField} ${styles.yandexFieldPhotoAdd}`}>
                                    <label className={styles.yandexLabel}>Фото объекта</label>

                                    {photoBase64 ? (
                                        <div className={styles.yandexPhotoPreviewWrap}>
                                            <img
                                                src={photoBase64}
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
                                            onClick={() => {
                                                if (photoProcessing) return
                                                photoInputRef.current && photoInputRef.current.click()
                                            }}
                                            disabled={photoProcessing}
                                        >
                                            {photoProcessing ? (
                                                <>
                                                    <span className={styles.yandexPhotoSpinner} aria-hidden="true" />
                                                    <span className={styles.yandexPhotoZoneText}>Обработка...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Camera className={styles.yandexPhotoZoneIcon} />
                                                    <span className={styles.yandexPhotoZoneText}>Загрузить фото</span>
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {photoError && (
                                        <div className={styles.yandexPhotoError}>{photoError}</div>
                                    )}

                                    <input
                                        ref={photoInputRef}
                                        type="file"
                                        accept="image/*"
                                        className={styles.yandexHiddenInput}
                                        onChange={handlePhotoSelect}
                                    />
                                </div>

                                {/* Цвет — с лейблом над блоком: «Отметки в календаре» */}
                                <div className={`${styles.yandexField} ${styles.yandexFieldColor}`}>
                                    <label className={styles.yandexLabel}>Отметки в календаре</label>
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
                            </div>

                            {/* Футер прижат к низу шита (flex-shrink: 0), вне скроллящегося .yandexBody.
                                Градиент над футером — .yandexFooter::before (уже в CSS). */}
                            <div className={styles.yandexFooter}>
                                <button
                                    type="button"
                                    className={styles.yandexSaveBtn}
                                    onClick={handleSubmit}
                                    disabled={saveDisabled}
                                >
                                    {loading ? 'Сохранение...' : 'Сохранить'}
                                </button>
                            </div>
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