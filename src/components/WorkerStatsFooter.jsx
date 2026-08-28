import { createPortal } from 'react-dom'
import styles from '../styles/workerStats.module.css'

export function WorkerStatsFooter({ onEdit, onClose, worker }) {
    return createPortal(
        <div className={styles.workerStatsFooterPortal}>
            <button 
                className={styles.workerStatsProfileBtn}
                onClick={() => {
                    console.log('🔘 Профиль нажат')
                    if (onEdit && worker) {
                        onEdit(worker)
                    }
                }}
            >
                Профиль
            </button>
            <button 
                className={styles.workerStatsCloseBtn}
                onClick={() => {
                    console.log('🔘 Закрыть нажат')
                    onClose()
                }}
            >
                Закрыть
            </button>
        </div>,
        document.getElementById('root')
    )
}