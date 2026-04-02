import type { ActivityLevel } from '@/lib/types/patient';

export const ACTIVITY_FACTORS: Record<ActivityLevel, { label: string; description: string; factor: number }> = {
  SEDENTARY:         { label: 'Sedentario',            description: 'Poco o nada de ejercicio',         factor: 1.2 },
  LIGHTLY_ACTIVE:    { label: 'Ligeramente activo',    description: 'Ejercicio 1-3 días/semana',        factor: 1.375 },
  MODERATELY_ACTIVE: { label: 'Moderadamente activo',  description: 'Ejercicio 3-5 días/semana',        factor: 1.55 },
  VERY_ACTIVE:       { label: 'Muy activo',            description: 'Ejercicio 6-7 días/semana',        factor: 1.725 },
  EXTREMELY_ACTIVE:  { label: 'Extremadamente activo', description: 'Atleta / trabajo físico intenso',  factor: 1.9 },
};
