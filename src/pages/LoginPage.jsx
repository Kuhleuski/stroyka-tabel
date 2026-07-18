import { useState } from 'react'

export function LoginPage({ onLogin }) {
    const [login, setLogin] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        setTimeout(() => {
            const result = onLogin(login, password)
            setLoading(false)
            if (!result.success) {
                setError(result.error)
            }
        }, 500)
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#2d7d46"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                        <line x1="8" y1="11" x2="16" y2="11" />
                        <line x1="8" y1="15" x2="16" y2="15" />
                        <line x1="8" y1="19" x2="12" y2="19" />
                    </svg>
                    <h1 className="login-title">Табель</h1>
                    <p className="login-subtitle">Войдите в свой аккаунт</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="login-error">{error}</div>
                    )}

                    <div className="login-field">
                        <label className="login-label">Логин</label>
                        <input
                            className="login-input"
                            type="text"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            placeholder="admin или user"
                            autoFocus
                            required
                        />
                    </div>

                    <div className="login-field">
                        <label className="login-label">Пароль</label>
                        <input
                            className="login-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="1111"
                            required
                        />
                    </div>

                    <button 
                        className="login-btn" 
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>

                    <div className="login-hint">
                        <span>admin / 1111</span>
                        <span>user / 1111</span>
                    </div>
                </form>
            </div>
        </div>
    )
}
