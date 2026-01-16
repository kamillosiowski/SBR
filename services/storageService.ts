
import { Measurement, SBRSettings } from '../types';

const STORAGE_KEY = 'sbr_monitor_data';
const SETTINGS_KEY = 'sbr_monitor_settings';

// npoint.io API
// Końcowy ukośnik jest krytyczny dla poprawności niektórych metod POST na tym serwerze
const API_BASE = 'https://api.npoint.io/';

export const storageService = {
  async saveMeasurement(measurement: Measurement): Promise<void> {
    const data = await this.getHistory();
    data.unshift(measurement);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    const settings = this.getSettings();
    if (settings.syncId && settings.autoSyncEnabled) {
      this.pushToCloud(data, settings.syncId).catch(console.error);
    }
  },

  async deleteMeasurement(id: string): Promise<void> {
    const data = await this.getHistory();
    const filtered = data.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    const settings = this.getSettings();
    if (settings.syncId && settings.autoSyncEnabled) {
      this.pushToCloud(filtered, settings.syncId).catch(console.error);
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

  /**
   * Tworzy nowy "Vault" w chmurze npoint.io.
   * Wykorzystuje progresywne opóźnienie (backoff) w przypadku błędów 500.
   */
  async createNewVault(retries = 3): Promise<string | null> {
    const attempt = 4 - retries;
    console.log(`SBR Cloud: Inicjalizacja (Próba ${attempt}/3)...`);
    
    try {
      // Przy trzeciej próbie wysyłamy całkowicie pusty obiekt jako fallback
      const payload = retries === 1 ? {} : { 
        measurements: [],
        _v: 1.1,
        _app: "SBR Monitor",
        _ts: Date.now()
      };

      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        if (response.status === 500 && retries > 0) {
          const delay = attempt * 1500; // 1.5s, 3s, 4.5s
          console.warn(`SBR Cloud: Serwer zgłosił 500. Ponawiam za ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          return this.createNewVault(retries - 1);
        }
        console.error(`SBR Cloud: Błąd HTTP ${response.status}`);
        return null;
      }
      
      const result = await response.json();
      if (result && result.id) {
        console.log('SBR Cloud: Utworzono pomyślnie. ID:', result.id);
        return result.id;
      }
      
      return null;
    } catch (e) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 2000));
        return this.createNewVault(retries - 1);
      }
      console.error('SBR Cloud: Błąd sieci', e);
      return null;
    }
  },

  /**
   * Wysyła dane do istniejącej chmury
   */
  async pushToCloud(data: Measurement[], syncId: string): Promise<boolean> {
    if (!syncId) return false;
    try {
      const response = await fetch(`${API_BASE}${syncId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measurements: data })
      });
      
      if (response.ok) {
        const settings = this.getSettings();
        this.saveSettings({ ...settings, lastSync: Date.now() });
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  /**
   * Pobiera dane z chmury
   */
  async pullFromCloud(syncId: string): Promise<Measurement[] | null> {
    if (!syncId) return null;
    try {
      const response = await fetch(`${API_BASE}${syncId}`);
      if (!response.ok) return null;
      const result = await response.json();
      return result.measurements || [];
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
