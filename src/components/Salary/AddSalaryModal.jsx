import { useState } from 'react'
import styles from '../../styles/components.module.css'

export function AddSalaryModal({ isOpen, onClose, onSave, workers }) {
    const [workerId, setWorkerId] = useState('')
    const [amount, setAmount] = useState('')
    const [paymentDate, setPaymentDate] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!workerId) {
            setError('Выберите работника')
            return
        }
        if (!amount || parseInt(amount) <= 0) {
            setError('Введите сумму')
            return
        }
        if (!paymentDate) {
            setError('Выберите дату')
            return
        }

        setLoading(true)
        setError('')

        try {
            await onSave(parseInt(workerId), parseInt(amount), paymentDate)
            setWorkerId('')
            setAmount('')
            setPaymentDate('')
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
                    <span className={styles.modalTitle}>Добавить выплату</span>
                </div>

                <div className={styles.modalBody}>
                    {error && (
                        <div className={styles.modalError}>{error}</div>
                    )}

                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>Работник *</label>
                        <select
                            className={styles.modalSelect}
                            value={workerId}
                            onChange={(e) => setWorkerId(e.target.value)}
                        >
                            <option value="">Выберите работника</option>
                            {workers.map((worker) => (
                                <option key={worker.id} value={worker.id}>
                                    {worker.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>Сумма (BYN) *</label>
                        <input
                            className={styles.modalInput}
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Например: 1200"
                            min="1"
                        />
                    </div>

                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>Дата выплаты *</label>
                        <input
                            className={styles.modalInput}
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button 
                        className={styles.modalCancelBtn}
                        onClick={onClose}
                        type="button"
                        disabled={loading}
                    >
                        Отмена
                    </button>
                    <button 
                        className={styles.modalSaveBtn} 
                        onClick={handleSubmit}
                        disabled={loading}
                        type="button"
                    >
                        {loading ? 'Сохранение...' : 'Добавить'}
                    </button>
                </div>
            </div>
        </div>
    )
}