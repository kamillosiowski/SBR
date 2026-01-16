
import { Measurement, SBRSettings } from '../types';

const STORAGE_KEY = 'sbr_monitor_data';
const SETTINGS_KEY = 'sbr_monitor_settings';

// Używamy stabilnego publicznego bucketu KVDB. 
// Dane są trzymane pod kluczem: sbr_v2_{TWOJE_HASLO}
const BUCKET_ID = '8pY6pYxRjPzQe9W1u4M9jA'; // Publiczny bucket dedykowany dla SBR Monitor
const API_URL = `https://kvdb.io/${BUCKET_ID}`;

export const storageService = {
  async saveMeasurement(measurement: Measurement): Promise<void> {
    const data = await this.getHistory();
    data.unshift(measurement);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    const settings = this.getSettings();
    if (settings.syncId && settings.syncId.length >= 3) {
      this.pushToCloud(data, settings.syncId).catch(() => {});
    }
  },

  async deleteMeasurement(id: string): Promise<void> {
    const data = await this.getHistory();
    const filtered = data.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    const settings = this.getSettings();
    if (settings.syncId && settings.syncId.length >= 3) {
      this.pushToCloud(filtered, settings.syncId).catch(() => {});
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

  async mergeHistory(newData: Measurement[]): Promise<number> {
    const current = await this.getHistory();
    const existingIds = new Set(current.map(m => m.id));
    const uniqueNew = newData.filter(m => !existingIds.has(m.id));
    
    if (uniqueNew.length > 0) {
      const merged = [...current, ...uniqueNew].sort((a, b) => b.timestamp - a.timestamp);
      await this.setHistory(merged);
    }
    return uniqueNew.length;
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

  async pushToCloud(data: Measurement[], syncId: string): Promise<boolean> {
    if (!syncId || syncId.length < 3) return false;
    try {
      const key = `sbr_v2_${syncId.toLowerCase()}`;
      const response = await fetch(`${API_URL}/${key}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response.ok;
    } catch (e) {
      console.error('Push failed', e);
      return false;
    }
  },

  async pullFromCloud(syncId: string): Promise<Measurement[] | null> {
    if (!syncId || syncId.length < 3) return null;
    try {
      const key = `sbr_v2_${syncId.toLowerCase()}`;
      const response = await fetch(`${API_URL}/${key}`);
      if (!response.ok) return null;
      const data = await response.json();
      return Array.isArray(data) ? data : null;
    } catch (e) {
      console.error('Pull failed', e);
      return null;
    }
  },

  exportToFile(): void {
    const data = localStorage.getItem(STORAGE_KEY) || '[]';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sbr_backup_${new Date().toISOString().split('T')[0]}.sbr`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Pobiera całą bazę jako ciąg znaków Base64 do ręcznego przesłania
  getRawBackupString(): string {
    const data = localStorage.getItem(STORAGE_KEY) || '[]';
    return btoa(unescape(encodeURIComponent(data)));
  },

  // Wczytuje bazę z ciągu znaków Base64
  async importFromRawString(base64: string): Promise<number> {
    try {
      const json = decodeURIComponent(escape(atob(base64)));
      const data = JSON.parse(json);
      return await this.mergeHistory(data);
    } catch {
      throw new Error('Nieprawidłowy format kodu synchronizacji');
    }
  }
};
