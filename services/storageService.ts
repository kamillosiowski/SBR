
import { Measurement, SBRSettings } from '../types';

const STORAGE_KEY = 'sbr_monitor_data';
const SETTINGS_KEY = 'sbr_monitor_settings';

// Stabilny serwis do przechowywania JSON
const API_BASE = 'https://jsonblob.com/api/jsonBlob';

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

  // Tworzy nowy kontener w chmurze i zwraca jego ID
  async createCloudBin(): Promise<string | null> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify([])
      });
      if (!response.ok) return null;
      // ID znajduje się w nagłówku Location (koniec urla)
      const location = response.headers.get('Location');
      if (!location) return null;
      return location.split('/').pop() || null;
    } catch (e) {
      console.error('Create Bin Error:', e);
      return null;
    }
  },

  async pushToCloud(data: Measurement[], syncId: string): Promise<boolean> {
    if (!syncId) return false;
    try {
      const response = await fetch(`${API_BASE}/${syncId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
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
      const response = await fetch(`${API_BASE}/${syncId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
      if (!response.ok) return null;
      const data = await response.json();
      return Array.isArray(data) ? data : null;
    } catch (e) {
      console.error('Cloud Pull Error:', e);
      return null;
    }
  }
};
