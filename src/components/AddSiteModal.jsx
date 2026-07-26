import { useState } from 'react'
import styles from '../styles/components.module.css'

// 10 контрастных цветов
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

export function AddSiteModal({ isOpen, onClose, onSave }) {
    const [name, setName] = useState('')
    const [address, setAddress] = useState('')
    const [selectedColor, setSelectedColor] = useState(COLORS[0])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!name.trim()) {
            setError('Введите название объекта')
            return
        }

        setLoading(true)
        setError('')

        try {
            await onSave(name.trim(), address.trim(), selectedColor)
            setName('')
            setAddress('')
            setSelectedColor(COLORS[0])
            onClose()
        } catch (err) {
            setError(err.message || 'Ошибка при добавлении')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <span className={styles.modalTitle}>Новый объект</span>
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
                            autoFocus
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
