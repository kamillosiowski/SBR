import { Measurement, SBRSettings } from '../types';

const STORAGE_KEY = 'sbr_monitor_data';
const SETTINGS_KEY = 'sbr_monitor_settings';

// npoint.io API: endpoint bez /documents w ścieżce
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

  // UWAGA: npoint.io nie pozwala na tworzenie dokumentów przez API bez logowania
  // Użytkownicy muszą utworzyć dokument ręcznie na www.npoint.io
  async createCloudBin(): Promise<string | null> {
    // Przekieruj użytkownika do manualnego utworzenia dokumentu
    alert('Aby utworzyć nowe ID Sync:\n\n' +
          '1. Otwórz https://www.npoint.io/\n' +
          '2. Kliknij "Create JSON Bin"\n' +
          '3. Skopiuj token z URL (np. 30a7bdb0ebb9d9477e74)\n' +
          '4. Wklej go tutaj jako Sync ID');
    return null;
  },

  async pushToCloud(data: Measurement[], syncId: string): Promise<boolean> {
    if (!syncId) return false;
    try {
      // Token jest bezpośrednio w URL, bez /documents
      const response = await fetch(`${API_BASE}/${syncId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)  // Wysyłaj dane bezpośrednio, nie w obiekcie sbr_data
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
      // Dane powinny być bezpośrednio tablicą
      return Array.isArray(result) ? result : null;
    } catch (e) {
      console.error('Cloud Pull Error:', e);
      return null;
    }
  }
};
