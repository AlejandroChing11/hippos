export interface MealTime {
  key: string;
  label: string;
  shortLabel: string;
  sortOrder: number;
}

// NOTE: PPTX generation uses only 4 meal times (Desayuno combines breakfast + morningSnack).
// This 5-meal array remains the source of truth for the UI distribution table.
export const MEAL_TIMES: MealTime[] = [
  { key: 'breakfast',       label: 'Desayuno',      shortLabel: 'Des',  sortOrder: 1 },
  { key: 'morningSnack',    label: 'Media mañana',  shortLabel: 'MM',   sortOrder: 2 },
  { key: 'lunch',           label: 'Almuerzo',      shortLabel: 'Alm',  sortOrder: 3 },
  { key: 'afternoonSnack',  label: 'Media tarde',   shortLabel: 'MT',   sortOrder: 4 },
  { key: 'dinner',          label: 'Cena',          shortLabel: 'Cen',  sortOrder: 5 },
];

export type MealTimeKey = typeof MEAL_TIMES[number]['key'];
