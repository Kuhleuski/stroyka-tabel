import { useState } from 'react'
import { useSalaries } from '../hooks/useSalaries'
import { useWorkers } from '../hooks/useWorkers'
import { AddSalaryModal } from '../components/Salary/AddSalaryModal'
import { EditSalaryModal } from '../components/Salary/EditSalaryModal'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Plus, Pen, Trash2 } from 'lucide-react'
import styles from '../styles/salary.module.css'
import globalsStyles from '../styles/globals.module.css'

const SalaryIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2v20"/>
        <path d="M2 12h20"/>
    </svg>
)

export function SalaryPage() {
    const { salaries, loading, addSalaryToState, updateSalaryInState, deleteSalaryFromState } = useSalaries()
    const { workers } = useWorkers()
    
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingSalary, setEditingSalary] = useState(null)
    const [showEditModal, setShowEditModal] = useState(false)

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const date = parseISO(dateStr)
        return format(date, 'dd.MM.yyyy')
    }

    const getWorkerName = (workerId) => {
        const worker = workers.find(w => w.id === workerId)
        return worker ? worker.name : 'Неизвестный'
    }

    const getWorkerAvatar = (workerId) => {
        const worker = workers.find(w => w.id === workerId)
        return worker?.avatar || null
    }

    // Группируем зарплаты по работникам
    const groupedSalaries = salaries.reduce((acc, salary) => {
        if (!acc[salary.worker_id]) {
            acc[salary.worker_id] = {
                workerId: salary.worker_id,
                salaries: [],
                total: 0
            }
        }
        acc[salary.worker_id].salaries.push(salary)
        acc[salary.worker_id].total += salary.amount
        return acc
    }, {})

    // Сортируем работников по алфавиту
    const sortedWorkers = Object.values(groupedSalaries).sort((a, b) => {
        const nameA = getWorkerName(a.workerId)
        const nameB = getWorkerName(b.workerId)
        return nameA.localeCompare(nameB)
    })

    const totalAll = Object.values(groupedSalaries).reduce((sum, item) => sum + item.total, 0)

    const handleAddSalary = async (workerId, amount, paymentDate) => {
        await addSalaryToState(workerId, amount, paymentDate)
        setShowAddModal(false)
    }

    const handleEditSalary = async (salaryId, amount, paymentDate) => {
        await updateSalaryInState(salaryId, amount, paymentDate)
        setShowEditModal(false)
        setEditingSalary(null)
    }

    const handleDeleteSalary = async (salaryId) => {
        if (window.confirm('Удалить эту выплату?')) {
            await deleteSalaryFromState(salaryId)
        }
    }

    if (loading) {
        return <div className={globalsStyles.loadingText}>⏳ Загрузка...</div>
    }

    return (
        <div className={styles.salaryPage}>
            <div className={styles.salaryHeader}>
                <div className={styles.salaryTitle}>
                    <SalaryIcon />
                    Зарплата
                </div>
                <div className={styles.salarySubtitle}>
                    Все выплаты работникам
                </div>
            </div>

            {/* Общая сумма */}
            {salaries.length > 0 && (
                <div className={styles.totalCard}>
                    <div className={styles.totalAmount}>{totalAll.toLocaleString()} BYN</div>
                    <div className={styles.totalLabel}>Всего выплачено</div>
                </div>
            )}

            {/* Кнопка добавления */}
            <button 
                className={styles.addSalaryBtn}
                onClick={() => setShowAddModal(true)}
            >
                <Plus size={20} />
                Добавить выплату
            </button>

            {/* Список выплат по работникам */}
            {sortedWorkers.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>💰</div>
                    <div className={styles.emptyText}>Нет выплат</div>
                    <div className={styles.emptySubtext}>Добавьте первую выплату</div>
                </div>
            ) : (
                <div className={styles.salaryList}>
                    {sortedWorkers.map((item) => {
                        const workerName = getWorkerName(item.workerId)
                        const avatar = getWorkerAvatar(item.workerId)
                        const initials = workerName.split(' ').map(n => n[0]).join('').toUpperCase()
                        
                        return (
                            <div key={item.workerId} className={styles.workerGroup}>
                                <div className={styles.workerHeader}>
                                    <div className={styles.workerInfo}>
                                        <div className={styles.workerAvatar}>
                                            {avatar ? (
                                                <img src={avatar} alt={workerName} />
                                            ) : (
                                                <span>{initials}</span>
                                            )}
                                        </div>
                                        <span className={styles.workerName}>{workerName}</span>
                                    </div>
                                    <div className={styles.workerTotal}>
                                        {item.total.toLocaleString()} BYN
                                    </div>
                                </div>

                                <div className={styles.salaryItems}>
                                    {item.salaries.map((salary) => (
                                        <div key={salary.id} className={styles.salaryItem}>
                                            <span className={styles.salaryDate}>
                                                {formatDate(salary.payment_date)}
                                            </span>
                                            <span className={styles.salaryAmount}>
                                                {salary.amount.toLocaleString()} BYN
                                            </span>
                                            <div className={styles.salaryActions}>
                                                <button 
                                                    className={styles.editBtn}
                                                    onClick={() => {
                                                        setEditingSalary(salary)
                                                        setShowEditModal(true)
                                                    }}
                                                >
                                                    <Pen size={16} />
                                                </button>
                                                <button 
                                                    className={styles.deleteBtn}
                                                    onClick={() => handleDeleteSalary(salary.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Модалки */}
            <AddSalaryModal 
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={handleAddSalary}
                workers={workers}
            />

            <EditSalaryModal 
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false)
                    setEditingSalary(null)
                }}
                onSave={handleEditSalary}
                salary={editingSalary}
                workers={workers}
            />
        </div>
    )
}