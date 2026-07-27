// src/components/EditSiteModal.jsx

import { useState, useEffect } from 'react'
import styles from '../styles/components.module.css'

// 10 контрастных цветов (те же, что в AddSiteModal)
const COLORS = [
    '#FFC470', // Light Yellow
    '#E88210', // Dark Orange
    '#C03F3F', // Reddish
    '#C0317E', // Pink
    '#C2217D', // Violet
    '#2264F3', // Dark Blue
    '#27B4E0', // Light Blue
    '#27F0C1', // Aquamarine
    '#139520', // Dark Green
    '#B5B4B4', // Gray
]

// Список статусов
const STATUSES = [
    { value: 'в работе', label: 'В работе', color: '#2d7d46' },
    { value: 'завершен', label: 'Завершен', color: '#78909C' },
]

export function EditSiteModal({ isOpen, onClose, onSave, site }) {
    const [name, setName] = useState('')
    const [address, setAddress] = useState('')
    const [selectedColor, setSelectedColor] = useState(COLORS[0])
    const [status, setStatus] = useState('в работе')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Заполняем форму при открытии
    useEffect(() => {
        if (site && isOpen) {
            console.log('📝 Заполняем форму для:', site.name, 'статус:', site.status)
            setName(site.name || '')
            setAddress(site.address || '')
            // Находим цвет в палитре или используем первый
            const colorIndex = COLORS.findIndex(c => c === site.color)
            setSelectedColor(colorIndex !== -1 ? COLORS[colorIndex] : COLORS[0])
            setStatus(site.status || 'в работе')
            setError('')
        }
    }, [site, isOpen])

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!name.trim()) {
            setError('Введите название объекта')
            return
        }

        setLoading(true)
        setError('')

        try {
            console.log('📤 Отправляем в onSave:', {
                id: site.id,
                name: name.trim(),
                address: address.trim(),
                color: selectedColor,
                status: status
            })
            await onSave(site.id, name.trim(), address.trim(), selectedColor, status)
            onClose()
        } catch (err) {
            setError(err.message || 'Ошибка при обновлении')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null
    if (!site) return null

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <span className={styles.modalTitle}>Редактировать объект</span>
                </div>

                <div className={styles.modalBody}>
                    {error && (
                        <div className={styles.modalError}>{error}</div>
                    )}

                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>Название объекта</label>
                        <input
                            className={styles.modalInput}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Например: Дом на Ленина"
                        />
                    </div>

                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>Адрес</label>
                        <input
                            className={styles.modalInput}
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Например: ул. Ленина, 15"
                        />
                    </div>

                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>Статус</label>
                        <div className={styles.modalStatusWrapper}>
                            {STATUSES.map((s) => (
                                <button
                                    key={s.value}
                                    type="button"
                                    className={`${styles.modalStatusBtn} ${status === s.value ? styles.modalStatusActive : ''}`}
                                    onClick={() => setStatus(s.value)}
                                >
                                    <span 
                                        className={styles.modalStatusDot}
                                        style={{ backgroundColor: s.color }}
                                    />
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>Цвет объекта</label>
                        <div className={styles.modalColorPalette}>
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`${styles.modalColorBtn} ${selectedColor === color ? styles.modalColorActive : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setSelectedColor(color)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button 
                        className={styles.modalCancelBtn}
                        onClick={onClose}
                        type="button"
                        disabled={loading}
                    >
                        Отмена
                    </button>
                    <button 
                        className={styles.modalSaveBtn} 
                        onClick={handleSubmit}
                        disabled={loading || !name.trim()}
                        type="button"
                    >
                        {loading ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    )
}
