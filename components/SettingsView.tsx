
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Cloud, CloudDownload, CloudUpload, Key, Copy, Check, Database, AlertTriangle } from 'lucide-react';
import { SBRSettings, Measurement } from '../types';

interface SettingsViewProps {
  onDataRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onDataRefresh }) => {
  const [settings, setSettings] = useState<SBRSettings>(storageService.getSettings());
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const generateId = () => {
    const id = `sbr-${Math.random().toString(36).substr(2, 9)}`;
    updateSyncId(id);
  };

  const updateSyncId = (id: string) => {
    const newSettings = { ...settings, syncId: id };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  const copyToClipboard = () => {
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
    }
  };

  const handlePull = async () => {
    if (!settings.syncId) return alert('Wpisz Sync ID urządzenia źródłowego');
    setSyncStatus('loading');
    const remoteData = await storageService.pullFromCloud(settings.syncId);
    if (remoteData) {
      await storageService.setHistory(remoteData);
      setSyncStatus('success');
      onDataRefresh();
    } else {
      setSyncStatus('error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h2 className="text-2xl font-black text-slate-100 tracking-tight uppercase flex items-center gap-3">
        <Database className="text-blue-500" /> Synchronizacja
      </h2>

      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-blue-600/20 p-3 rounded-2xl">
            <Key className="text-blue-400" size={24} />
          </div>
          <div>
            <h3 className="font-black text-slate-100 uppercase text-xs tracking-widest">Twoje Sync ID</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Wpisz ten kod na innych urządzeniach</p>
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          <input 
            type="text" 
            value={settings.syncId}
            onChange={(e) => updateSyncId(e.target.value)}
            placeholder="np. sbr-abc-123"
            className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-blue-400 font-black mono focus:border-blue-500 outline-none transition-all"
          />
          <button 
            onClick={copyToClipboard}
            className="bg-slate-800 px-5 rounded-2xl text-slate-300 hover:text-white transition-colors"
          >
            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
          </button>
        </div>

        {!settings.syncId && (
          <button 
            onClick={generateId}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-800 text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] hover:border-blue-500/50 hover:text-blue-400 transition-all mb-8"
          >
            Generuj nowe Sync ID
          </button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={handlePush}
            disabled={syncStatus === 'loading'}
            className="flex flex-col items-center gap-3 p-6 bg-slate-950 border border-slate-800 rounded-3xl hover:border-blue-500/50 transition-all group"
          >
            <CloudUpload size={32} className="text-blue-500 group-hover:scale-110 transition-transform" />
            <div className="text-center">
              <span className="block font-black text-xs uppercase tracking-widest text-slate-100">Wyślij do chmury</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Zapisz dane z tego urządzenia</span>
            </div>
          </button>

          <button 
            onClick={handlePull}
            disabled={syncStatus === 'loading'}
            className="flex flex-col items-center gap-3 p-6 bg-slate-950 border border-slate-800 rounded-3xl hover:border-emerald-500/50 transition-all group"
          >
            <CloudDownload size={32} className="text-emerald-500 group-hover:scale-110 transition-transform" />
            <div className="text-center">
              <span className="block font-black text-xs uppercase tracking-widest text-slate-100">Pobierz z chmury</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Nadpisz danymi z chmury</span>
            </div>
          </button>
        </div>

        {syncStatus !== 'idle' && (
          <div className={`mt-6 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border ${
            syncStatus === 'loading' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            syncStatus === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
            'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {syncStatus === 'loading' && 'Synchronizacja w toku...'}
            {syncStatus === 'success' && 'Zakończono sukcesem!'}
            {syncStatus === 'error' && 'Błąd połączenia z chmurą'}
          </div>
        )}
      </div>

      <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-3xl">
        <h4 className="text-red-400 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
          <AlertTriangle size={16} /> Ważne
        </h4>
        <p className="text-[11px] text-red-300/60 leading-relaxed font-medium">
          Domyślnie aplikacja zapisuje dane tylko lokalnie. Aby widzieć te same dane na komputerze i telefonie, musisz ręcznie wysyłać (Push) i pobierać (Pull) dane, lub użyć wspólnego Sync ID. Dane w chmurze są identyfikowane wyłącznie Twoim kluczem.
        </p>
      </div>
    </div>
  );
};
