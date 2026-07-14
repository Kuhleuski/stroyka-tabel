// ============================================================
// ГЛАВНЫЙ КОНТРОЛЛЕР ПРИЛОЖЕНИЯ
// ============================================================

import { CONFIG } from './config.js';
import { Api } from './api.js';
import { Calendar } from './calendar.js';
import { Timeline } from './timeline.js';
import { SitesPage } from './sites.js';
import { WorkersPage } from './workers.js';

class App {
    constructor() {
        this.api = new Api();
        this.calendar = new Calendar();
        this.timeline = new Timeline('dayTimeline');
        this.sitesPage = new SitesPage('sitesList');
        this.workersPage = new WorkersPage('workersList');
        
        this.shifts = [];
        this.currentView = 'main';
        
        this.init();
    }

    async init() {
        try {
            // Загружаем данные
            this.shifts = await this.api.fetchShifts();
            
            // Настраиваем календарь
            this.calendar.onDaySelect = (date) => {
                this.updateTimeline(date);
            };
            
            // Рендерим все
            this.renderAll();
            
            // Настраиваем навигацию
            this.setupNavigation();
            
            // Настраиваем переключение режимов
            this.setupViewModeButtons();
            
            // Настраиваем переключение месяцев
            this.setupMonthNavigation();
            
            // Добавляем глобальные функции для onclick
            window.showSiteDetails = (name) => this.sitesPage.showDetails(name);
            window.showWorkerDetails = (name) => this.workersPage.showDetails(name);
            
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.showError(error.message);
        }
    }

    renderAll() {
        this.renderCalendar();
        this.updateTimeline(this.calendar.selectedDate);
        this.sitesPage.render(this.shifts);
        this.workersPage.render(this.shifts);
    }

    renderCalendar() {
        const { days, title } = this.calendar.render();
        const container = document.getElementById('calendarContainer');
        
        // Обновляем заголовок
        document.getElementById('calendarTitle').textContent = title;
        
        // Рендерим дни
        let html = '';
        days.forEach(day => {
            if (day.empty) {
                html += `<div class="day-cell empty"></div>`;
            } else {
                const classes = ['day-cell'];
                if (day.isToday) classes.push('today');
                if (day.isSelected) classes.push('selected');
                if (day.hasWork) classes.push('has-work');
                
                const dateStr = this.calendar.formatDate(day.date);
                const dayShifts = this.shifts.filter(s => s.work_date === dateStr);
                
                html += `
                    <div class="${classes.join(' ')}" data-date="${dateStr}">
                        <div class="day-number">${day.day}</div>
                        ${day.hasWork ? `<div class="day-dot"></div>` : ''}
                        ${dayShifts.length > 0 ? `<div class="day-count">${dayShifts.length}</div>` : ''}
                    </div>
                `;
            }
        });
        
        container.innerHTML = html;
        
        // Добавляем обработчики кликов
        container.querySelectorAll('.day-cell:not(.empty)').forEach(el => {
            el.addEventListener('click', () => {
                const dateStr = el.dataset.date;
                const [year, month, day] = dateStr.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                this.calendar.selectDate(date);
            });
        });
    }

    updateTimeline(date) {
        const dateStr = this.calendar.formatDate(date);
        this.timeline.render(this.shifts, dateStr);
    }

    setupNavigation() {
        document.querySelectorAll('.bottom-nav button').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.navigateTo(page);
            });
        });
    }

    navigateTo(page) {
        this.currentView = page;
        
        // Скрываем все страницы
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
        
        // Показываем нужную
        document.getElementById(`page-${page}`).classList.remove('hidden');
        
        // Обновляем кнопки
        document.querySelectorAll('.bottom-nav button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
    }

    setupViewModeButtons() {
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.calendar.setViewMode(mode);
                this.renderCalendar();
                
                // Обновляем активную кнопку
                document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    setupMonthNavigation() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.calendar.prevMonth();
            this.renderCalendar();
        });
        
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.calendar.nextMonth();
            this.renderCalendar();
        });
    }

    showError(message) {
        const container = document.getElementById('dayTimeline');
        container.innerHTML = `
            <div class="card error-state">
                <div class="error-icon">❌</div>
                <div class="error-text">Ошибка загрузки данных</div>
                <div class="error-detail">${message}</div>
            </div>
        `;
    }
}

// Запускаем приложение
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
