import { useState } from 'react'
import InputMask from 'react-input-mask'
import styles from '../styles/components.module.css'

export function AddWorkerModal({ isOpen, onClose, onSave }) {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')
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
            
            const digits = phone.replace(/\D/g, '')
            let finalPhone = digits || ''
            if (finalPhone && !finalPhone.startsWith('375')) {
                finalPhone = '375' + finalPhone
            }
            
            await onSave(fullName, avatarFile, finalPhone)
            setFirstName('')
            setLastName('')
            setPhone('')
            setAvatarFile(null)
            setPreviewUrl(null)
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
                    <span className={styles.modalTitle}>Новый работник</span>
                </div>

                <div className={styles.modalBody}>
                    {error && (
                        <div className={styles.modalError}>{error}</div>
                    )}

                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>Имя *</label>
                        <input
                            className={styles.modalInput}
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Например: Александр"
                            autoFocus
                        />
                    </div>

                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>Фамилия</label>
                        <input
                            className={styles.modalInput}
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Например: Петров"
                        />
                    </div>

                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>Телефон</label>
                        <InputMask
                            mask="+375 (99) 999-99-99"
                            maskChar="_"
                            value={phone}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, '')
                                if (raw.length <= 12) {
                                    setPhone(e.target.value)
                                }
                            }}
                            placeholder="+375 (__) ___-__-__"
                        >
                            {(inputProps) => (
                                <input
                                    {...inputProps}
                                    type="tel"
                                    className={styles.modalInput}
                                    style={{ 
                                        padding: '10px 12px',
                                        fontFamily: 'monospace',
                                        fontSize: '16px',
                                        letterSpacing: '1px'
                                    }}
                                />
                            )}
                        </InputMask>
                    </div>

                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>Фото</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className={styles.modalInput}
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
                        disabled={loading || !firstName.trim()}
                        type="button"
                    >
                        {loading ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    )
}