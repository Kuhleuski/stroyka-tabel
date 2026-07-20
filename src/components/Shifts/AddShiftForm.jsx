import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { addShift } from '../../services/supabase'

export const AddShiftForm = ({ selectedDate, onClose, onSuccess, sites, workers }) => {
  const [selectedSite, setSelectedSite] = useState('')
  const [selectedWorkers, setSelectedWorkers] = useState([])
  const [loading, setLoading] = useState(false)

  const handleWorkerToggle = (workerId) => {
    setSelectedWorkers(prev =>
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    )
  }

  const handleSelectAll = () => {
    if (selectedWorkers.length === workers.length) {
      setSelectedWorkers([])
    } else {
      setSelectedWorkers(workers.map(w => w.id))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedSite) {
      alert('Выберите объект')
      return
    }
    if (selectedWorkers.length === 0) {
      alert('Выберите хотя бы одного работника')
      return
    }

    setLoading(true)
    try {
      // Создаем смену для каждого выбранного работника
      const shiftPromises = selectedWorkers.map(workerId => 
        addShift({
          worker_id: workerId,
          site_id: selectedSite,
          work_date: selectedDate.toISOString().split('T')[0], // Формат YYYY-MM-DD
          hours: 8,
          status: 'pending'
        })
      )
      
      await Promise.all(shiftPromises)
      onSuccess()
    } catch (error) {
      console.error('Ошибка при создании смены:', error)
      alert('Не удалось создать смену')
    } finally {
      setLoading(false)
    }
  }

  // Форматируем дату
  const formatDate = (date) => {
    if (!date) return ''
    const months = ['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря']
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  return (
    <div className="add-shift-overlay" onClick={onClose}>
      <div className="add-shift-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Добавить смену</h2>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>📅 Дата</label>
            <input 
              type="text" 
              value={formatDate(selectedDate)}
              disabled
              className="date-display"
            />
          </div>

          <div className="form-group">
            <label>🏗️ Объект</label>
            <select 
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="site-select"
              required
            >
              <option value="">Выберите объект</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <div className="workers-header">
              <label>👷 Работники</label>
              {workers.length > 0 && (
                <button 
                  type="button" 
                  onClick={handleSelectAll}
                  className="select-all-btn"
                >
                  {selectedWorkers.length === workers.length ? 'Снять все' : 'Выбрать всех'}
                </button>
              )}
            </div>
            <div className="workers-list">
              {workers.length === 0 ? (
                <div className="empty-workers">
                  <p>Нет добавленных работников</p>
                  <span className="hint">Добавьте работников в разделе "Бригада"</span>
                </div>
              ) : (
                workers.map(worker => (
                  <label key={worker.id} className="worker-item">
                    <input
                      type="checkbox"
                      checked={selectedWorkers.includes(worker.id)}
                      onChange={() => handleWorkerToggle(worker.id)}
                    />
                    <span>{worker.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Отмена
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
