
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { EntryForm } from './components/EntryForm';
import { HistoryView } from './components/HistoryView';
import { Dashboard } from './components/Dashboard';
import { Measurement } from './types';
import { storageService } from './services/storageService';

type View = 'dashboard' | 'add' | 'history';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const loadData = async () => {
      const data = await storageService.getHistory();
      setMeasurements(data);
    };
    loadData();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleAddMeasurement = async (m: Measurement) => {
    await storageService.saveMeasurement(m);
    const updated = await storageService.getHistory();
    setMeasurements(updated);
    setCurrentView('dashboard');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć ten wpis?')) {
      await storageService.deleteMeasurement(id);
      const updated = await storageService.getHistory();
      setMeasurements(updated);
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      setView={setCurrentView}
      isOnline={isOnline}
    >
      {currentView === 'dashboard' && (
        <Dashboard measurements={measurements} onAddClick={() => setCurrentView('add')} />
      )}
      {currentView === 'add' && (
        <EntryForm onSubmit={handleAddMeasurement} onCancel={() => setCurrentView('dashboard')} />
      )}
      {currentView === 'history' && (
        <HistoryView measurements={measurements} onDelete={handleDelete} />
      )}
    </Layout>
  );
};

export default App;
