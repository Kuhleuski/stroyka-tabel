import { useState } from 'react'

export function AddSitePage({ onSave, onCancel }) {
    const [name, setName] = useState('')
    const [address, setAddress] = useState('')
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
            await onSave(name.trim(), address.trim())
            setName('')
            setAddress('')
            onCancel() // возвращаемся на список
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

                <div className="add-site-hint">
                    После добавления объект появится в списке
                </div>
            </div>
        </div>
    )
}
