import { useState } from 'react'

// 20 контрастных цветов
const COLORS = [
    '#E53935', // красный
    '#D81B60', // розовый
    '#8E24AA', // фиолетовый
    '#5E35B1', // темно-фиолетовый
    '#1E88E5', // синий
    '#039BE5', // голубой
    '#00ACC1', // бирюзовый
    '#00897B', // темно-бирюзовый
    '#43A047', // зеленый
    '#7CB342', // салатовый
    '#C0CA33', // лимонный
    '#FDD835', // желтый
    '#FFB300', // янтарный
    '#FB8C00', // оранжевый
    '#F4511E', // красно-оранжевый
    '#6D4C41', // коричневый
    '#8D6E63', // светло-коричневый
    '#78909C', // серо-голубой
    '#546E7A', // темно-серо-голубой
    '#37474F', // темно-серый
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
