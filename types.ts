
export type SamplingPoint = 'SBR2' | 'SBR3' | 'SBR4' | 'Zbiornik uśredniający' | 'Flotator';

export interface MeasurementAlert {
  field: string;
  value: number;
  message: string;
}

export interface Measurement {
  id: string;
  timestamp: number;
  point: SamplingPoint;
  ph?: number;
  chzt?: number;
  tn?: number;
  tp?: number;
  nh4?: number;
  no3?: number;
  caco3?: number;
  mlss?: number; 
  temperature?: number;
  note?: string;
  alerts: MeasurementAlert[];
  isSynced: boolean;
}

export interface SBRSettings {
  syncId: string;
  lastSync?: number;
  autoSyncEnabled?: boolean;
}
