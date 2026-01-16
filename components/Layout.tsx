
import React, { useEffect } from 'react';
import { 
  Activity, 
  PlusCircle, 
  History, 
  Wifi, 
  WifiOff, 
  Droplets 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  setView: (view: any) => void;
  isOnline: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, isOnline }) => {
  useEffect(() => {
    // Funkcja zapewniająca, że aplikacja zawsze uruchamia się w trybie ciemnym
    // zgodnie z wymaganiem: domyślnie tryb ciemny + sprawdzenie preferencji
    const root = window.document.documentElement;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Jeśli klasa dark nie jest jeszcze ustawiona, a system preferuje ciemny lub po prostu wymuszamy domyślny dark
    if (!root.classList.contains('dark')) {
      root.classList.add('dark');
    }

    // Opcjonalnie: nasłuchiwanie na zmiany w systemie (choć wymuszamy dark jako domyślny)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) root.classList.add('dark');
    };
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50 selection:bg-blue-500/30">
      {/* Top Header */}
      <header className="bg-slate-900/80 backdrop-blur-md text-white p-4 shadow-xl sticky top-0 z-50 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
            <Droplets size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">SBR Monitor</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Oczyszczalnia Ścieków</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${isOnline ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>
      </header>

      {/* Main Content with Transition */}
      <main key={currentView} className="view-transition flex-1 container mx-auto px-4 py-6 mb-24 max-w-4xl">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 flex justify-around items-center p-2 pb-safe shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.5)] z-50">
        <NavButton 
          active={currentView === 'dashboard'} 
          onClick={() => setView('dashboard')}
          icon={<Activity size={24} />}
          label="Status"
        />
        <NavButton 
          active={currentView === 'add'} 
          onClick={() => setView('add')}
          icon={<PlusCircle size={32} />}
          label="Dodaj"
          highlight
        />
        <NavButton 
          active={currentView === 'history'} 
          onClick={() => setView('history')}
          icon={<History size={24} />}
          label="Historia"
        />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  highlight?: boolean;
}> = ({ active, onClick, icon, label, highlight }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center transition-all duration-300 active:scale-90 ${
      highlight 
        ? 'bg-blue-600 text-white rounded-full p-4 -mt-12 shadow-[0_10px_25px_-5px_rgba(37,99,235,0.6)] border-4 border-slate-950 scale-110 hover:bg-blue-500' 
        : active ? 'text-blue-400 font-black' : 'text-slate-500 font-medium'
    }`}
  >
    <div className={`${active && !highlight ? 'drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : ''}`}>
      {icon}
    </div>
    {!highlight && <span className="text-[9px] mt-1 uppercase tracking-[0.2em]">{label}</span>}
  </button>
);
