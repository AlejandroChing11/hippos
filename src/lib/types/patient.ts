export type PatientObjective =
  | 'WEIGHT_LOSS'
  | 'MAINTENANCE'
  | 'MUSCLE_GAIN'
  | 'PREGNANCY'
  | 'OTHER';

export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHTLY_ACTIVE'
  | 'MODERATELY_ACTIVE'
  | 'VERY_ACTIVE'
  | 'EXTREMELY_ACTIVE';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  birthDate: string;
  age: number;
  sex: 'M' | 'F';
  weight: number;
  height: number;
  pathologies: string[];
  foodAllergies: string[];
  objective: PatientObjective;
  activityLevel: ActivityLevel;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
