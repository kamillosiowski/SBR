import { Measurement, SBRSettings } from '../types';

const STORAGE_KEY = 'sbr_monitor_data';
const SETTINGS_KEY = 'sbr_monitor_settings';

// npoint.io API: prawidłowy endpoint bazowy
const API_BASE = 'https://api.npoint.io';

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
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.sort((a, b) => b.timestamp - a.timestamp) : [];
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
    try {
      return JSON.parse(raw);
    } catch {
      return { syncId: '' };
    }
  },

  saveSettings(settings: SBRSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  // Tworzenie nowego dokumentu w chmurze
  async createCloudBin(): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE}/documents`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ sbr_data: [] }) 
      });
      
      if (!response.ok) {
        console.error('API Error Response:', await response.text());
        return null;
      }
      
      const result = await response.json();
      // npoint zwraca token dokumentu
      return result.token || null;
    } catch (e) {
      console.error('Network error during createCloudBin:', e);
      return null;
    }
  },

  async pushToCloud(data: Measurement[], syncId: string): Promise<boolean> {
    if (!syncId) return false;
    try {
      // Aktualizacja dokumentu przez POST na /documents/:token
      const response = await fetch(`${API_BASE}/documents/${syncId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sbr_data: data })
      });
      return response.ok;
    } catch (e) {
      console.error('Cloud Push Error:', e);
      return false;
    }
  },

  async pullFromCloud(syncId: string): Promise<Measurement[] | null> {
    if (!syncId) return null;
    try {
      const response = await fetch(`${API_BASE}/documents/${syncId}`);
      if (!response.ok) return null;
      const result = await response.json();
      // Dane mogą być owinięte w obiekt sbr_data lub być bezpośrednio tablicą
      const data = result.sbr_data || result;
      return Array.isArray(data) ? data : null;
    } catch (e) {
      console.error('Cloud Pull Error:', e);
      return null;
    }
  }
};
