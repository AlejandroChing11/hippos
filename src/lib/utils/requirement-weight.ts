/**
 * Peso RQTO (requirement weight) calculation — mirrors the Excel methodology.
 *
 * Excel flow:
 *   1. Peso Adecuado = IMC_ideal × altura_m²  (typical IMC_ideal = 22)
 *   2. If IMC > 25 (overweight/obese): Peso Ajustado = ((peso_actual − peso_adecuado) × 0.25) + peso_adecuado
 *   3. Peso RQTO = Peso Ajustado (if applicable) else Peso Adecuado
 *   4. Requirement uses Peso RQTO
 */

export interface RequirementWeightParams {
  currentWeight: number; // kg
  height: number;        // cm
  idealBmi?: number;     // defaults to 22 (midpoint of 18.5–24.9)
}

export interface RequirementWeightResult {
  idealBmi: number;
  adequateWeight: number;
  adjustedWeight: number | null; // only when BMI > 25
  requirementWeight: number;
  currentBmi: number;
  usesAdjustedWeight: boolean;
}

export function calculateRequirementWeight(params: RequirementWeightParams): RequirementWeightResult {
  const heightM = params.height / 100;
  const idealBmi = params.idealBmi ?? 22;
  const currentBmi = params.currentWeight / (heightM * heightM);
  const adequateWeight = idealBmi * heightM * heightM;

  const isOverweight = currentBmi > 25;

  let adjustedWeight: number | null = null;
  let requirementWeight: number;

  if (isOverweight) {
    // Peso Ajustado = ((peso_actual − peso_adecuado) × 0.25) + peso_adecuado
    adjustedWeight = ((params.currentWeight - adequateWeight) * 0.25) + adequateWeight;
    requirementWeight = adjustedWeight;
  } else {
    requirementWeight = params.currentWeight; // Use current weight when BMI ≤ 25
  }

  return {
    idealBmi,
    adequateWeight: Math.round(adequateWeight * 10) / 10,
    adjustedWeight: adjustedWeight ? Math.round(adjustedWeight * 10) / 10 : null,
    requirementWeight: Math.round(requirementWeight * 10) / 10,
    currentBmi: Math.round(currentBmi * 100) / 100,
    usesAdjustedWeight: isOverweight,
  };
}
