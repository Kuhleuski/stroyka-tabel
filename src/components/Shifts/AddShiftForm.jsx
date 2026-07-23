import React, { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { addShift } from '../../services/supabase'
import { formatDateLocal } from '../../utils/dateHelpers'
import styles from '../../styles/shifts.module.css'

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
    <div className={styles.shiftFormScreen}>
      {/* Шапка */}
      <div className={styles.shiftFormHeader}>
        <button onClick={onClose} className={styles.shiftFormBack}>
          <ArrowLeft size={24} />
          <span>Назад</span>
        </button>
        <span className={styles.shiftFormTitle} style={{ flex: 1, textAlign: 'center' }}>
          Новая смена на {formatDate(selectedDate)}
        </span>
        <div style={{ width: '60px' }} /> {/* Пустой блок для баланса */}
      </div>

      <form id="shift-form" onSubmit={handleSubmit} className={styles.shiftFormBody}>
        {/* БЛОК: ОБЪЕКТЫ */}
        <div className={styles.shiftFormBlock}>
          <label className={styles.shiftFormLabel} style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            Выберите объект:
          </label>
          <div className={styles.shiftSitesGrid}>
            {sites.length === 0 ? (
              <div className={styles.shiftFormEmpty}>
                <p>Нет добавленных объектов</p>
                <span>Добавьте в разделе "Объекты"</span>
              </div>
            ) : (
              sites.map(site => {
                const isSelected = selectedSite === site.id
                return (
                  <div key={site.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <div
                      className={`${styles.shiftSiteCard} ${isSelected ? styles.selected : ''}`}
                      onClick={() => handleSiteSelect(site.id)}
                      style={{
                        backgroundColor: site.color || '#2d7d46',
                        borderColor: isSelected ? '#2d7d46' : 'transparent',
                        borderWidth: isSelected ? '3px' : '0px',
                        position: 'relative',
                        width: '100%'
                      }}
                    >
                      <span className={styles.shiftSiteName}>{site.name}</span>
                      {isSelected && (
                        <div className={styles.shiftSiteCheck}>✓</div>
                      )}
                    </div>
                    {site.address && (
                      <div className={styles.shiftSiteAddress}>{site.address}</div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* БЛОК: РАБОТНИКИ */}
        <div className={styles.shiftFormBlock}>
          <div className={styles.shiftFormWorkersHeader} style={{ marginBottom: '12px' }}>
            <label className={styles.shiftFormLabel} style={{ fontSize: '16px', fontWeight: 600 }}>
              Кто работал:
            </label>
            {workers.length > 0 && (
              <button 
                type="button" 
                onClick={handleSelectAll}
                className={styles.shiftFormSelectAll}
              >
                {selectedWorkers.length === workers.length ? 'Снять всех' : 'Выбрать всех'}
              </button>
            )}
          </div>
          
          <div className={styles.shiftWorkersGrid}>
            {workers.length === 0 ? (
              <div className={styles.shiftFormEmpty}>
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
                    className={`${styles.shiftWorkerCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleWorkerToggle(worker.id)}
                    style={{
                      borderColor: isSelected ? 'transparent' : 'transparent',
                    }}
                  >
                    <div className={styles.shiftWorkerAvatar} style={{
                      backgroundColor: hasPhoto ? 'transparent' : avatarColor,
                      border: hasPhoto ? '2px solid #e8eaed' : 'none',
                      overflow: 'hidden',
                      width: '56px',
                      height: '56px'
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
                    <div className={styles.shiftWorkerName}>{worker.name}</div>
                    {isSelected && (
                      <div className={styles.shiftWorkerCheck}>✓</div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* КНОПКИ */}
        <div className={styles.shiftFormActions}>
          <button 
            type="submit" 
            className={styles.shiftFormBottomBtn}
            disabled={loading}
          >
            {loading ? '⏳ Сохранение...' : 'Сохранить смену'}
          </button>
          <button 
            type="button" 
            className={styles.shiftFormCancelBtn}
            onClick={onClose}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}
