export function Header() {
    return (
        <header className="header">
            <div className="header-brand">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2d7d46"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="logo-icon"
                >
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    <line x1="8" y1="11" x2="16" y2="11" />
                    <line x1="8" y1="15" x2="16" y2="15" />
                    <line x1="8" y1="19" x2="12" y2="19" />
                </svg>
                <span className="title">Табель</span>
            </div>
            <div className="header-actions">
                <button className="header-login-btn">
                    Войти
                </button>
                <span className="header-version">v1.0</span>
            </div>
        </header>
    )
}
