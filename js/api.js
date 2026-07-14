// ============================================================
// РАБОТА С SUPABASE API
// ============================================================

import { CONFIG } from './config.js';

export class Api {
    constructor() {
        this.url = CONFIG.SUPABASE_URL;
        this.key = CONFIG.SUPABASE_ANON_KEY;
    }

    async fetchShifts() {
        try {
            const response = await fetch(`${this.url}/rest/v1/shifts?select=*`, {
                headers: {
                    'apikey': this.key,
                    'Authorization': `Bearer ${this.key}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            throw error;
        }
    }

    // Добавление новой смены (будет позже)
    async addShift(workerName, siteName, date, hours) {
        const data = {
            worker_name: workerName,
            site_name: siteName,
            work_date: date,
            hours: hours,
            status: 'pending'
        };

        try {
            const response = await fetch(`${this.url}/rest/v1/shifts`, {
                method: 'POST',
                headers: {
                    'apikey': this.key,
                    'Authorization': `Bearer ${this.key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Ошибка добавления');
            return await response.json();
        } catch (error) {
            console.error('Ошибка добавления смены:', error);
            throw error;
        }
    }
}
