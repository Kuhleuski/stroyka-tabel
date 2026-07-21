import { useState } from 'react'

export function AddWorkerPage({ onSave, onCancel }) {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [avatarFile, setAvatarFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setAvatarFile(file)
            const reader = new FileReader()
            reader.onload = (e) => setPreviewUrl(e.target.result)
            reader.readAsDataURL(file)
        }
    }

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
            await onSave(fullName, avatarFile)
            setFirstName('')
            setLastName('')
            setAvatarFile(null)
            setPreviewUrl(null)
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

                <div className="add-worker-field">
                    <label className="add-worker-label">Фото</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="add-worker-input"
                        style={{ padding: '8px' }}
                    />
                    {previewUrl && (
                        <div style={{ marginTop: '8px' }}>
                            <img 
                                src={previewUrl} 
                                alt="Preview" 
                                style={{ 
                                    width: '80px', 
                                    height: '80px', 
                                    borderRadius: '50%', 
                                    objectFit: 'cover',
                                    border: '2px solid #e8eaed'
                                }} 
                            />
                        </div>
                    )}
                </div>

                <div className="add-worker-hint">
                    После добавления работник появится в списке
                </div>
            </div>
        </div>
    )
}
