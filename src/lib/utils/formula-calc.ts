import { FOOD_GROUPS } from '@/lib/constants/food-groups';
import type { ExchangeEntry, MacroTotals } from '@/lib/types/formula';

const subgroupMap = new Map(
  FOOD_GROUPS.flatMap(g => g.subgroups.map(s => [s.id, s] as const)),
);

export function calculateMacroTotals(exchanges: ExchangeEntry[]): MacroTotals {
  let protein = 0, fat = 0, carbs = 0;

  for (const entry of exchanges) {
    const sub = subgroupMap.get(entry.subgroupId);
    if (sub && entry.exchanges > 0) {
      protein += entry.exchanges * sub.protein;
      fat += entry.exchanges * sub.fat;
      carbs += entry.exchanges * sub.carbs;
    }
  }

  const proteinKcal = protein * 4;
  const fatKcal = fat * 9;
  const carbsKcal = carbs * 4;
  const totalKcal = proteinKcal + fatKcal + carbsKcal;

  return {
    protein, fat, carbs,
    proteinKcal, fatKcal, carbsKcal, totalKcal,
    proteinPercent: totalKcal > 0 ? (proteinKcal / totalKcal) * 100 : 0,
    fatPercent: totalKcal > 0 ? (fatKcal / totalKcal) * 100 : 0,
    carbsPercent: totalKcal > 0 ? (carbsKcal / totalKcal) * 100 : 0,
  };
}

export function getAdequacyStatus(percent: number): { label: string; variant: 'success' | 'warning' | 'danger' } {
  if (percent >= 90 && percent <= 110) return { label: 'Adecuado', variant: 'success' };
  if ((percent >= 80 && percent < 90) || (percent > 110 && percent <= 120)) return { label: 'Revisar', variant: 'warning' };
  return { label: 'Inadecuado', variant: 'danger' };
}

export function createEmptyExchanges(): ExchangeEntry[] {
  return FOOD_GROUPS.flatMap(g =>
    g.subgroups.map(s => ({ subgroupId: s.id, exchanges: 0 })),
  );
}
