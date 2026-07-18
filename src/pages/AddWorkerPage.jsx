import { useState } from 'react'

export function AddWorkerPage({ onSave, onCancel }) {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!firstName.trim()) {
            setError('Введите имя')
            return
        }

        setLoading(true)
        setError('')

        try {
            const fullName = lastName.trim() 
                ? `${firstName.trim()} ${lastName.trim()}`
                : firstName.trim()
            await onSave(fullName)
            setFirstName('')
            setLastName('')
            onCancel()
        } catch (err) {
            setError(err.message || 'Ошибка при добавлении')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="add-worker-page">
            <div className="add-worker-header">
                <button className="add-worker-back" onClick={onCancel}>
                    ← Назад
                </button>
                <span className="add-worker-title">Новый работник</span>
                <button 
                    className="add-worker-save" 
                    onClick={handleSubmit}
                    disabled={loading || !firstName.trim()}
                >
                    {loading ? '...' : 'Сохранить'}
                </button>
            </div>

            <div className="add-worker-form">
                {error && (
                    <div className="add-worker-error">{error}</div>
                )}

                <div className="add-worker-field">
                    <label className="add-worker-label">Имя *</label>
                    <input
                        className="add-worker-input"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Например: Александр"
                        autoFocus
                    />
                </div>

                <div className="add-worker-field">
                    <label className="add-worker-label">Фамилия</label>
                    <input
                        className="add-worker-input"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Например: Петров"
                    />
                </div>

                <div className="add-worker-hint">
                    После добавления работник появится в списке
                </div>
            </div>
        </div>
    )
}
