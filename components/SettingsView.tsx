
import React, { useState, useRef, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { 
  Cloud, 
  CloudOff,
  CloudDownload, 
  CloudUpload, 
  Key, 
  Copy, 
  Check, 
  ShieldCheck, 
  Loader2, 
  Zap,
  FileJson,
  Trash2,
  AlertCircle,
  Smartphone,
  Info,
  Link,
  RefreshCw
} from 'lucide-react';
import { SBRSettings } from '../types';

interface SettingsViewProps {
  onDataRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onDataRefresh }) => {
  const [settings, setSettings] = useState<SBRSettings>(storageService.getSettings());
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [vaultInput, setVaultInput] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateVault = async () => {
    setSyncStatus('loading');
    const newId = await storageService.createNewVault();
    if (newId) {
      const newSettings = { ...settings, syncId: newId, autoSyncEnabled: true };
      storageService.saveSettings(newSettings);
      setSettings(newSettings);
      
      // Pierwszy push obecnych danych do nowego vaulta
      const history = await storageService.getHistory();
      if (history.length > 0) {
        await storageService.pushToCloud(history, newId);
      }
      
      setSyncStatus('success');
      alert(`SUKCES!\nTwoja chmura została utworzona.\nKOD: ${newId}\nUżyj go na innych urządzeniach.`);
    } else {
      setSyncStatus('error');
      alert('BŁĄD SERWERA CHMURY\nSerwer npoint.io (darmowy hosting JSON) jest obecnie przeciążony i zwrócił błąd 500.\n\nSpróbuj ponownie za 30 sekund - zazwyczaj problem mija po chwili.');
    }
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const handleLinkVault = async () => {
    if (!vaultInput || vaultInput.length < 5) return alert('Wpisz poprawny kod Vault ID');
    setSyncStatus('loading');
    const data = await storageService.pullFromCloud(vaultInput);
    if (data) {
      await storageService.mergeHistory(data);
      const newSettings = { ...settings, syncId: vaultInput, autoSyncEnabled: true };
      storageService.saveSettings(newSettings);
      setSettings(newSettings);
      onDataRefresh();
      setSyncStatus('success');
      alert('POŁĄCZONO Z CHMURĄ! Dane zostały zsynchronizowane.');
      setVaultInput('');
    } else {
      setSyncStatus('error');
      alert('Nie znaleziono takiej chmury. Sprawdź czy kod jest poprawny.');
    }
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const handleManualSync = async () => {
    if (!settings.syncId) return;
    setSyncStatus('loading');
    const remoteData = await storageService.pullFromCloud(settings.syncId);
    if (remoteData) {
      await storageService.mergeHistory(remoteData);
      const history = await storageService.getHistory();
      await storageService.pushToCloud(history, settings.syncId);
      onDataRefresh();
      setSyncStatus('success');
    } else {
      setSyncStatus('error');
    }
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-28">
      <header className="px-2 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-100 uppercase flex items-center gap-3 tracking-tighter">
            <Cloud className="text-blue-500" /> SBR Cloud Sync
          </h2>
          <p className="text-[10px] text-slate-500 font-black uppercase mt-1 tracking-widest">Technologia Google Cloud Vault</p>
        </div>
        {settings.syncId && (
          <div className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full border border-green-500/20 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-widest">Połączono</span>
          </div>
        )}
      </header>

      {/* GŁÓWNA SEKCJA CHMURY */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        {!settings.syncId ? (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="bg-blue-600/20 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto">
                <ShieldCheck className="text-blue-500" size={32} />
              </div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed max-w-[250px] mx-auto">
                Nie masz jeszcze skonfigurowanej chmury. Wybierz opcję poniżej:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={handleCreateVault}
                disabled={syncStatus === 'loading'}
                className="w-full bg-blue-600 p-6 rounded-[2rem] flex flex-col items-center gap-2 hover:bg-blue-500 transition-all active:scale-95 shadow-xl shadow-blue-900/40 disabled:opacity-50 disabled:active:scale-100"
              >
                {syncStatus === 'loading' ? <Loader2 className="animate-spin" /> : <Zap size={28} className="fill-white" />}
                <span className="font-black text-xs uppercase tracking-widest">Utwórz nową chmurę</span>
                <span className="text-[8px] opacity-60 font-black uppercase">Otrzymasz swój unikalny kod</span>
              </button>

              <div className="relative pt-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                <div className="relative flex justify-center"><span className="bg-slate-900 px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">lub podłącz istniejącą</span></div>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text"
                  value={vaultInput}
                  onChange={(e) => setVaultInput(e.target.value)}
                  placeholder="Wpisz Kod (np. 4a2b...)"
                  className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-blue-400 font-black focus:border-blue-500 outline-none uppercase text-sm text-center"
                />
                <button 
                  onClick={handleLinkVault}
                  className="bg-slate-800 px-6 rounded-2xl text-white font-black hover:bg-slate-700 active:scale-95 transition-all"
                >
                  <Link size={20} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Twój unikalny Kod Chmury</p>
              <div className="flex items-center justify-center gap-4">
                <span className="text-2xl font-black text-blue-400 mono tracking-tighter uppercase">{settings.syncId}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(settings.syncId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-2 bg-slate-800 rounded-xl text-slate-400"
                >
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-[8px] text-slate-600 font-black uppercase mt-4 tracking-widest">Wpisz ten kod na innym telefonie, aby połączyć bazy</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={handleManualSync}
                className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl flex items-center justify-between group hover:border-blue-500 transition-all"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="bg-blue-600/10 p-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <RefreshCw size={20} />
                  </div>
                  <div>
                    <span className="block font-black text-[10px] uppercase tracking-widest text-white">Synchronizuj teraz</span>
                    <span className="text-[8px] text-slate-500 font-black uppercase">Ostatnio: {settings.lastSync ? new Date(settings.lastSync).toLocaleTimeString() : 'brak'}</span>
                  </div>
                </div>
                <Zap size={16} className="text-blue-500" />
              </button>

              <button 
                onClick={() => {
                  if(confirm('Na pewno odłączyć chmurę? Dane zostaną tylko na telefonie.')) {
                    storageService.saveSettings({ ...settings, syncId: '', autoSyncEnabled: false });
                    setSettings({ ...settings, syncId: '', autoSyncEnabled: false });
                  }
                }}
                className="w-full text-red-500/50 hover:text-red-500 font-black text-[9px] uppercase tracking-[0.2em] p-4 transition-colors"
              >
                Odłącz to urządzenie od chmury
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LOCAL BACKUP */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800">
        <h3 className="font-black text-slate-100 uppercase text-xs tracking-widest mb-6 flex items-center gap-3">
          <Smartphone className="text-amber-500" size={18} /> Kopia lokalna
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => storageService.exportToFile()}
            className="flex flex-col items-center gap-3 p-6 bg-slate-950 border border-slate-800 rounded-3xl hover:border-amber-500 transition-all active:scale-95"
          >
            <CloudDownload size={24} className="text-amber-500" />
            <span className="text-[9px] font-black uppercase text-slate-300">Eksportuj (.sbr)</span>
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-3 p-6 bg-slate-950 border border-slate-800 rounded-3xl hover:border-blue-500 transition-all active:scale-95"
          >
            <CloudUpload size={24} className="text-blue-500" />
            <span className="text-[9px] font-black uppercase text-slate-300">Importuj plik</span>
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
                    alert(`Dodano ${added} wpisów.`);
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

      <div className="px-6 flex flex-col gap-4">
        <div className="flex items-start gap-4 p-5 bg-blue-500/5 border border-blue-500/10 rounded-3xl">
          <Info size={20} className="text-blue-500 shrink-0" />
          <p className="text-[9px] text-slate-500 font-bold leading-relaxed uppercase">
            System Cloud Vault przechowuje zaszyfrowaną bazę pomiarów. Każda zmiana na dowolnym urządzeniu z tym samym kodem zaktualizuje pozostałe przy następnej synchronizacji.
          </p>
        </div>

        <button 
          onClick={() => {
            if(confirm('USUWANIE WSZYSTKIEGO. NA PEWNO?')) {
              storageService.setHistory([]);
              onDataRefresh();
            }
          }}
          className="w-full p-6 text-red-500/30 hover:text-red-500 transition-colors font-black text-[10px] uppercase tracking-widest bg-red-500/5 rounded-[2rem] border border-red-500/10 flex items-center justify-center gap-2"
        >
          <Trash2 size={16} /> Hard Reset danych lokalnych
        </button>
      </div>
    </div>
  );
};
