import type { PatientObjective } from './patient';

export type DateRangePreset = 'today' | 'this_week' | 'this_month' | 'last_week' | 'last_month' | 'custom';

export interface ReportFiltersState {
  preset: DateRangePreset;
  startDate: string;
  endDate: string;
  patientId: string | null;
  objectiveFilter: PatientObjective | 'ALL';
}

export interface ReportSummary {
  totalFormulas: number;
  uniquePatients: number;
  averageAdequacy: number;
  averageTargetCalories: number;
  byObjective: { objective: PatientObjective; count: number }[];
}

export interface ReportRow {
  formulaId: string;
  formulaDate: string;
  patientId: string;
  patientName: string;
  patientSex: 'M' | 'F';
  patientAge: number;
  objective: PatientObjective;
  currentWeight: number;
  healthyWeight: number;
  currentBmi: number;
  targetBmi: number;
  targetCalories: number;
  totalKcal: number;
  adequacyPercent: number;
  proteinPercent: number;
  fatPercent: number;
  carbsPercent: number;
  tmbCalculationId: string;
  exchanges: import('./formula').ExchangeEntry[];
  totals: import('./formula').MacroTotals;
}
