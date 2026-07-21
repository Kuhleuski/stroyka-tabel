import { useState } from 'react'

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
        <div className="add-site-page">
            <div className="add-site-header">
                <button className="add-site-back" onClick={onCancel}>
                    ← Назад
                </button>
                <span className="add-site-title">Новый объект</span>
                <button 
                    className="add-site-save" 
                    onClick={handleSubmit}
                    disabled={loading || !name.trim()}
                >
                    {loading ? '...' : 'Сохранить'}
                </button>
            </div>

            <div className="add-site-form">
                {error && (
                    <div className="add-site-error">{error}</div>
                )}

                <div className="add-site-field">
                    <label className="add-site-label">Название объекта</label>
                    <input
                        className="add-site-input"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Например: Дом на Ленина"
                        autoFocus
                    />
                </div>

                <div className="add-site-field">
                    <label className="add-site-label">Адрес</label>
                    <input
                        className="add-site-input"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Например: ул. Ленина, 15"
                    />
                </div>

                <div className="add-site-field">
                    <label className="add-site-label">Цвет объекта</label>
                    <div className="color-palette">
                        {COLORS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setSelectedColor(color)}
                            />
                        ))}
                    </div>
                </div>

                <div className="add-site-hint">
                    После добавления объект появится в списке
                </div>
            </div>
        </div>
    )
}
