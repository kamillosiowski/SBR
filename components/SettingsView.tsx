
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { CloudDownload, CloudUpload, Key, Copy, Check, Database, AlertTriangle, RefreshCw, Loader2, Zap } from 'lucide-react';
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
      alert('Brak połączenia z internetem.');
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
        setSyncStatus('error');
      }
    } catch (err) {
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
    if (!settings.syncId) return alert('Brak Sync ID');
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
    if (!settings.syncId) return alert('Brak Sync ID');
    setSyncStatus('loading');
    const remoteData = await storageService.pullFromCloud(settings.syncId);
    if (remoteData) {
      if (confirm('Nadpisać dane lokalne danymi z chmury?')) {
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
        {settings.syncId && (
          <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
            <Zap size={12} className="fill-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Auto-Sync</span>
          </div>
        )}
      </div>

      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-blue-600/20 p-3 rounded-2xl">
            <Key className="text-blue-400" size={24} />
          </div>
          <div>
            <h3 className="font-black text-slate-100 uppercase text-xs tracking-widest">Globalne ID Pomiary</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Twoja baza danych w JsonBlob</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={settings.syncId}
            onChange={(e) => updateSyncId(e.target.value)}
            placeholder="Wklej ID z innego urządzenia..."
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
          {syncStatus === 'creating' ? 'TWORZENIE BAZY...' : 'WYGENERUJ NOWY KOD SYNC'}
        </button>

        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 mb-6">
          <div className="flex items-start gap-3">
            <Zap size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              <strong className="text-slate-100 uppercase">Automatyczny zapis:</strong> Każdy nowy pomiar dodany na tym urządzeniu zostanie natychmiast wysłany do chmury pod powyższe ID.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handlePush}
            disabled={syncStatus === 'loading' || syncStatus === 'creating' || !settings.syncId}
            className="flex flex-col items-center gap-3 p-6 bg-slate-950 border border-slate-800 rounded-3xl hover:border-blue-500/50 transition-all group active:scale-95 disabled:opacity-30"
          >
            <CloudUpload size={32} className="text-blue-500 group-hover:scale-110 transition-transform" />
            <div className="text-center">
              <span className="block font-black text-[10px] uppercase tracking-widest text-slate-100">Wymuś Push</span>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Ręczny zapis</span>
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
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Synchronizuj stąd</span>
            </div>
          </button>
        </div>

        {syncStatus !== 'idle' && (
          <div className={`mt-6 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border animate-in slide-in-from-top-2 ${
            syncStatus === 'loading' || syncStatus === 'creating' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            syncStatus === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
            'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {syncStatus === 'creating' && 'Łączenie z JsonBlob...'}
            {syncStatus === 'loading' && 'Trwa przesyłanie danych...'}
            {syncStatus === 'success' && 'SUKCES: Połączono z chmurą!'}
            {syncStatus === 'error' && 'BŁĄD: Spróbuj ponownie lub zmień sieć.'}
          </div>
        )}
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-3xl">
        <h4 className="text-amber-400 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
          <AlertTriangle size={16} /> Instrukcja multi-platform
        </h4>
        <ol className="text-[11px] text-amber-200/60 leading-relaxed font-medium space-y-2 list-decimal ml-4">
          <li>Wygeneruj ID na pierwszym urządzeniu.</li>
          <li>Skopiuj ID i prześlij na inne urządzenie (np. mailem/SMS).</li>
          <li>Na drugim urządzeniu wklej ID w pole tekstowe i kliknij <strong>Pobierz (Pull)</strong>.</li>
          <li>Teraz oba urządzenia mogą wspólnie budować jedną historię.</li>
        </ol>
      </div>
    </div>
  );
};
