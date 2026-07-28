// src/pages/TestPage.jsx

import { useState } from 'react'
import styles from '../styles/test.module.css'

export function TestPage() {
    const [count, setCount] = useState(0)

    return (
        <div className={styles.testPage}>
            <div className={styles.testHeader}>
                <span className={styles.testTitle}>🧪 Тестовая страница</span>
            </div>

            <div className={styles.testContent}>
                <div className={styles.testCard}>
                    <p className={styles.testText}>
                        Здесь будет новый календарь или другой эксперимент.
                    </p>
                    <div className={styles.testCounter}>
                        <button 
                            className={styles.testBtn}
                            onClick={() => setCount(prev => prev - 1)}
                        >
                            −
                        </button>
                        <span className={styles.testCount}>{count}</span>
                        <button 
                            className={styles.testBtn}
                            onClick={() => setCount(prev => prev + 1)}
                        >
                            +
                        </button>
                    </div>
                    <p className={styles.testHint}>
                        Тестируй, экспериментируй, не бойся сломать!
                    </p>
                </div>

                <div className={styles.testPlaceholder}>
                    <div className={styles.testPlaceholderIcon}>📅</div>
                    <div className={styles.testPlaceholderText}>
                        Здесь будет новый календарь
                    </div>
                    <div className={styles.testPlaceholderSub}>
                        Когда будет готов — заменим старый
                    </div>
                </div>
            </div>
        </div>
    )
}
