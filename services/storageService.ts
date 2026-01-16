
import { Measurement, SBRSettings } from '../types';

const STORAGE_KEY = 'sbr_monitor_data';
const SETTINGS_KEY = 'sbr_monitor_settings';

// Uwaga: To jest uproszczony endpoint do demonstracji. 
// W docelowej wersji zalecane jest użycie Netlify Functions + Supabase/MongoDB.
const SYNC_API_BASE = 'https://api.npoint.io/'; 

export const storageService = {
  async saveMeasurement(measurement: Measurement): Promise<void> {
    const data = await this.getHistory();
    data.unshift(measurement);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  async getHistory(): Promise<Measurement[]> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  async setHistory(data: Measurement[]): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  async deleteMeasurement(id: string): Promise<void> {
    const data = await this.getHistory();
    const filtered = data.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  getSettings(): SBRSettings {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { syncId: '' };
    return JSON.parse(raw);
  },

  saveSettings(settings: SBRSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  // Funkcja Cloud Sync
  async pushToCloud(data: Measurement[], syncId: string): Promise<boolean> {
    try {
      const response = await fetch(`${SYNC_API_BASE}${syncId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.ok;
    } catch (e) {
      console.error('Cloud Push Error:', e);
      return false;
    }
  },

  async pullFromCloud(syncId: string): Promise<Measurement[] | null> {
    try {
      const response = await fetch(`${SYNC_API_BASE}${syncId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      console.error('Cloud Pull Error:', e);
      return null;
    }
  }
};
