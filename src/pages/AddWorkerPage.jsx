import { useState } from 'react'
import styles from '../styles/workers.module.css'
import compStyles from '../styles/components.module.css'

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
        <div className={styles.addWorkerPage}>
            <div className={styles.addWorkerHeader}>
                <button className={styles.addWorkerBack} onClick={onCancel}>
                    ← Назад
                </button>
                <span className={styles.addWorkerTitle}>Новый работник</span>
                <button 
                    className={styles.addWorkerSave} 
                    onClick={handleSubmit}
                    disabled={loading || !firstName.trim()}
                >
                    {loading ? '...' : 'Сохранить'}
                </button>
            </div>

            <div className={styles.addWorkerForm}>
                {error && (
                    <div className={styles.addWorkerError}>{error}</div>
                )}

                <div className={styles.addWorkerField}>
                    <label className={styles.addWorkerLabel}>Имя *</label>
                    <input
                        className={styles.addWorkerInput}
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Например: Александр"
                        autoFocus
                    />
                </div>

                <div className={styles.addWorkerField}>
                    <label className={styles.addWorkerLabel}>Фамилия</label>
                    <input
                        className={styles.addWorkerInput}
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Например: Петров"
                    />
                </div>

                <div className={styles.addWorkerField}>
                    <label className={styles.addWorkerLabel}>Фото</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={`${styles.addWorkerInput} ${compStyles.addWorkerInput}`}
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

                <div className={styles.addWorkerHint}>
                    После добавления работник появится в списке
                </div>
            </div>
        </div>
    )
}
