
import React from 'react';
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
import { AlertCircle, Plus, Activity, Droplets, Clock, TrendingUp, Thermometer } from 'lucide-react';
import { SAMPLING_POINTS, THRESHOLDS } from '../constants';

interface DashboardProps {
  measurements: Measurement[];
  onAddClick: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ measurements, onAddClick }) => {
  const alertCount = measurements.filter(m => m.alerts.length > 0).length;

  const chartData = [...measurements]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-15)
    .map(m => ({
      time: format(m.timestamp, 'MM-dd HH:mm'),
      nh4: m.nh4,
      no3: m.no3,
      point: m.point
    }));

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
          <Thermometer size={14} className="text-blue-500" /> Czujniki Live (Gotowość Tuya)
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                history={pointHistory.slice(-10)} 
              />
            );
          })}
        </div>
      </div>

      {/* Main Global Chart */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <h3 className="font-black text-slate-100 mb-6 flex items-center gap-2 uppercase text-sm tracking-widest">
          <TrendingUp size={18} className="text-blue-500" /> Trend Ogólny (NH4 / NO3)
        </h3>
        <div className="h-[300px] w-full">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="time" 
                  tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  contentStyle={{backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', color: '#f8fafc'}}
                  itemStyle={{fontSize: '12px', fontWeight: 800}}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 800, paddingTop: '20px', textTransform: 'uppercase', letterSpacing: '0.1em'}} />
                <Line 
                  type="monotone" 
                  dataKey="nh4" 
                  stroke="#ef4444" 
                  name="NH4" 
                  strokeWidth={4} 
                  dot={{r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#0f172a'}}
                  activeDot={{r: 6}}
                />
                <Line 
                  type="monotone" 
                  dataKey="no3" 
                  stroke="#3b82f6" 
                  name="NO3" 
                  strokeWidth={4}
                  dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0f172a'}}
                  activeDot={{r: 6}}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-600 font-bold uppercase tracking-widest text-xs">
              Brak danych do analizy
            </div>
          )}
        </div>
      </div>
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
  history: Measurement[]
}> = ({ point, latest, history }) => {
  const hasAlert = latest && latest.alerts.length > 0;
  
  const phStatus = latest?.ph !== undefined 
    ? (latest.ph < THRESHOLDS.PH_MIN || latest.ph > THRESHOLDS.PH_MAX ? 'error' : 'success') 
    : 'none';

  return (
    <div className={`bg-slate-900 rounded-2xl p-4 border transition-all duration-300 shadow-xl ${hasAlert ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800 hover:border-blue-500/50'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-black text-slate-100 text-sm tracking-tight">{point}</h4>
          {latest ? (
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
              {format(latest.timestamp, 'HH:mm, d MMM')}
            </p>
          ) : (
            <p className="text-[9px] text-slate-700 font-black uppercase tracking-widest italic">Oczekiwanie...</p>
          )}
        </div>
        {latest && (
          <div className={`w-3 h-3 rounded-full shadow-[0_0_12px_rgba(0,0,0,0.5)] ${hasAlert ? 'bg-red-500 shadow-red-500/50 animate-pulse' : 'bg-emerald-500 shadow-emerald-500/50'}`} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <MiniIndicator 
          label="pH" 
          value={latest?.ph} 
          status={phStatus} 
        />
        <MiniIndicator 
          label="ChZT" 
          value={latest?.chzt} 
          unit="mg/l"
          status="none" 
        />
        <MiniIndicator 
          label="Azot N" 
          value={latest?.tn} 
          unit="mg/l"
          status="none" 
        />
        <MiniIndicator 
          label="Fosfor P" 
          value={latest?.tp} 
          unit="mg/l"
          status="none" 
        />
      </div>

      {/* Mini Sparkline for TN or another key parameter if available */}
      <div className="h-8 w-full mt-2 opacity-50">
        {history.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <Line 
                type="monotone" 
                dataKey="nh4" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={false}
              />
              <YAxis hide domain={['auto', 'auto']} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="w-full h-[1px] bg-slate-800" />
          </div>
        )}
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
      <span className="text-[13px] font-black mono tracking-tighter leading-none">
        {value !== undefined ? (value < 10 && label !== 'ChZT' ? value.toFixed(2) : value.toFixed(1)) : '--'}
        {value !== undefined && unit && <span className="text-[8px] ml-0.5 font-normal opacity-50">{unit}</span>}
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
