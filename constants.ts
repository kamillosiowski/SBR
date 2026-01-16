
import { SamplingPoint } from './types';

export const SAMPLING_POINTS: SamplingPoint[] = [
  'SBR2',
  'SBR3',
  'SBR4',
  'Zbiornik uśredniający',
  'Flotator'
];

export const SBR_POINTS: SamplingPoint[] = ['SBR2', 'SBR3', 'SBR4'];

export const THRESHOLDS = {
  PH_MIN: 6.5,
  PH_MAX: 8.5,
  NH4_MAX: 5.0,
};

export const COLORS = {
  PRIMARY: '#0f172a',
  SECONDARY: '#334155',
  ACCENT: '#3b82f6',
  ALERT: '#ef4444',
  SUCCESS: '#22c55e',
};
