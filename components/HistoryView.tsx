
import React, { useState } from 'react';
import { Measurement } from '../types';
import { 
  FileDown, 
  Trash2, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface HistoryViewProps {
  measurements: Measurement[];
  onDelete: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ measurements, onDelete }) => {
  const [filter, setFilter] = useState<string>('all');

  const filteredData = measurements.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'alerts') return m.alerts.length > 0;
    return m.point === filter;
  });

  const exportToCSV = () => {
    if (measurements.length === 0) return;
    const headers = ['Data', 'Punkt', 'pH', 'ChZT', 'Azot Ogólny', 'Fosfor Ogólny', 'NH4', 'NO3', 'CaCO3', 'MLSS', 'Temp', 'Uwagi', 'Alerty'];
    const rows = measurements.map(m => [
      format(m.timestamp, 'yyyy-MM-dd HH:mm'),
      m.point,
      m.ph || '',
      m.chzt || '',
      m.tn || '',
      m.tp || '',
      m.nh4 || '',
      m.no3 || '',
      m.caco3 || '',
      m.mlss || '',
      m.temperature || '',
      `"${m.note?.replace(/"/g, '""') || ''}"`,
      m.alerts.map(a => a.message).join(' | ')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sbr_monitor_eksport_${format(new Date(), 'yyyy_MM_dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-black text-slate-100 tracking-tight uppercase">Historia</h2>
        <button 
          onClick={exportToCSV}
          className="bg-slate-900 border border-slate-800 text-slate-400 px-5 py-2.5 rounded-2xl flex items-center gap-2 font-black shadow-xl hover:text-slate-100 transition-colors uppercase text-xs tracking-widest"
        >
          <FileDown size={18} /> Eksportuj CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="Wszystkie" />
        <FilterButton active={filter === 'alerts'} onClick={() => setFilter('alerts')} label="⚠️ Alerty" />
        {['SBR2', 'SBR3', 'SBR4'].map(p => (
          <FilterButton key={p} active={filter === p} onClick={() => setFilter(p)} label={p} />
        ))}
      </div>

      <div className="space-y-4">
        {filteredData.length === 0 ? (
          <div className="text-center py-24 bg-slate-900/50 rounded-3xl border-4 border-dashed border-slate-900 text-slate-600 font-black uppercase text-xs tracking-[0.3em]">
            Brak wpisów
          </div>
        ) : (
          filteredData.map(m => (
            <MeasurementCard key={m.id} measurement={m} onDelete={() => onDelete(m.id)} />
          ))
        )}
      </div>
    </div>
  );
};

const MeasurementCard: React.FC<{measurement: Measurement; onDelete: () => void}> = ({ measurement, onDelete }) => {
  return (
    <div className={`bg-slate-900 rounded-3xl shadow-2xl border transition-all duration-300 ${measurement.alerts.length > 0 ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800 hover:border-slate-700'}`}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shadow-lg ${measurement.alerts.length > 0 ? 'bg-red-500 text-white shadow-red-900/40' : 'bg-slate-800 text-blue-400'}`}>
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-100 uppercase tracking-tight text-lg">{measurement.point}</h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-[0.15em]">
                <Clock size={12} className="text-blue-500" />
                {format(measurement.timestamp, 'd MMM yyyy, HH:mm', { locale: pl })}
              </div>
            </div>
          </div>
          <button onClick={onDelete} className="text-slate-700 hover:text-red-500 p-2 transition-colors">
            <Trash2 size={20} />
          </button>
        </div>

        {/* Grid of parameters */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          {measurement.ph !== undefined && <ParamBox label="pH" value={measurement.ph} />}
          {measurement.nh4 !== undefined && <ParamBox label="NH4" value={measurement.nh4} unit="mg/l" />}
          {measurement.no3 !== undefined && <ParamBox label="NO3" value={measurement.no3} unit="mg/l" />}
          {measurement.temperature !== undefined && <ParamBox label="Temp" value={measurement.temperature} unit="°C" highlight />}
          {measurement.chzt !== undefined && <ParamBox label="ChZT" value={measurement.chzt} />}
          {measurement.mlss !== undefined && <ParamBox label="MLSS" value={measurement.mlss} unit="g/l" highlight={false} />}
        </div>

        {measurement.note && (
          <div className="bg-slate-950/80 p-4 rounded-2xl text-[11px] text-slate-400 border border-slate-800/50 leading-relaxed italic mb-4">
            <span className="font-black text-slate-600 block mb-1 uppercase tracking-widest not-italic">Komentarz terenowy:</span>
            "{measurement.note}"
          </div>
        )}

        {measurement.alerts.length > 0 && (
          <div className="space-y-2">
            {measurement.alerts.map((alert, idx) => (
              <div key={idx} className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                <AlertCircle size={14} />
                {alert.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ParamBox: React.FC<{label: string; value: number; unit?: string; highlight?: boolean}> = ({ label, value, unit, highlight }) => (
  <div className={`p-2.5 rounded-2xl text-center flex flex-col items-center justify-center border transition-all ${highlight ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/30' : 'bg-slate-800/50 border-slate-800 text-slate-100'}`}>
    <div className={`text-[8px] uppercase font-black tracking-widest mb-1 ${highlight ? 'text-blue-100' : 'text-slate-500'}`}>{label}</div>
    <div className={`text-sm font-black mono tracking-tighter ${highlight ? 'text-white' : 'text-slate-100'}`}>
      {value.toFixed(value < 10 && label !== 'ChZT' ? 2 : 1)}
      {unit && <span className={`text-[9px] ml-0.5 font-normal ${highlight ? 'text-blue-200' : 'text-slate-500'}`}>{unit}</span>}
    </div>
  </div>
);

const FilterButton: React.FC<{active: boolean; onClick: () => void; label: string}> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 active:scale-95 ${
      active 
        ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-900/30' 
        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
    }`}
  >
    {label}
  </button>
);
