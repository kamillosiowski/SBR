
import React, { useState } from 'react';
import { Measurement, SamplingPoint } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { AlertCircle, Plus, Activity, Droplets, Clock, TrendingUp, Thermometer, ChevronLeft, ArrowRight } from 'lucide-react';
import { SAMPLING_POINTS, THRESHOLDS } from '../constants';

interface DashboardProps {
  measurements: Measurement[];
  onAddClick: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ measurements, onAddClick }) => {
  const [selectedPoint, setSelectedPoint] = useState<SamplingPoint | null>(null);

  const alertCount = measurements.filter(m => m.alerts.length > 0).length;

  if (selectedPoint) {
    return <DetailedPointView 
      point={selectedPoint} 
      measurements={measurements.filter(m => m.point === selectedPoint)} 
      onBack={() => setSelectedPoint(null)} 
    />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-100 tracking-tight uppercase">Dashboard</h2>
        <button 
          onClick={onAddClick}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-black shadow-lg shadow-blue-900/20 active:scale-95 transition-all hover:bg-blue-500"
        >
          <Plus size={20} /> NOWY WPIS
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard 
          label="Dzisiaj" 
          value={measurements.filter(m => new Date(m.timestamp).toDateString() === new Date().toDateString()).length} 
          icon={<Droplets className="text-blue-400" size={16} />} 
        />
        <StatCard 
          label="Alerty" 
          value={alertCount} 
          icon={<AlertCircle className="text-red-400" size={16} />} 
          alert={alertCount > 0}
        />
        <StatCard 
          label="Punkty" 
          value={new Set(measurements.map(m => m.point)).size} 
          icon={<Activity className="text-emerald-400" size={16} />} 
        />
        <StatCard 
          label="Ostatni" 
          value={measurements.length > 0 ? format(measurements[0].timestamp, 'HH:mm') : '--:--'} 
          icon={<Clock className="text-slate-400" size={16} />} 
        />
      </div>

      {/* Integration Mockup: Tuya Sensors */}
      <div className="bg-slate-900/50 p-6 rounded-3xl border border-dashed border-slate-800">
        <h3 className="font-black text-slate-500 mb-4 flex items-center gap-2 uppercase text-[10px] tracking-widest">
          <Thermometer size={14} className="text-blue-500" /> Czujniki Live
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SensorMock label="SBR2 Temp" value="18.5" unit="°C" status="online" />
          <SensorMock label="SBR3 Temp" value="18.2" unit="°C" status="online" />
          <SensorMock label="SBR4 Temp" value="---" unit="°C" status="offline" />
        </div>
      </div>

      {/* Point Status Grid */}
      <div className="space-y-4">
        <h3 className="font-black text-slate-400 flex items-center gap-2 uppercase text-xs tracking-[0.2em] ml-1">
          <Activity size={14} className="text-blue-500" /> Stan Punktów Pomiarowych
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLING_POINTS.map(point => {
            const pointHistory = measurements
              .filter(m => m.point === point)
              .sort((a, b) => a.timestamp - b.timestamp);
            const latest = pointHistory[pointHistory.length - 1];
            
            return (
              <PointStatusCard 
                key={point} 
                point={point} 
                latest={latest} 
                onClick={() => setSelectedPoint(point)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

const DetailedPointView: React.FC<{point: SamplingPoint, measurements: Measurement[], onBack: () => void}> = ({ point, measurements, onBack }) => {
  const sortedData = [...measurements].sort((a, b) => a.timestamp - b.timestamp).slice(-20).map(m => ({
    time: format(m.timestamp, 'MM-dd HH:mm'),
    ph: m.ph,
    nh4: m.nh4,
    no3: m.no3,
    temp: m.temperature,
    chzt: m.chzt,
    tn: m.tn,
    tp: m.tp,
    mlss: m.mlss,
    caco3: m.caco3
  }));

  const ChartSection = ({ title, dataKey, color, unit }: { title: string, dataKey: string, color: string, unit?: string }) => (
    <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{title} {unit && `(${unit})`}</h4>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis dataKey="time" tick={{fontSize: 8, fontWeight: 700, fill: '#64748b'}} axisLine={false} tickLine={false} />
            <YAxis tick={{fontSize: 8, fontWeight: 700, fill: '#64748b'}} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '10px'}} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={{r: 3, fill: color}} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight uppercase">{point}</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Analiza trendów i historii</p>
        </div>
      </div>

      {sortedData.length > 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
          <ChartSection title="pH" dataKey="ph" color="#3b82f6" />
          <ChartSection title="NH4" dataKey="nh4" color="#ef4444" unit="mg/l" />
          <ChartSection title="NO3" dataKey="no3" color="#a855f7" unit="mg/l" />
          <ChartSection title="Temperatura" dataKey="temp" color="#f59e0b" unit="°C" />
          <ChartSection title="ChZT" dataKey="chzt" color="#10b981" unit="mg/l" />
          <ChartSection title="Azot Ogólny" dataKey="tn" color="#6366f1" unit="mg/l" />
          <ChartSection title="Fosfor Ogólny" dataKey="tp" color="#ec4899" unit="mg/l" />
          <ChartSection title="MLSS" dataKey="mlss" color="#94a3b8" unit="g/l" />
        </div>
      ) : (
        <div className="py-24 text-center bg-slate-900 rounded-3xl border-2 border-dashed border-slate-800 text-slate-600 font-black uppercase text-xs tracking-widest">
          Za mało danych do wyświetlenia wykresów
        </div>
      )}
    </div>
  );
};

const SensorMock: React.FC<{label: string, value: string, unit: string, status: 'online' | 'offline'}> = ({ label, value, unit, status }) => (
  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex justify-between items-center">
    <div className="flex flex-col">
      <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">{label}</span>
      <span className={`text-lg font-black mono ${status === 'online' ? 'text-blue-400' : 'text-slate-700'}`}>
        {value} <span className="text-[10px] font-normal">{unit}</span>
      </span>
    </div>
    <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`} />
  </div>
);

const PointStatusCard: React.FC<{
  point: string; 
  latest?: Measurement; 
  onClick: () => void;
}> = ({ point, latest, onClick }) => {
  const hasAlert = latest && latest.alerts.length > 0;
  
  const phStatus = latest?.ph !== undefined 
    ? (latest.ph < THRESHOLDS.PH_MIN || latest.ph > THRESHOLDS.PH_MAX ? 'error' : 'success') 
    : 'none';

  return (
    <div 
      onClick={onClick}
      className={`bg-slate-900 rounded-3xl p-6 border transition-all duration-300 shadow-xl cursor-pointer group active:scale-[0.98] ${hasAlert ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800 hover:border-blue-500/50 hover:shadow-blue-900/10'}`}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="font-black text-slate-100 text-lg tracking-tight group-hover:text-blue-400 transition-colors">{point}</h4>
          {latest ? (
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
              Ostatni pomiar: {format(latest.timestamp, 'HH:mm, d MMM')}
            </p>
          ) : (
            <p className="text-[9px] text-slate-700 font-black uppercase tracking-widest italic">Brak danych</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {latest && (
            <div className={`w-3 h-3 rounded-full shadow-[0_0_12px_rgba(0,0,0,0.5)] ${hasAlert ? 'bg-red-500 shadow-red-500/50 animate-pulse' : 'bg-emerald-500 shadow-emerald-500/50'}`} />
          )}
          <ArrowRight size={16} className="text-slate-700 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <MiniIndicator label="pH" value={latest?.ph} status={phStatus} />
        <MiniIndicator label="NH4" value={latest?.nh4} unit="mg/l" status={latest?.nh4 && latest.nh4 > THRESHOLDS.NH4_MAX ? 'error' : 'none'} />
        <MiniIndicator label="NO3" value={latest?.no3} unit="mg/l" status="none" />
        <MiniIndicator label="COD" value={latest?.chzt} unit="mg/l" status="none" />
        <MiniIndicator label="TN" value={latest?.tn} unit="mg/l" status="none" />
        <MiniIndicator label="TP" value={latest?.tp} unit="mg/l" status="none" />
        <MiniIndicator label="MLSS" value={latest?.mlss} unit="g/l" status="none" />
        <MiniIndicator label="Ca" value={latest?.caco3} status="none" />
        <MiniIndicator label="Temp" value={latest?.temperature} unit="°C" status="none" />
      </div>
    </div>
  );
};

const MiniIndicator: React.FC<{label: string; value?: number; unit?: string; status: 'success' | 'error' | 'none'}> = ({ label, value, unit, status }) => {
  const colors = {
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    error: 'text-red-400 bg-red-500/10 border-red-500/20',
    none: 'text-slate-400 bg-slate-800/50 border-slate-700/50'
  };

  return (
    <div className={`p-2 rounded-xl border ${colors[status]} flex flex-col items-center justify-center transition-colors`}>
      <span className="text-[7px] font-black uppercase opacity-60 mb-0.5 tracking-tighter leading-none">{label}</span>
      <span className="text-[11px] font-black mono tracking-tighter leading-none">
        {value !== undefined ? (value < 10 && label !== 'COD' ? value.toFixed(2) : value.toFixed(0)) : '--'}
        {value !== undefined && unit && <span className="text-[6px] ml-0.5 font-normal opacity-50">{unit}</span>}
      </span>
    </div>
  );
};

const StatCard: React.FC<{label: string; value: string | number; icon: React.ReactNode; alert?: boolean}> = ({ label, value, icon, alert }) => (
  <div className={`p-4 rounded-2xl bg-slate-900 border transition-all ${alert ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800'} shadow-xl`}>
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className={`text-[9px] font-black uppercase tracking-widest ${alert ? 'text-red-400' : 'text-slate-500'}`}>{label}</span>
    </div>
    <div className={`text-2xl font-black tracking-tight ${alert ? 'text-red-500' : 'text-slate-100'}`}>{value}</div>
  </div>
);
