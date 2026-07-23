import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// Импортируем глобальные стили через модуль
import './styles/variables.module.css'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
