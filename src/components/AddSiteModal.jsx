// src/components/AddSiteModal.jsx

import { useState, useEffect, useRef } from 'react'
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
// Закрашено 23 из 28 — «рядами», по горизонтали заполнено хорошо.
const MINI_CAL_FILLED = new Set([
    // Ряд 1 (0–6) — весь
    0, 1, 2, 3, 4, 5, 6,
    // Ряд 2 (7–13) — частично
    8, 9, 11, 12, 13,
    // Ряд 3 (14–20) — весь
    14, 15, 16, 17, 18, 19, 20,
    // Ряд 4 (21–27) — частично
    22, 23, 25, 26,
])

// Подписи дней недели над мини-календарём
const WEEKDAY_LABELS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']

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

export function AddSiteModal({ isOpen, onClose, onSave }) {
    const [name, setName] = useState('')
    const [address, setAddress] = useState('')
    const [selectedColor, setSelectedColor] = useState(COLORS[0])
    const [salaryPart, setSalaryPart] = useState('')
    const [photoFile, setPhotoFile] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showColorPicker, setShowColorPicker] = useState(false)

    const photoInputRef = useRef(null)
    const dragControls = useDragControls()

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

    const blurOnEnter = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!name.trim()) {
            setError('Введите название объекта')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Заглушки (фото, зарплата) в onSave НЕ передаются — по договорённости.
            await onSave(name.trim(), address.trim(), selectedColor)
            setName('')
            setAddress('')
            setSelectedColor(COLORS[0])
            setSalaryPart('')
            handleRemovePhoto()
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

                            <div className={styles.yandexBody}>
                                {error && (
                                    <div className={styles.modalError}>{error}</div>
                                )}

                                <div className={styles.yandexField}>
                                    <label className={styles.yandexLabel}>Название объекта</label>
                                    <input
                                        className={styles.yandexInput}
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onKeyDown={blurOnEnter}
                                        enterKeyHint="done"
                                        placeholder="Например: Дом на Ленина"
                                    />
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

                                {/* Цвет: серая область — подсказка сверху, кнопка+календарь, без label */}
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

                                            <div className={styles.yandexMiniCalendarWrap} aria-hidden="true">
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
                                            </div>
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
                                            onChange={(e) => setSalaryPart(e.target.value.replace(/\D/g, ''))}
                                            onKeyDown={blurOnEnter}
                                            enterKeyHint="done"
                                            placeholder="Например: 5000"
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
                            </div>

                            <div className={styles.yandexFooter}>
                                <button
                                    type="button"
                                    className={styles.yandexSaveBtn}
                                    onClick={handleSubmit}
                                    disabled={loading || !name.trim()}
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