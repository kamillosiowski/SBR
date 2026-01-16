
import React, { useState, useRef } from 'react';
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
  Smartphone,
  Trash2,
  AlertCircle,
  ArrowRightLeft,
  ClipboardList,
  Download
} from 'lucide-react';
import { SBRSettings } from '../types';

interface SettingsViewProps {
  onDataRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onDataRefresh }) => {
  const [settings, setSettings] = useState<SBRSettings>(storageService.getSettings());
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [manualCode, setManualCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateSyncId = (id: string) => {
    // Czyścimy ID ze znaków specjalnych
    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const newSettings = { ...settings, syncId: cleanId };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  const handlePush = async () => {
    if (!settings.syncId || settings.syncId.length < 3) return alert('Wpisz hasło (min. 3 znaki)');
    setSyncStatus('loading');
    const data = await storageService.getHistory();
    const ok = await storageService.pushToCloud(data, settings.syncId);
    setSyncStatus(ok ? 'success' : 'error');
    if (ok) {
      setTimeout(() => setSyncStatus('idle'), 2000);
    } else {
      alert('Błąd wysyłania. Sprawdź internet.');
    }
  };

  const handlePull = async () => {
    if (!settings.syncId || settings.syncId.length < 3) return alert('Wpisz hasło (min. 3 znaki)');
    setSyncStatus('loading');
    const remoteData = await storageService.pullFromCloud(settings.syncId);
    if (remoteData) {
      const added = await storageService.mergeHistory(remoteData);
      setSyncStatus('success');
      onDataRefresh();
      alert(`SUKCES! Pobrano dane. Dodano ${added} nowych wpisów.`);
    } else {
      setSyncStatus('error');
      alert('NIE ZNALEZIONO DANYCH. Upewnij się, że na drugim telefonie kliknąłeś "WYŚLIJ" używając tego samego hasła.');
    }
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const handleManualImport = async () => {
    if (!manualCode) return;
    try {
      const added = await storageService.importFromRawString(manualCode);
      onDataRefresh();
      alert(`Zaimportowano ${added} wpisów.`);
      setManualCode('');
    } catch (e) {
      alert('Błędny kod!');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-28">
      <header className="px-2">
        <h2 className="text-2xl font-black text-slate-100 uppercase flex items-center gap-3 tracking-tighter">
          <ShieldCheck className="text-blue-500" /> Centrum Synchronizacji
        </h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Łączenie telefonów bez kont i logowania</p>
      </header>

      {/* CLOUD SECTION */}
      <div className="bg-slate-900 rounded-[2rem] p-6 border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600/20 p-2 rounded-xl">
            <Key className="text-blue-400" size={20} />
          </div>
          <h3 className="font-black text-slate-100 uppercase text-xs tracking-widest">Twoje Wspólne Hasło</h3>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input 
              type="text" 
              value={settings.syncId}
              onChange={(e) => updateSyncId(e.target.value)}
              placeholder="np. oczyszczalnia_jan"
              className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-blue-400 font-black focus:border-blue-500 outline-none transition-all uppercase text-center text-lg"
            />
            <p className="text-[9px] text-slate-600 font-black uppercase text-center mt-2 tracking-widest">Wymyśl hasło i wpisz je na obu telefonach</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={handlePush}
              disabled={syncStatus === 'loading' || settings.syncId.length < 3}
              className="flex flex-col items-center gap-2 p-5 bg-blue-600 rounded-2xl hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-20"
            >
              {syncStatus === 'loading' ? <Loader2 className="animate-spin" /> : <CloudUpload size={24} />}
              <span className="font-black text-[9px] uppercase tracking-widest text-white">Wyślij (PUSH)</span>
            </button>

            <button 
              onClick={handlePull}
              disabled={syncStatus === 'loading' || settings.syncId.length < 3}
              className="flex flex-col items-center gap-2 p-5 bg-emerald-600 rounded-2xl hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-20"
            >
              {syncStatus === 'loading' ? <Loader2 className="animate-spin" /> : <CloudDownload size={24} />}
              <span className="font-black text-[9px] uppercase tracking-widest text-white">Pobierz (PULL)</span>
            </button>
          </div>
        </div>

        {syncStatus === 'success' && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-center text-green-400 text-[10px] font-black uppercase">
            Gotowe! Dane zsynchronizowane.
          </div>
        )}
      </div>

      {/* MANUAL SYNC SECTION */}
      <div className="bg-slate-900 rounded-[2rem] p-6 border border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-600/20 p-2 rounded-xl">
            <ClipboardList className="text-amber-400" size={20} />
          </div>
          <h3 className="font-black text-slate-100 uppercase text-xs tracking-widest">Sync ręczny (bez internetu)</h3>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => {
              const str = storageService.getRawBackupString();
              navigator.clipboard.writeText(str);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
              alert('Baza skopiowana do schowka! Wklej ją na drugim telefonie.');
            }}
            className="w-full flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-amber-500 transition-all"
          >
            <span className="text-[10px] font-black uppercase text-slate-300">Kopiuj całą bazę</span>
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-amber-500" />}
          </button>

          <div className="flex gap-2">
            <input 
              type="text" 
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Wklej kod tutaj..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-3 text-[10px] text-slate-400 font-mono outline-none focus:border-blue-500"
            />
            <button 
              onClick={handleManualImport}
              className="bg-slate-800 px-4 rounded-2xl text-blue-400 active:scale-95"
            >
              <Download size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* FILE SECTION */}
      <div className="bg-slate-900 rounded-[2rem] p-6 border border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-slate-700 p-2 rounded-xl">
            <FileJson className="text-slate-400" size={20} />
          </div>
          <h3 className="font-black text-slate-100 uppercase text-xs tracking-widest">Kopia plikowa (.sbr)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button 
            onClick={() => storageService.exportToFile()}
            className="flex items-center justify-center gap-2 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-300 hover:border-slate-500"
          >
            <Download size={14} /> Eksportuj plik
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-300 hover:border-slate-500"
          >
            <RefreshCw size={14} /> Importuj plik
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
                  } catch { alert('Błąd pliku!'); }
                };
                reader.readAsText(file);
              }} 
              accept=".sbr,.json" 
              className="hidden" 
            />
          </button>
        </div>
      </div>

      <div className="px-4">
        <button 
          onClick={() => {
            if(confirm('USUWANIE WSZYSTKIEGO. NA PEWNO?')) {
              storageService.setHistory([]);
              onDataRefresh();
            }
          }}
          className="w-full p-4 text-red-500/50 hover:text-red-500 transition-colors font-black text-[10px] uppercase tracking-widest bg-red-500/5 rounded-2xl border border-red-500/10 flex items-center justify-center gap-2"
        >
          <Trash2 size={16} /> Wyczyść dane z telefonu
        </button>
      </div>
    </div>
  );
};
