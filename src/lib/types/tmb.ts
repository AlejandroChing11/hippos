import type { ActivityLevel, PatientObjective } from './patient';

export interface TmbCalculation {
  id: string;
  patientId: string;
  weight: number;
  height: number;
  age: number;
  sex: 'M' | 'F';
  activityLevel: ActivityLevel;
  activityFactor: number;
  objective: PatientObjective;
  tmb: number;
  tdee: number;
  caloricRestriction: number;
  targetCalories: number;
  createdAt: string;
}
