import React from 'react'
import ReactDOM from 'react-dom'
import styles from '../../styles/shifts.module.css'

export function ShiftFormFooter({ onClose, onSave, loading, isEditMode }) {
  const footerContent = (
    <div className={styles.shiftFormFooter}>
      <button 
        type="button" 
        className={styles.shiftFormCloseBtn}
        onClick={onClose}
      >
        Отмена
      </button>
      <button 
        type="button"
        className={styles.shiftFormSaveBtn}
        disabled={loading}
        onClick={onSave}
      >
        {loading ? 'Сохранение...' : (isEditMode ? 'Обновить смену' : 'Сохранить смену')}
      </button>
    </div>
  )

  return ReactDOM.createPortal(footerContent, document.getElementById('root'))
}