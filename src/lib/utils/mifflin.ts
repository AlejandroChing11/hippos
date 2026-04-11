import type { MifflinCoefficients } from '@/lib/supabase/types';
import { DEFAULT_MIFFLIN_COEFFICIENTS } from '@/lib/supabase/types';

/**
 * `weight` debe ser el peso saludable (kg), no el peso actual del paciente.
 * `coefficients` son los coeficientes configurables desde la DB; si no se
 * pasan se usan los valores estándar de Mifflin-St Jeor como fallback.
 */
export function calculateTMB(
  weight: number,
  height: number,
  age: number,
  sex: 'M' | 'F',
  coefficients: MifflinCoefficients = DEFAULT_MIFFLIN_COEFFICIENTS,
): number {
  const base =
    coefficients.weightCoefficient * weight +
    coefficients.heightCoefficient * height -
    coefficients.ageCoefficient * age;
  return sex === 'M'
    ? base + coefficients.maleConstant
    : base + coefficients.femaleConstant;
}

export function calculateTDEE(tmb: number, activityFactor: number): number {
  return tmb * activityFactor;
}

export function calculateTargetCalories(tdee: number, restriction: number): number {
  return tdee - restriction;
}
