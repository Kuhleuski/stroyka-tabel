import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// === ВСЕ ГЛОБАЛЬНЫЕ СТИЛИ ===
import './styles/global.css'
import './styles/variables.module.css'
import './styles/layout.module.css'
import './styles/auth.module.css'
import './styles/calendar.module.css'
import './styles/timeline.module.css'
import './styles/sites.module.css'
import './styles/workers.module.css'
import './styles/my-tabel.module.css'
import './styles/shifts.module.css'
import './styles/components.module.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
