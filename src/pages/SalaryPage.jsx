export function SalaryPage() {
    return (
        <div className="salary-page">
            <div className="salary-header">
                <span className="salary-title">💰 Зарплата</span>
            </div>
            <div className="salary-content">
                <div className="card empty-state">
                    <div className="empty-icon">💰</div>
                    <div className="empty-text">Информация о зарплате</div>
                    <div style={{ fontSize: '13px', color: '#999', marginTop: '8px' }}>
                        Здесь будет отображаться ваша зарплата
                    </div>
                </div>
            </div>
        </div>
    )
}
