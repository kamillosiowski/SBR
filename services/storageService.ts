
import { Measurement, SBRSettings } from '../types';

const STORAGE_KEY = 'sbr_monitor_data';
const SETTINGS_KEY = 'sbr_monitor_settings';

// npoint.io to jeden z najstabilniejszych darmowych JSON storage, świetny do "Cloud Sync"
const API_BASE = 'https://api.npoint.io';

export const storageService = {
  async saveMeasurement(measurement: Measurement): Promise<void> {
    const data = await this.getHistory();
    data.unshift(measurement);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    const settings = this.getSettings();
    if (settings.syncId && settings.autoSyncEnabled) {
      this.pushToCloud(data, settings.syncId).catch(() => {});
    }
  },

  async deleteMeasurement(id: string): Promise<void> {
    const data = await this.getHistory();
    const filtered = data.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    const settings = this.getSettings();
    if (settings.syncId && settings.autoSyncEnabled) {
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
    if (!raw) return { syncId: '', autoSyncEnabled: false };
    try {
      const parsed = JSON.parse(raw);
      return {
        syncId: parsed.syncId || '',
        autoSyncEnabled: parsed.autoSyncEnabled ?? false,
        lastSync: parsed.lastSync
      };
    } catch {
      return { syncId: '', autoSyncEnabled: false };
    }
  },

  saveSettings(settings: SBRSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  // Tworzy nowy "Vault" w chmurze i zwraca jego ID
  async createNewVault(): Promise<string | null> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measurements: [] })
      });
      if (!response.ok) return null;
      const result = await response.json();
      return result.id || null;
    } catch (e) {
      console.error('Vault creation failed', e);
      return null;
    }
  },

  async pushToCloud(data: Measurement[], syncId: string): Promise<boolean> {
    if (!syncId) return false;
    try {
      const response = await fetch(`${API_BASE}/${syncId}`, {
        method: 'POST', // npoint używa POST do aktualizacji
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measurements: data })
      });
      if (response.ok) {
        const settings = this.getSettings();
        this.saveSettings({ ...settings, lastSync: Date.now() });
      }
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  async pullFromCloud(syncId: string): Promise<Measurement[] | null> {
    if (!syncId) return null;
    try {
      const response = await fetch(`${API_BASE}/${syncId}`);
      if (!response.ok) return null;
      const result = await response.json();
      return result.measurements || null;
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
  },

  getRawBackupString(): string {
    const data = localStorage.getItem(STORAGE_KEY) || '[]';
    return btoa(unescape(encodeURIComponent(data)));
  },

  async importFromRawString(base64: string): Promise<number> {
    try {
      const json = decodeURIComponent(escape(atob(base64)));
      const data = JSON.parse(json);
      return await this.mergeHistory(data);
    } catch {
      throw new Error('Format error');
    }
  }
};
