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
                    <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18" />
                </svg>
                <span className="title">Табель</span>
            </div>
            <span className="header-version">v1.0</span>
        </header>
    )
}
