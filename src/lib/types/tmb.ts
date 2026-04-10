import type { ActivityLevel, PatientObjective } from './patient';

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
  tmb: number;
  tdee: number;
  caloricRestriction: number;
  targetCalories: number;
  createdAt: string;
}
