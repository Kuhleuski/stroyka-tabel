// ============================================================
// ТАЙМЛАЙН - ОТОБРАЖЕНИЕ СМЕН ЗА ДЕНЬ
// ============================================================

export class Timeline {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(shifts, date) {
        if (!this.container) return;

        const dayShifts = shifts.filter(s => s.work_date === date);

        if (dayShifts.length === 0) {
            this.container.innerHTML = `
                <div class="card empty-state">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">В этот день никто не работал</div>
                </div>
            `;
            return;
        }

        // Группируем по объектам
        const sitesMap = {};
        dayShifts.forEach(s => {
            if (!sitesMap[s.site_name]) {
                sitesMap[s.site_name] = { workers: [], totalHours: 0 };
            }
            sitesMap[s.site_name].workers.push({
                name: s.worker_name,
                hours: parseFloat(s.hours),
                status: s.status
            });
            sitesMap[s.site_name].totalHours += parseFloat(s.hours);
        });

        let html = '';
        for (const [siteName, data] of Object.entries(sitesMap)) {
            html += `
                <div class="card">
                    <div class="card-header">
                        <span class="card-icon">📍</span>
                        <span class="card-title">${siteName}</span>
                        <span class="card-badge">${data.totalHours} ч.</span>
                    </div>
                    <div class="card-body">
                        ${data.workers.map(w => `
                            <div class="worker-chip">
                                <span class="worker-chip-name">${w.name}</span>
                                <span class="worker-chip-hours">${w.hours} ч.</span>
                                <span class="badge ${w.status === 'confirmed' ? 'confirmed' : 'pending'}">
                                    ${w.status === 'confirmed' ? '✅' : '⏳'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        this.container.innerHTML = html;
    }
}
