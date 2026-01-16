
import React, { useState, useRef, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { 
  CloudDownload, 
  CloudUpload, 
  Key, 
  Copy, 
  Check, 
  ShieldCheck, 
  RefreshCw, 
  Loader2, 
  Zap,
  FileJson,
  QrCode,
  Smartphone,
  Trash2,
  AlertCircle,
  ArrowRightLeft
} from 'lucide-react';
import { SBRSettings } from '../types';

interface SettingsViewProps {
  onDataRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onDataRefresh }) => {
  const [settings, setSettings] = useState<SBRSettings>(storageService.getSettings());
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showQR, setShowQR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateSyncId = (id: string) => {
    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const newSettings = { ...settings, syncId: cleanId };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  const generateRandomKey = () => {
    const random = Math.random().toString(36).substring(2, 12);
    updateSyncId(random);
  };

  const handlePush = async () => {
    if (!settings.syncId || settings.syncId.length < 4) return alert('Klucz musi mieć min. 4 znaki');
    setSyncStatus('loading');
    const data = await storageService.getHistory();
    const ok = await storageService.pushToCloud(data, settings.syncId);
    setSyncStatus(ok ? 'success' : 'error');
    if (ok) {
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  const handlePull = async () => {
    if (!settings.syncId || settings.syncId.length < 4) return alert('Klucz musi mieć min. 4 znaki');
    setSyncStatus('loading');
    const remoteData = await storageService.pullFromCloud(settings.syncId);
    if (remoteData) {
      const added = await storageService.mergeHistory(remoteData);
      setSyncStatus('success');
      onDataRefresh();
      alert(`Pobrano dane. Dodano ${added} nowych pomiarów.`);
    } else {
      setSyncStatus('error');
      alert('Nie znaleziono danych pod tym kluczem w chmurze.');
    }
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${settings.syncId}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-28">
      <header className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black text-slate-100 uppercase flex items-center gap-3 tracking-tighter">
          <ArrowRightLeft className="text-blue-500" /> Sync Manager
        </h2>
        {settings.syncId.length >= 4 && (
          <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-2">
            <Zap size={10} className="fill-blue-400" />
            <span className="text-[9px] font-black uppercase tracking-widest">Active</span>
          </div>
        )}
      </header>

      {/* Cloud Sync - Nowy model */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-600/20 p-3 rounded-2xl">
            <ShieldCheck className="text-blue-400" size={24} />
          </div>
          <div>
            <h3 className="font-black text-slate-100 uppercase text-xs tracking-widest">Twój Prywatny Kanał</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Wpisz dowolne hasło, aby połączyć telefony</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <input 
              type="text" 
              value={settings.syncId}
              onChange={(e) => updateSyncId(e.target.value)}
              placeholder="np. oczyszczalnia123"
              className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl p-5 text-blue-400 font-black mono focus:border-blue-500 outline-none transition-all uppercase text-lg pr-32"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(settings.syncId);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white active:scale-90 transition-all"
              >
                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
              <button 
                onClick={() => setShowQR(!showQR)}
                className={`p-3 rounded-2xl transition-all active:scale-90 ${showQR ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                <QrCode size={18} />
              </button>
            </div>
          </div>

          {showQR && settings.syncId.length >= 4 && (
            <div className="flex flex-col items-center py-6 bg-white rounded-3xl animate-in zoom-in-95 duration-300">
              <img src={qrUrl} alt="QR Code Sync" className="w-40 h-40" />
              <p className="mt-3 text-[10px] font-black uppercase text-slate-950">Zeskanuj, aby przejąć klucz</p>
            </div>
          )}

          {!settings.syncId && (
            <button 
              onClick={generateRandomKey}
              className="w-full py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-blue-400 transition-colors"
            >
              Wygeneruj losowy klucz bezpieczny
            </button>
          )}

          <div className="grid grid-cols-2 gap-4 mt-6">
            <button 
              onClick={handlePush}
              disabled={syncStatus === 'loading' || settings.syncId.length < 4}
              className="flex flex-col items-center gap-3 p-6 bg-slate-950 border border-slate-800 rounded-[2rem] hover:border-blue-500/50 transition-all group active:scale-95 disabled:opacity-20"
            >
              {syncStatus === 'loading' ? <Loader2 className="animate-spin text-blue-500" /> : <CloudUpload size={28} className="text-blue-500 group-hover:scale-110 transition-transform" />}
              <span className="font-black text-[10px] uppercase tracking-widest text-slate-100">Wypchnij (Push)</span>
            </button>

            <button 
              onClick={handlePull}
              disabled={syncStatus === 'loading' || settings.syncId.length < 4}
              className="flex flex-col items-center gap-3 p-6 bg-slate-950 border border-slate-800 rounded-[2rem] hover:border-emerald-500/50 transition-all group active:scale-95 disabled:opacity-20"
            >
              {syncStatus === 'loading' ? <Loader2 className="animate-spin text-emerald-500" /> : <CloudDownload size={28} className="text-emerald-500 group-hover:scale-110 transition-transform" />}
              <span className="font-black text-[10px] uppercase tracking-widest text-slate-100">Pobierz (Pull)</span>
            </button>
          </div>
        </div>

        {syncStatus === 'success' && (
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-center text-green-400 text-[10px] font-black uppercase tracking-widest animate-in fade-in duration-300">
            Pomyślnie zsynchronizowano z chmurą!
          </div>
        )}
      </div>

      {/* Local Section */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-amber-600/20 p-3 rounded-2xl">
            <Smartphone className="text-amber-400" size={24} />
          </div>
          <h3 className="font-black text-slate-100 uppercase text-xs tracking-widest">Transfer przez plik</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={() => storageService.exportToFile()}
            className="flex items-center justify-between p-5 bg-slate-950 border border-slate-800 rounded-3xl hover:border-amber-500 transition-all active:scale-[0.98]"
          >
            <span className="text-[10px] font-black uppercase text-slate-300">Eksportuj (.sbr)</span>
            <FileJson size={20} className="text-amber-500" />
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-between p-5 bg-slate-950 border border-slate-800 rounded-3xl hover:border-blue-500 transition-all active:scale-[0.98]"
          >
            <span className="text-[10px] font-black uppercase text-slate-300">Importuj plik</span>
            <RefreshCw size={20} className="text-blue-500" />
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (ev) => {
                  try {
                    const data = JSON.parse(ev.target?.result as string);
                    const added = await storageService.mergeHistory(data);
                    onDataRefresh();
                    alert(`Import sukces! Dodano ${added} nowych pomiarów.`);
                  } catch {
                    alert('Niepoprawny format pliku.');
                  }
                };
                reader.readAsText(file);
              }} 
              accept=".sbr,.json" 
              className="hidden" 
            />
          </button>
        </div>
      </div>

      <div className="px-6 flex flex-col gap-4">
        <div className="flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <AlertCircle size={20} className="text-slate-600 shrink-0" />
          <p className="text-[9px] text-slate-500 font-bold leading-relaxed uppercase">
            Każdy pomiar zapisany na telefonie automatycznie leci do chmury pod Twój klucz. Użyj tego samego klucza na innym telefonie i kliknij "Pobierz", aby połączyć bazy.
          </p>
        </div>

        <button 
          onClick={() => {
            if(confirm('CZYŚCISZ WSZYSTKO LOKALNIE. NA PEWNO?')) {
              storageService.setHistory([]);
              onDataRefresh();
            }
          }}
          className="w-full flex items-center justify-center gap-2 p-6 text-red-500/50 hover:text-red-500 transition-colors font-black text-[10px] uppercase tracking-widest bg-red-500/5 rounded-3xl border border-red-500/10"
        >
          <Trash2 size={16} /> Usuń dane z tego urządzenia
        </button>
      </div>
    </div>
  );
};
