
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { CloudDownload, CloudUpload, Key, Copy, Check, Database, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { SBRSettings } from '../types';

interface SettingsViewProps {
  onDataRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onDataRefresh }) => {
  const [settings, setSettings] = useState<SBRSettings>(storageService.getSettings());
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'creating'>('idle');

  const generateId = async () => {
    if (!navigator.onLine) {
      alert('Brak połączenia z internetem w przeglądarce.');
      return;
    }
    setSyncStatus('creating');
    try {
      const newId = await storageService.createCloudBin();
      if (newId) {
        const newSettings = { ...settings, syncId: newId };
        setSettings(newSettings);
        storageService.saveSettings(newSettings);
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        console.error('Failed to get ID from server');
        setSyncStatus('error');
      }
    } catch (err) {
      console.error('Critical sync error:', err);
      setSyncStatus('error');
    }
  };

  const updateSyncId = (id: string) => {
    const cleanId = id.trim();
    const newSettings = { ...settings, syncId: cleanId };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  const copyToClipboard = () => {
    if (!settings.syncId) return;
    navigator.clipboard.writeText(settings.syncId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePush = async () => {
    if (!settings.syncId) return alert('Najpierw wygeneruj lub wpisz Sync ID');
    setSyncStatus('loading');
    const data = await storageService.getHistory();
    const ok = await storageService.pushToCloud(data, settings.syncId);
    setSyncStatus(ok ? 'success' : 'error');
    if (ok) {
      storageService.saveSettings({ ...settings, lastSync: Date.now() });
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handlePull = async () => {
    if (!settings.syncId) return alert('Wpisz Sync ID urządzenia źródłowego');
    setSyncStatus('loading');
    const remoteData = await storageService.pullFromCloud(settings.syncId);
    if (remoteData) {
      if (confirm('UWAGA: Czy na pewno chcesz nadpisać lokalne dane tymi z chmury?')) {
        await storageService.setHistory(remoteData);
        setSyncStatus('success');
        onDataRefresh();
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('idle');
      }
    } else {
      setSyncStatus('error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-100 tracking-tight uppercase flex items-center gap-3">
          <Database className="text-blue-500" /> Chmura SBR
        </h2>
        {!navigator.onLine && (
          <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full font-black">BRAK SIECI</span>
        )}
      </div>

      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-blue-600/20 p-3 rounded-2xl">
            <Key className="text-blue-400" size={24} />
          </div>
          <div>
            <h3 className="font-black text-slate-100 uppercase text-xs tracking-widest">Twoje ID w chmurze</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Klucz dostępu do Twoich pomiarów</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={settings.syncId}
            onChange={(e) => updateSyncId(e.target.value)}
            placeholder="Wpisz lub wygeneruj ID..."
            className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-blue-400 font-black mono focus:border-blue-500 outline-none transition-all uppercase text-sm"
          />
          <button 
            onClick={copyToClipboard}
            disabled={!settings.syncId}
            className="bg-slate-800 px-5 rounded-2xl text-slate-300 hover:text-white transition-colors disabled:opacity-20"
          >
            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
          </button>
        </div>

        <button 
          onClick={generateId}
          disabled={syncStatus === 'creating'}
          className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-blue-900/30 hover:brightness-110 active:scale-95 transition-all mb-8 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {syncStatus === 'creating' ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
          {syncStatus === 'creating' ? 'ŁĄCZENIE Z CHMURĄ...' : 'GENERUJ NOWE ID SYNC'}
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handlePush}
            disabled={syncStatus === 'loading' || syncStatus === 'creating' || !settings.syncId}
            className="flex flex-col items-center gap-3 p-6 bg-slate-950 border border-slate-800 rounded-3xl hover:border-blue-500/50 transition-all group active:scale-95 disabled:opacity-30"
          >
            <CloudUpload size={32} className="text-blue-500 group-hover:scale-110 transition-transform" />
            <div className="text-center">
              <span className="block font-black text-[10px] uppercase tracking-widest text-slate-100">Wyślij (Push)</span>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Zapisz historię</span>
            </div>
          </button>

          <button 
            onClick={handlePull}
            disabled={syncStatus === 'loading' || syncStatus === 'creating' || !settings.syncId}
            className="flex flex-col items-center gap-3 p-6 bg-slate-950 border border-slate-800 rounded-3xl hover:border-emerald-500/50 transition-all group active:scale-95 disabled:opacity-30"
          >
            <CloudDownload size={32} className="text-emerald-500 group-hover:scale-110 transition-transform" />
            <div className="text-center">
              <span className="block font-black text-[10px] uppercase tracking-widest text-slate-100">Pobierz (Pull)</span>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Odbierz historię</span>
            </div>
          </button>
        </div>

        {syncStatus !== 'idle' && (
          <div className={`mt-6 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border animate-in slide-in-from-top-2 ${
            syncStatus === 'loading' || syncStatus === 'creating' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            syncStatus === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
            'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {syncStatus === 'creating' && 'Łączenie z serwerem npoint...'}
            {syncStatus === 'loading' && 'Trwa przesyłanie danych...'}
            {syncStatus === 'success' && 'SUKCES: Operacja zakończona!'}
            {syncStatus === 'error' && 'BŁĄD: Nie udało się połączyć. Sprawdź konsolę (F12).'}
          </div>
        )}
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-3xl">
        <h4 className="text-amber-400 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
          <AlertTriangle size={16} /> Rozwiązywanie problemów
        </h4>
        <ol className="text-[11px] text-amber-200/60 leading-relaxed font-medium space-y-2 list-decimal ml-4">
          <li>Jeśli nadal masz błąd, spróbuj odświeżyć stronę (F5) i spróbować ponownie.</li>
          <li>Upewnij się, że Twoja sieć firmowa/szkolna nie blokuje domeny <strong>api.npoint.io</strong>.</li>
          <li>Jeśli masz ID z innego urządzenia, wpisz je ręcznie i kliknij <strong>Pobierz (Pull)</strong>.</li>
        </ol>
      </div>
    </div>
  );
};
