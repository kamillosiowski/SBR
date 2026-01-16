
import { Measurement, SBRSettings } from '../types';

const STORAGE_KEY = 'sbr_monitor_data';
const SETTINGS_KEY = 'sbr_monitor_settings';

// Używamy publicznego, stabilnego API Key-Value, które pozwala na bezpośredni dostęp bez "tworzenia" bazy
const API_URL = 'https://api.keyvalue.xyz';

export const storageService = {
  async saveMeasurement(measurement: Measurement): Promise<void> {
    const data = await this.getHistory();
    data.unshift(measurement);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    const settings = this.getSettings();
    if (settings.syncId && settings.syncId.length > 3) {
      this.pushToCloud(data, settings.syncId).catch(() => {});
    }
  },

  async deleteMeasurement(id: string): Promise<void> {
    const data = await this.getHistory();
    const filtered = data.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    const settings = this.getSettings();
    if (settings.syncId && settings.syncId.length > 3) {
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

  // Teraz push/pull działa na Twoim kluczu - bez potrzeby "tworzenia" bazy na serwerze
  async pushToCloud(data: Measurement[], syncId: string): Promise<boolean> {
    if (!syncId || syncId.length < 4) return false;
    try {
      // Prefiks sbr_ chroni przed kolizjami z innymi aplikacjami używającymi tego API
      const response = await fetch(`${API_URL}/sbr_${syncId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  async pullFromCloud(syncId: string): Promise<Measurement[] | null> {
    if (!syncId || syncId.length < 4) return null;
    try {
      const response = await fetch(`${API_URL}/sbr_${syncId}`);
      if (!response.ok) return null;
      const data = await response.json();
      return Array.isArray(data) ? data : null;
    } catch (e) {
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
  }
};
