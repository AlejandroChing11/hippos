export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function calculateWeightFromBMI(bmi: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return bmi * (heightM * heightM);
}

export function getBmiCategory(bmi: number): {
  label: string;
  color: 'danger' | 'warning' | 'success' | 'info';
} {
  if (bmi < 18.5) return { label: 'Bajo peso', color: 'info' };
  if (bmi < 25.0) return { label: 'Normal', color: 'success' };
  if (bmi < 30.0) return { label: 'Sobrepeso', color: 'warning' };
  return { label: 'Obesidad', color: 'danger' };
}
