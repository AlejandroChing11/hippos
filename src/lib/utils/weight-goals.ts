import type { WeightGoal } from '@/lib/supabase/types';

export function generateWeightGoals(
  currentWeight: number,
  durationMonths: number,
  lossPerMonth: number,
  startDate?: Date
): WeightGoal[] {
  const start = startDate ?? new Date();
  const goals: WeightGoal[] = [];

  for (let i = 0; i <= durationMonths; i++) {
    const targetDate = new Date(start);
    targetDate.setMonth(targetDate.getMonth() + i);
    const targetWeight = Math.round((currentWeight - lossPerMonth * i) * 10) / 10;
    goals.push({
      date: targetDate.toISOString().slice(0, 10),
      targetWeight: Math.max(0, targetWeight),
    });
  }

  return goals;
}
