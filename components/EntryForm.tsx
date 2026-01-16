
import React, { useState, useEffect } from 'react';
import { SAMPLING_POINTS, SBR_POINTS, THRESHOLDS } from '../constants';
import { Measurement, SamplingPoint, MeasurementAlert } from '../types';
import { Calculator, Save, X, ChevronDown, ChevronUp, Beaker, Settings2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface EntryFormProps {
  onSubmit: (m: Measurement) => void;
  onCancel: () => void;
}

export const EntryForm: React.FC<EntryFormProps> = ({ onSubmit, onCancel }) => {
  const [point, setPoint] = useState<SamplingPoint>(SAMPLING_POINTS[0]);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [manualTimestamp, setManualTimestamp] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [formData, setFormData] = useState<Partial<Measurement>>({
    ph: undefined,
    chzt: undefined,
    tn: undefined,
    tp: undefined,
    nh4: undefined,
    no3: undefined,
    caco3: undefined,
    temperature: undefined,
    note: '',
  });

  const [mlssA, setMlssA] = useState<string>('');
  const [mlssB, setMlssB] = useState<string>('');
  const [calculatedMlss, setCalculatedMlss] = useState<number | null>(null);

  useEffect(() => {
    if (mlssA && mlssB) {
      const aVal = parseFloat(mlssA);
      const bVal = parseFloat(mlssB);
      if (!isNaN(aVal) && !isNaN(bVal)) {
        const res = (bVal - aVal) / 0.005;
        setCalculatedMlss(Math.max(0, parseFloat(res.toFixed(2))));
      } else {
        setCalculatedMlss(null);
      }
    } else {
      setCalculatedMlss(null);
    }
  }, [mlssA, mlssB]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const alerts: MeasurementAlert[] = [];
    if (formData.ph !== undefined && (formData.ph < THRESHOLDS.PH_MIN || formData.ph > THRESHOLDS.PH_MAX)) {
      alerts.push({ field: 'pH', value: formData.ph, message: `pH poza zakresem (${THRESHOLDS.PH_MIN}-${THRESHOLDS.PH_MAX})` });
    }
    if (formData.nh4 !== undefined && formData.nh4 > THRESHOLDS.NH4_MAX) {
      alerts.push({ field: 'NH4', value: formData.nh4, message: `NH4 przekracza próg (${THRESHOLDS.NH4_MAX} mg/l)` });
    }

    const measurement: Measurement = {
      id: crypto.randomUUID(),
      timestamp: new Date(manualTimestamp).getTime(),
      point,
      ...formData,
      mlss: calculatedMlss || undefined,
      alerts,
      isSynced: false,
    };

    onSubmit(measurement);
  };

  const handleInputChange = (field: keyof Measurement, val: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: val === '' ? undefined : (field === 'note' ? val : (field === 'ph' || field === 'nh4' || field === 'no3' || field === 'tp' || field === 'temperature' ? parseFloat(val) : parseInt(val)))
    }));
  };

  const isSBR = SBR_POINTS.includes(point);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-800">
        <h2 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-100 uppercase tracking-tight">
          <Beaker className="text-blue-500" /> Nowy Pomiar
        </h2>

        {/* Date Selection */}
        <div className="mb-8">
          <label className="block text-[10px] font-black text-slate-500 mb-4 uppercase tracking-[0.2em] ml-1">Data i godzina pobrania</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500">
              <Calendar size={18} />
            </div>
            <input 
              type="datetime-local"
              value={manualTimestamp}
              onChange={(e) => setManualTimestamp(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-800 border-2 border-slate-800 rounded-2xl text-slate-100 font-black focus:border-blue-500 transition-all outline-none"
            />
          </div>
        </div>

        {/* Sampling Point Selection */}
        <div className="mb-8">
          <label className="block text-[10px] font-black text-slate-500 mb-4 uppercase tracking-[0.2em] ml-1">Punkt poboru</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SAMPLING_POINTS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPoint(p)}
                className={`py-4 px-3 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest ${
                  point === p 
                    ? 'border-blue-600 bg-blue-600/10 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.2)]' 
                    : 'border-slate-800 bg-slate-800/50 text-slate-500 hover:border-slate-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Parameters Section */}
        <div className="mb-8">
          <label className="block text-[10px] font-black text-slate-500 mb-4 uppercase tracking-[0.2em] ml-1">Parametry kluczowe</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <InputField label="pH (0-14)" icon="pH" value={formData.ph} onChange={v => handleInputChange('ph', v)} min={0} max={14} step={0.1} />
            <InputField label="NH4 (mg/l)" icon="NH4" value={formData.nh4} onChange={v => handleInputChange('nh4', v)} step={0.01} />
            <InputField label="NO3 (mg/l)" icon="NO3" value={formData.no3} onChange={v => handleInputChange('no3', v)} step={0.01} />
            <InputField label="Temp. (°C)" icon="°C" value={formData.temperature} onChange={v => handleInputChange('temperature', v)} step={0.1} />
          </div>
        </div>

        {/* Advanced Toggle */}
        <div className="mb-6 border-t border-slate-800 pt-6">
          <button 
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors font-black text-[10px] uppercase tracking-widest"
          >
            <Settings2 size={16} />
            {showAdvanced ? 'Ukryj dodatkowe' : 'Pokaż dodatkowe'}
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Secondary Parameters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in slide-in-from-top-2 duration-300">
            <InputField label="ChZT (mg/l)" icon="COD" value={formData.chzt} onChange={v => handleInputChange('chzt', v)} />
            <InputField label="Azot ogólny (TN)" icon="TN" value={formData.tn} onChange={v => handleInputChange('tn', v)} />
            <InputField label="Fosfor ogólny (TP)" icon="TP" value={formData.tp} onChange={v => handleInputChange('tp', v)} step={0.01} />
            <InputField label="CaCO3 (Zasadowość)" icon="Ca" value={formData.caco3} onChange={v => handleInputChange('caco3', v)} />
          </div>
        )}

        {/* MLSS Calculator for SBR */}
        {isSBR && (
          <div className="mt-6 p-6 bg-slate-950 rounded-3xl border border-slate-800 shadow-inner">
            <h3 className="flex items-center gap-2 font-black mb-6 text-blue-500 uppercase text-xs tracking-widest">
              Kalkulator MLSS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[9px] uppercase font-black text-slate-600 tracking-widest">Masa sączka (A) [g]</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 text-slate-100 font-black mono focus:border-blue-500 transition-all outline-none" 
                  value={mlssA} 
                  onChange={e => setMlssA(e.target.value)} 
                  placeholder="0.0000"
                  step="0.0001"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] uppercase font-black text-slate-600 tracking-widest">Sączek + osad (B) [g]</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 text-slate-100 font-black mono focus:border-blue-500 transition-all outline-none" 
                  value={mlssB} 
                  onChange={e => setMlssB(e.target.value)} 
                  placeholder="0.0000"
                  step="0.0001"
                />
              </div>
            </div>
            <div className="mt-8 p-5 bg-blue-600 rounded-2xl flex justify-between items-center shadow-xl shadow-blue-900/40">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Wynik MLSS</span>
                <span className="text-[10px] text-blue-300 italic">V = 5.0 ml</span>
              </div>
              <span className="text-3xl font-black mono tracking-tighter text-white">
                {calculatedMlss !== null ? `${calculatedMlss} g/l` : '---'}
              </span>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mt-10">
          <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em] ml-1">Notatki terenowe</label>
          <textarea
            className="w-full p-4 border-2 border-slate-800 rounded-2xl bg-slate-900 text-slate-200 focus:border-blue-500 transition-all min-h-[120px] text-sm font-medium outline-none"
            placeholder="np. piana, specyficzny zapach..."
            value={formData.note}
            onChange={e => handleInputChange('note', e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-900/30 active:scale-[0.98] transition-all uppercase tracking-widest hover:bg-blue-500"
          >
            <Save size={24} /> ZAPISZ DANE
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="sm:w-1/3 bg-slate-800 text-slate-400 font-black py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest hover:bg-slate-700"
          >
            <X size={24} /> ANULUJ
          </button>
        </div>
      </div>
    </div>
  );
};

const InputField: React.FC<{
  label: string; 
  icon: string; 
  value: number | undefined; 
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  step?: number | string;
}> = ({ label, icon, value, onChange, min, max, step }) => (
  <div className="relative">
    <label className="block text-[9px] font-black text-slate-600 mb-1 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 font-black text-[9px] pointer-events-none uppercase bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
        {icon}
      </div>
      <input
        type="number"
        value={value === undefined ? '' : value}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
        step={step || "any"}
        placeholder="---"
        className="w-full pl-14 pr-4 py-4 border-2 border-slate-800 rounded-2xl bg-slate-800 text-slate-100 focus:bg-slate-900 focus:border-blue-600 transition-all outline-none mono font-bold"
      />
    </div>
  </div>
);
