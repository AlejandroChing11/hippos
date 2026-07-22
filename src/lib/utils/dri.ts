/**
 * DRI (IOM 2005) Estimated Energy Requirement equations.
 *
 * These are the formulas used in the Excel "fórmula desarrollada" by Camila.
 * Unlike Mifflin-St Jeor (which gives TMB), DRI gives TEE directly.
 *
 * Reference: Institute of Medicine, Dietary Reference Intakes for Energy (2005)
 *
 * Women (19+): EER = 354 − 6.91×age + PA × (9.36×weight_kg + 726×height_m)
 * Men   (19+): EER = 662 − 9.53×age + PA × (15.91×weight_kg + 539.6×height_m)
 */

export interface DriParams {
  weight: number;  // kg — uses "Peso RQTO" in Excel methodology
  height: number;  // cm
  age: number;
  sex: 'M' | 'F';
  pa: number;      // IOM Physical Activity coefficient (sex-specific)
}

/**
 * Calculates Estimated Energy Requirement using DRI (IOM 2005) equations.
 * Returns TEE (Total Energy Expenditure) in kcal/day.
 */
export function calculateDRI(params: DriParams): number {
  const heightM = params.height / 100;

  if (params.sex === 'M') {
    return 662 - 9.53 * params.age + params.pa * (15.91 * params.weight + 539.6 * heightM);
  }
  return 354 - 6.91 * params.age + params.pa * (9.36 * params.weight + 726 * heightM);
}

/**
 * IOM Physical Activity (PA) coefficients.
 * These differ by sex and activity level — NOT the same as PAL multipliers.
 *
 * Source: IOM 2005, Table 12-2 (p. 187)
 */
export const IOM_PA_COEFFICIENTS = {
  M: {
    SEDENTARY:         1.0,
    LIGHTLY_ACTIVE:    1.11,
    MODERATELY_ACTIVE: 1.25,
    VERY_ACTIVE:       1.48,
    EXTREMELY_ACTIVE:  1.48, // same as very active in IOM tables
  },
  F: {
    SEDENTARY:         1.0,
    LIGHTLY_ACTIVE:    1.12,
    MODERATELY_ACTIVE: 1.27,
    VERY_ACTIVE:       1.45,
    EXTREMELY_ACTIVE:  1.45, // same as very active in IOM tables
  },
} as const;

export type IomActivityLevel = keyof typeof IOM_PA_COEFFICIENTS.M;

/**
 * Get the IOM PA coefficient for a given sex and activity level.
 */
export function getIomPA(sex: 'M' | 'F', level: IomActivityLevel): number {
  return IOM_PA_COEFFICIENTS[sex][level];
}

/**
 * IOM PA labels matching the Excel terminology.
 */
export const IOM_PA_LABELS: Record<IomActivityLevel, string> = {
  SEDENTARY:         'Sedentario',
  LIGHTLY_ACTIVE:    'Poco activo',
  MODERATELY_ACTIVE: 'Activo',
  VERY_ACTIVE:       'Muy activo',
  EXTREMELY_ACTIVE:  'Muy activo',
};
