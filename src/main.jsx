import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// === ИМПОРТ ВСЕХ ГЛОБАЛЬНЫХ СТИЛЕЙ ===
import './styles/global.css'
import './styles/variables.module.css'
import './styles/layout.module.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
