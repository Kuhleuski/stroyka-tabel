// ============================================================
// СТРАНИЦА "БРИГАДА"
// ============================================================

export class WorkersPage {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(shifts) {
        if (!this.container) return;

        const workersMap = {};
        shifts.forEach(s => {
            if (!workersMap[s.worker_name]) {
                workersMap[s.worker_name] = {
                    days: new Set(),
                    totalHours: 0,
                    sites: new Set()
                };
            }
            workersMap[s.worker_name].days.add(s.work_date);
            workersMap[s.worker_name].totalHours += parseFloat(s.hours);
            workersMap[s.worker_name].sites.add(s.site_name);
        });

        if (Object.keys(workersMap).length === 0) {
            this.container.innerHTML = `
                <div class="card empty-state">
                    <div class="empty-icon">👷</div>
                    <div class="empty-text">Пока нет рабочих</div>
                </div>
            `;
            return;
        }

        let html = '';
        for (const [name, data] of Object.entries(workersMap)) {
            const initials = name.split(' ').map(w => w[0]).join('');
            const colors = ['#2d7d46', '#1a6b8a', '#8d6e63', '#6a1b9a', '#c62828'];
            const colorIndex = Object.keys(workersMap).indexOf(name) % colors.length;
            
            html += `
                <div class="card worker-card" onclick="window.showWorkerDetails('${name}')">
                    <div class="worker-card-avatar" style="background: ${colors[colorIndex]}">
                        ${initials}
                    </div>
                    <div class="worker-card-info">
                        <div class="worker-card-name">${name}</div>
                        <div class="worker-card-stats">
                            <span>⏱️ ${data.totalHours} ч.</span>
                            <span>📅 ${data.days.size} дней</span>
                            <span>🏗️ ${data.sites.size} объектов</span>
                        </div>
                    </div>
                    <div class="worker-card-arrow">→</div>
                </div>
            `;
        }
        this.container.innerHTML = html;
    }

    // Показ деталей работника (будет позже)
    showDetails(workerName) {
        alert(`👷 ${workerName}\n\nДетальная информация будет здесь`);
    }
}
