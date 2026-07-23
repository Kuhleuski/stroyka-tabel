import { useState } from 'react'
import styles from '../styles/sites.module.css'
import compStyles from '../styles/components.module.css'

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

export function AddSitePage({ onSave, onCancel }) {
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
            onCancel()
        } catch (err) {
            setError(err.message || 'Ошибка при добавлении')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.addSitePage}>
            <div className={styles.addSiteHeader}>
                <button className={styles.addSiteBack} onClick={onCancel}>
                    ← Назад
                </button>
                <span className={styles.addSiteTitle}>Новый объект</span>
                <button 
                    className={styles.addSiteSave} 
                    onClick={handleSubmit}
                    disabled={loading || !name.trim()}
                >
                    {loading ? '...' : 'Сохранить'}
                </button>
            </div>

            <div className={styles.addSiteForm}>
                {error && (
                    <div className={styles.addSiteError}>{error}</div>
                )}

                <div className={styles.addSiteField}>
                    <label className={styles.addSiteLabel}>Название объекта</label>
                    <input
                        className={styles.addSiteInput}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Например: Дом на Ленина"
                        autoFocus
                    />
                </div>

                <div className={styles.addSiteField}>
                    <label className={styles.addSiteLabel}>Адрес</label>
                    <input
                        className={styles.addSiteInput}
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Например: ул. Ленина, 15"
                    />
                </div>

                <div className={styles.addSiteField}>
                    <label className={styles.addSiteLabel}>Цвет объекта</label>
                    <div className={compStyles.colorPalette}>
                        {COLORS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                className={`${compStyles.colorBtn} ${selectedColor === color ? compStyles.active : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setSelectedColor(color)}
                            />
                        ))}
                    </div>
                </div>

                <div className={styles.addSiteHint}>
                    После добавления объект появится в списке
                </div>
            </div>
        </div>
    )
}
