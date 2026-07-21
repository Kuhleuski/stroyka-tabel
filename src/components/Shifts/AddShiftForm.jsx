import React, { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { addShift } from '../../services/supabase'
import { formatDateLocal } from '../../utils/dateHelpers'

export const AddShiftForm = ({ selectedDate, onClose, onSuccess, sites, workers }) => {
  const [selectedSite, setSelectedSite] = useState(null)
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

  const handleSiteSelect = (siteId) => {
    setSelectedSite(prev => prev === siteId ? null : siteId)
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
      const localDate = formatDateLocal(selectedDate)
      console.log('📅 Сохраняем смену на дату:', localDate)
      
      const shiftPromises = selectedWorkers.map(workerId => 
        addShift({
          worker_id: workerId,
          site_id: selectedSite,
          work_date: localDate,
          hours: 8,
          status: 'pending'
        })
      )
      
      await Promise.all(shiftPromises)
      onSuccess()
    } catch (error) {
      console.error('Ошибка:', error)
      alert('Не удалось создать смену')
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  // === ФУНКЦИИ ДЛЯ АВАТАРОК ===
  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  const getAvatarColor = (name) => {
    const colors = ['#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#FDD835', '#FFB300', '#FB8C00', '#F4511E', '#6D4C41', '#78909C']
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
  }

  const isBase64Image = (str) => {
    return str && str.startsWith('data:image')
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
          {loading ? '...' : 'Сохранить'}
        </button>
      </div>

      <form id="shift-form" onSubmit={handleSubmit} className="shift-form-body">
        {/* ДАТА */}
        <div className="shift-form-field">
          <label className="shift-form-label">
            Создаём новую смену на <strong>{formatDate(selectedDate)}</strong>
          </label>
        </div>

        {/* ОБЪЕКТЫ */}
        <div className="shift-form-field">
          <label className="shift-form-label" style={{ fontSize: '16px', fontWeight: 600 }}>
            Выберите объект:
          </label>
          <div className="shift-sites-grid">
            {sites.length === 0 ? (
              <div className="shift-form-empty">
                <p>Нет добавленных объектов</p>
                <span>Добавьте в разделе "Объекты"</span>
              </div>
            ) : (
              sites.map(site => {
                const isSelected = selectedSite === site.id
                return (
                  <div
                    key={site.id}
                    className={`shift-site-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSiteSelect(site.id)}
                    style={{
                      backgroundColor: isSelected ? site.color : '#f5f7f6',
                      borderColor: isSelected ? site.color : '#e8eaed',
                      borderWidth: isSelected ? '3px' : '1px',
                    }}
                  >
                    <div className="shift-site-name">{site.name}</div>
                    {site.address && (
                      <div className="shift-site-address">{site.address}</div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* РАБОТНИКИ */}
        <div className="shift-form-field">
          <div className="shift-form-workers-header">
            <label className="shift-form-label" style={{ fontSize: '16px', fontWeight: 600 }}>
              Кто работал:
            </label>
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
          
          <div className="shift-workers-grid">
            {workers.length === 0 ? (
              <div className="shift-form-empty">
                <p>Нет добавленных работников</p>
                <span>Добавьте в разделе "Бригада"</span>
              </div>
            ) : (
              workers.map(worker => {
                const isSelected = selectedWorkers.includes(worker.id)
                const hasPhoto = isBase64Image(worker.avatar)
                const initials = getInitials(worker.name)
                const avatarColor = getAvatarColor(worker.name)

                return (
                  <div
                    key={worker.id}
                    className={`shift-worker-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleWorkerToggle(worker.id)}
                  >
                    <div className="shift-worker-avatar" style={{
                      backgroundColor: hasPhoto ? 'transparent' : avatarColor,
                      border: hasPhoto ? '2px solid #e8eaed' : 'none',
                      overflow: 'hidden'
                    }}>
                      {hasPhoto ? (
                        <img 
                          src={worker.avatar} 
                          alt={worker.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '50%'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentNode.style.backgroundColor = avatarColor
                            e.target.parentNode.textContent = initials
                          }}
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="shift-worker-name">{worker.name}</div>
                    {isSelected && (
                      <div className="shift-worker-check">✓</div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* КНОПКА СОХРАНИТЬ */}
        <button 
          type="submit" 
          className="shift-form-bottom-btn"
          disabled={loading}
        >
          {loading ? '⏳ Сохранение...' : 'Сохранить смену'}
        </button>
      </form>
    </div>
  )
}
