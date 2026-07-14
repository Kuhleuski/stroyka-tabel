// ============================================================
// СТРАНИЦА "ОБЪЕКТЫ"
// ============================================================

export class SitesPage {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(shifts) {
        if (!this.container) return;

        const sitesMap = {};
        shifts.forEach(s => {
            if (!sitesMap[s.site_name]) {
                sitesMap[s.site_name] = {
                    shifts: [],
                    totalHours: 0,
                    workers: new Set()
                };
            }
            sitesMap[s.site_name].shifts.push(s);
            sitesMap[s.site_name].totalHours += parseFloat(s.hours);
            sitesMap[s.site_name].workers.add(s.worker_name);
        });

        if (Object.keys(sitesMap).length === 0) {
            this.container.innerHTML = `
                <div class="card empty-state">
                    <div class="empty-icon">🏗️</div>
                    <div class="empty-text">Пока нет объектов</div>
                </div>
            `;
            return;
        }

        let html = '';
        for (const [name, data] of Object.entries(sitesMap)) {
            html += `
                <div class="card site-card" onclick="window.showSiteDetails('${name}')">
                    <div class="site-card-header">
                        <span class="site-card-icon">🏗️</span>
                        <span class="site-card-name">${name}</span>
                    </div>
                    <div class="site-card-stats">
                        <span>👷 ${data.workers.size} рабочих</span>
                        <span>📋 ${data.shifts.length} смен</span>
                        <span>⏱️ ${data.totalHours} ч.</span>
                    </div>
                    <div class="site-card-footer">
                        <span class="site-card-arrow">→</span>
                    </div>
                </div>
            `;
        }
        this.container.innerHTML = html;
    }

    // Показ деталей объекта (будет позже)
    showDetails(siteName) {
        alert(`📋 ${siteName}\n\nДетальная информация будет здесь`);
    }
}
