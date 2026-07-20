import React, { useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
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
      const shiftPromises = selectedWorkers.map(workerId => 
        addShift({
          worker_id: workerId,
          site_id: selectedSite,
          work_date: selectedDate.toISOString().split('T')[0],
          hours: 8,
          status: 'pending'
        })
      )
      
      await Promise.all(shiftPromises)
      onSuccess()
    } catch (error) {
      console.error('Ошибка:', error)
      alert('Не удалось создать смену')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    const months = ['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря']
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  return (
    <div className="shift-form-screen">
      {/* Шапка */}
      <div className="shift-form-header">
        <button onClick={onClose} className="shift-form-back">
          <ArrowLeft size={24} />
          <span>Назад</span>
        </button>
        <span className="shift-form-title">Новая смена</span>
        <button 
          type="submit" 
          form="shift-form"
          className="shift-form-save"
          disabled={loading}
        >
          {loading ? '...' : <Check size={24} />}
        </button>
      </div>

      {/* Форма */}
      <form id="shift-form" onSubmit={handleSubmit} className="shift-form-body">
        {/* Дата */}
        <div className="shift-form-field">
          <label className="shift-form-label">📅 Дата</label>
          <input 
            type="text" 
            value={formatDate(selectedDate)}
            disabled
            className="shift-form-input shift-form-input-disabled"
          />
        </div>

        {/* Выбор объекта */}
        <div className="shift-form-field">
          <label className="shift-form-label">🏗️ Объект</label>
          <select 
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="shift-form-select"
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

        {/* Выбор работников */}
        <div className="shift-form-field">
          <div className="shift-form-workers-header">
            <label className="shift-form-label">👷 Работники</label>
            {workers.length > 0 && (
              <button 
                type="button" 
                onClick={handleSelectAll}
                className="shift-form-select-all"
              >
                {selectedWorkers.length === workers.length ? 'Снять всех' : 'Выбрать всех'}
              </button>
            )}
          </div>
          
          <div className="shift-form-workers-list">
            {workers.length === 0 ? (
              <div className="shift-form-empty">
                <p>Нет добавленных работников</p>
                <span>Добавьте в разделе "Бригада"</span>
              </div>
            ) : (
              workers.map(worker => (
                <label key={worker.id} className="shift-form-worker-item">
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
      </form>
    </div>
  )
}
