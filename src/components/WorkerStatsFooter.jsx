import { createPortal } from 'react-dom'
import styles from '../styles/workerStats.module.css'

export function WorkerStatsFooter({ onEdit, onClose, worker }) {
    return createPortal(
        <div className={styles.workerStatsFooter}>
            <button 
                className={styles.workerStatsProfileBtn}
                onClick={() => onEdit(worker)}
            >
                Профиль
            </button>
            <button 
                className={styles.workerStatsCloseBtn}
                onClick={onClose}
            >
                Закрыть
            </button>
        </div>,
        document.getElementById('root')
    )
}