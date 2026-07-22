import type { ActivityLevel, PatientObjective } from './patient';

export type FormulaType = 'mifflin' | 'dri';

export interface TmbCalculation {
  id: string;
  patientId: string;
  currentWeight: number;
  height: number;
  age: number;
  sex: 'M' | 'F';
  activityLevel: ActivityLevel;
  activityFactor: number;
  objective: PatientObjective;
  currentBmi: number;
  targetBmi: number;
  healthyWeight: number;
  /** Peso RQTO: the weight used for the energy requirement formula (DRI methodology) */
  requirementWeight: number;
  tmb: number;
  tdee: number;
  caloricRestriction: number;
  targetCalories: number;
  /** Which formula was used: Mifflin-St Jeor or DRI (IOM 2005) */
  formulaType: FormulaType;
  createdAt: string;
}
