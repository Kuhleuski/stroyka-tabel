// ============================================================
// КАЛЕНДАРЬ (МЕСЯЦ / НЕДЕЛЯ / ДЕНЬ)
// ============================================================

import { CONFIG } from './config.js';

export class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.viewMode = CONFIG.VIEW_MODES.MONTH; // month | week | day
        this.selectedDate = new Date();
        this.onDaySelect = null; // колбэк при выборе дня
    }

    // Установить режим просмотра
    setViewMode(mode) {
        this.viewMode = mode;
        this.render();
    }

    // Переключить месяц
    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }

    // Получить дни месяца
    getMonthDays() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay(); // 0 - воскресенье

        const days = [];
        
        // Пустые ячейки до первого дня
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({ empty: true });
        }

        // Дни месяца
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            days.push({
                date: date,
                day: i,
                isToday: this.isToday(date),
                isSelected: this.isSelected(date),
                shifts: []
            });
        }

        return days;
    }

    // Получить дни недели
    getWeekDays() {
        const today = new Date(this.currentDate);
        const day = today.getDay();
        const diff = today.getDate() - day;
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), diff);
        
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            days.push({
                date: date,
                day: date.getDate(),
                isToday: this.isToday(date),
                isSelected: this.isSelected(date),
                shifts: []
            });
        }
        return days;
    }

    // Получить текущий день
    getDay() {
        return {
            date: this.selectedDate,
            day: this.selectedDate.getDate(),
            isToday: this.isToday(this.selectedDate),
            isSelected: true,
            shifts: []
        };
    }

    // Проверка на сегодня
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    isSelected(date) {
        return date.getDate() === this.selectedDate.getDate() &&
               date.getMonth() === this.selectedDate.getMonth() &&
               date.getFullYear() === this.selectedDate.getFullYear();
    }

    // Добавить данные о сменах к дням
    addShiftsToDays(days, shifts) {
        days.forEach(day => {
            if (!day.empty && day.date) {
                const dateStr = this.formatDate(day.date);
                day.shifts = shifts.filter(s => s.work_date === dateStr);
                day.hasWork = day.shifts.length > 0;
                day.workers = [...new Set(day.shifts.map(s => s.worker_name))];
            }
        });
        return days;
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    // Рендеринг календаря
    render() {
        let days = [];
        let title = '';

        switch (this.viewMode) {
            case CONFIG.VIEW_MODES.MONTH:
                days = this.getMonthDays();
                title = `${CONFIG.MONTHS[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
                break;
            case CONFIG.VIEW_MODES.WEEK:
                days = this.getWeekDays();
                const weekStart = days[0].date;
                const weekEnd = days[6].date;
                title = `${weekStart.getDate()} ${CONFIG.MONTHS[weekStart.getMonth()]} - ${weekEnd.getDate()} ${CONFIG.MONTHS[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
                break;
            case CONFIG.VIEW_MODES.DAY:
                days = [this.getDay()];
                title = `${this.selectedDate.getDate()} ${CONFIG.MONTHS[this.selectedDate.getMonth()]} ${this.selectedDate.getFullYear()}`;
                break;
        }

        return { days, title };
    }

    // Выбрать день
    selectDate(date) {
        this.selectedDate = new Date(date);
        if (this.onDaySelect) {
            this.onDaySelect(this.selectedDate);
        }
        this.render();
    }
}
