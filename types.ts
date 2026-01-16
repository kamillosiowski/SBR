
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
  temperature?: number; // Nowe pole dla czujników (np. Tuya)
  note?: string;
  alerts: MeasurementAlert[];
  isSynced: boolean;
}

export interface MLSSCalculation {
  a: number; // Mass dry filter
  b: number; // Mass filter + sludge
  result: number;
}
