// src/components/WorkerStatsFooterV2.jsx

import { createPortal } from 'react-dom'
import styles from '../styles/workerStatsV2.module.css'

export function WorkerStatsFooterV2({ onClose }) {
    return createPortal(
        <div className={styles.footerPortal}>
            <button className={styles.footerCloseBtn} onClick={onClose}>
                Закрыть
            </button>
        </div>,
        document.getElementById('root')
    )
}