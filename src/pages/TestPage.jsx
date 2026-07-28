// src/pages/TestPage.jsx

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import styles from '../styles/test.module.css'

export default function TestPage() {
  const [date, setDate] = useState(new Date())
  const [activeStartDate, setActiveStartDate] = useState(new Date())
  const [direction, setDirection] = useState(0)

  const formatMonth = (date) => {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  }

  const changeMonth = (newDirection) => {
    setDirection(newDirection)
    const newDate = new Date(activeStartDate)
    newDate.setMonth(newDate.getMonth() + newDirection)
    setActiveStartDate(newDate)
  }

  const handlePrev = () => changeMonth(-1)
  const handleNext = () => changeMonth(1)

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 200 : -200,
      opacity: 0,
      scale: 0.92,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 200 : -200,
      opacity: 0,
      scale: 0.92,
    }),
  }

  return (
    <div className={styles.testPage}>
      <h1 className={styles.pageTitle}>🧪 Тест: Календарь iOS стиль</h1>
      
      <div className={styles.calendarWrapper}>
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={activeStartDate.getMonth() + '-' + activeStartDate.getFullYear()}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { 
                type: "spring", 
                stiffness: 500,      // ← увеличил для более быстрой реакции
                damping: 35,          // ← уменьшил для меньшего "прыгания"
                mass: 0.5            // ← уменьшил для легкости
              },
              opacity: { duration: 0.15 },  // ← быстрее
              scale: { duration: 0.15 }     // ← быстрее
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}        // ← уменьшил для меньшего "растяжения"
            dragMomentum={false}      // ← отключил инерцию для более предсказуемого поведения
            onDragEnd={(event, info) => {
              const threshold = 30    // ← уменьшил порог для более чуткого свайпа
              if (info.offset.x < -threshold) {
                changeMonth(1)
              } else if (info.offset.x > threshold) {
                changeMonth(-1)
              }
            }}
            className={styles.calendarMotion}
          >
            <Calendar
              value={date}
              onChange={setDate}
              activeStartDate={activeStartDate}
              minDetail="month"
              maxDetail="month"
              navigationLabel={({ date }) => formatMonth(date)}
              prevLabel={<span onClick={handlePrev}>‹</span>}
              nextLabel={<span onClick={handleNext}>›</span>}
              next2Label={null}
              prev2Label={null}
              showNeighboringMonth={false}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.dots}>
        <span className={`${styles.dot} ${direction === -1 ? styles.active : ''}`} />
        <span className={`${styles.dot} ${direction === 0 ? styles.active : ''}`} />
        <span className={`${styles.dot} ${direction === 1 ? styles.active : ''}`} />
      </div>

      <div className={styles.debugInfo}>
        <p>Текущий: {formatMonth(activeStartDate)}</p>
        <p>Направление: {direction === 1 ? '→ вправо' : direction === -1 ? '← влево' : 'центр'}</p>
      </div>
    </div>
  )
}
