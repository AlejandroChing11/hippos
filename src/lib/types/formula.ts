export interface FormulaSession {
  id: string;
  patientId: string;
  tmbCalculationId: string;
  targetCalories: number;
  exchanges: ExchangeEntry[];
  totals: MacroTotals;
  adequacyPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeEntry {
  subgroupId: string;
  exchanges: number;
}

export interface MacroTotals {
  protein: number;
  fat: number;
  carbs: number;
  proteinKcal: number;
  fatKcal: number;
  carbsKcal: number;
  totalKcal: number;
  proteinPercent: number;
  fatPercent: number;
  carbsPercent: number;
}
