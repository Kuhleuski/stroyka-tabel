export function ExtraPage() {
    return (
        <div className="extra-page">
            <div className="extra-header">
                <span className="extra-title">📌 Пункт</span>
            </div>
            <div className="extra-content">
                <div className="card empty-state">
                    <div className="empty-icon">📌</div>
                    <div className="empty-text">Дополнительная информация</div>
                    <div style={{ fontSize: '13px', color: '#999', marginTop: '8px' }}>
                        Здесь будет дополнительная информация
                    </div>
                </div>
            </div>
        </div>
    )
}
