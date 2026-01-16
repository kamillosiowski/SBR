
import { Measurement, SBRSettings } from '../types';

const STORAGE_KEY = 'sbr_monitor_data';
const SETTINGS_KEY = 'sbr_monitor_settings';

// Przejście na JsonBlob - wysoka stabilność i brak restrykcji CORS
const API_BASE = 'https://jsonblob.com/api/jsonBlob';

export const storageService = {
  async saveMeasurement(measurement: Measurement): Promise<void> {
    const data = await this.getHistory();
    data.unshift(measurement);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    // AUTOMATYCZNY PUSH: Jeśli mamy ID, wysyłamy w tle
    const settings = this.getSettings();
    if (settings.syncId) {
      console.log('Auto-sync triggered for:', settings.syncId);
      this.pushToCloud(data, settings.syncId).catch(err => {
        console.warn('Auto-sync failed (offline?), data saved locally.', err);
      });
    }
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
    
    // Auto-sync po usunięciu
    const settings = this.getSettings();
    if (settings.syncId) {
      this.pushToCloud(filtered, settings.syncId).catch(() => {});
    }
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

  async createCloudBin(): Promise<string | null> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ sbr_data: [] }) 
      });
      
      if (!response.ok) return null;
      
      // JsonBlob zwraca ID w nagłówku x-jsonblob lub Location
      const blobId = response.headers.get('x-jsonblob') || 
                     response.headers.get('Location')?.split('/').pop();
      
      return blobId || null;
    } catch (e) {
      console.error('Network error during createCloudBin:', e);
      return null;
    }
  },

  async pushToCloud(data: Measurement[], syncId: string): Promise<boolean> {
    if (!syncId) return false;
    try {
      const response = await fetch(`${API_BASE}/${syncId}`, {
        method: 'PUT',
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
      const response = await fetch(`${API_BASE}/${syncId}`);
      if (!response.ok) return null;
      const result = await response.json();
      const data = result.sbr_data || result;
      return Array.isArray(data) ? data : null;
    } catch (e) {
      console.error('Cloud Pull Error:', e);
      return null;
    }
  }
};
