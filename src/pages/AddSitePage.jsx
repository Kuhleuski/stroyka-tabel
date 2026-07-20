import { useState } from 'react'

// 20 контрастных цветов (обновленная палитра)
const COLORS = [
    '#DC143C', // алый
    '#FF6B35', // ярко-оранжевый
    '#F7931E', // мандарин
    '#FFD700', // золотой
    '#32CD32', // лайм
    '#00BFA5', // бирюзовый
    '#00B4D8', // ярко-голубой
    '#4A7CF7', // королевский синий
    '#7C4DFF', // фиолетовый
    '#E040FB', // ярко-пурпурный
    '#FF4081', // розовый
    '#FF6F91', // нежно-розовый
    '#FFAB91', // персиковый
    '#FFCC80', // светло-янтарный
    '#AED581', // светло-зеленый
    '#80DEEA', // светло-бирюзовый
    '#90CAF9', // светло-синий
    '#B39DDB', // светло-фиолетовый
    '#F48FB1', // светло-розовый
    '#EF9A9A', // светло-красный
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
