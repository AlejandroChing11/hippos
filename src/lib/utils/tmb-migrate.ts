import type { TmbCalculation } from '@/lib/types/tmb';
import { calculateBMI, calculateWeightFromBMI } from '@/lib/utils/bmi';

type RawTmb = Partial<TmbCalculation> & { id: string; weight?: number };

export function normalizeTmbCalculation(raw: RawTmb): TmbCalculation {
  const { weight: legacyWeight, ...rest } = raw;
  const currentWeight =
    typeof raw.currentWeight === 'number'
      ? raw.currentWeight
      : typeof legacyWeight === 'number'
        ? legacyWeight
        : 0;
  const height = raw.height ?? 0;
  const currentBmi =
    typeof raw.currentBmi === 'number' ? raw.currentBmi : calculateBMI(currentWeight, height);
  const targetBmi = typeof raw.targetBmi === 'number' ? raw.targetBmi : 22;
  const healthyWeight =
    typeof raw.healthyWeight === 'number'
      ? raw.healthyWeight
      : calculateWeightFromBMI(targetBmi, height);

  return {
    ...(rest as Omit<TmbCalculation, 'currentWeight' | 'currentBmi' | 'targetBmi' | 'healthyWeight'>),
    currentWeight,
    height,
    currentBmi,
    targetBmi,
    healthyWeight,
  };
}
