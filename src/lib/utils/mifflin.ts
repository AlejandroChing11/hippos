/** `weight` debe ser el peso saludable (kg), no el peso actual del paciente. */
export function calculateTMB(weight: number, height: number, age: number, sex: 'M' | 'F'): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'M' ? base + 5 : base - 161;
}

export function calculateTDEE(tmb: number, activityFactor: number): number {
  return tmb * activityFactor;
}

export function calculateTargetCalories(tdee: number, restriction: number): number {
  return tdee - restriction;
}
