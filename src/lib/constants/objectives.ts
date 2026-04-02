import type { PatientObjective } from '@/lib/types/patient';

export const OBJECTIVES: Record<PatientObjective, { label: string; requiresRestriction: boolean }> = {
  WEIGHT_LOSS:  { label: 'Pérdida de peso',  requiresRestriction: true },
  MAINTENANCE:  { label: 'Mantenimiento',     requiresRestriction: false },
  MUSCLE_GAIN:  { label: 'Ganancia muscular', requiresRestriction: false },
  PREGNANCY:    { label: 'Embarazo',          requiresRestriction: false },
  OTHER:        { label: 'Otro',              requiresRestriction: false },
};
