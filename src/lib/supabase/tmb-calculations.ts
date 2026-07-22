import { supabase } from './client';
import type { DbTmbCalculation } from './types';
import type { TmbCalculation, FormulaType } from '@/lib/types/tmb';
import type { ActivityLevel, PatientObjective } from '@/lib/types/patient';

// ─── Converters ─────────────────────────────────────────────

function toTmbCalculation(row: DbTmbCalculation): TmbCalculation {
  return {
    id: row.id,
    patientId: row.patient_id,
    currentWeight: Number(row.current_weight),
    height: Number(row.height),
    age: Number(row.age),
    sex: row.sex as 'M' | 'F',
    activityLevel: row.activity_level as ActivityLevel,
    activityFactor: Number(row.activity_factor),
    objective: row.objective as PatientObjective,
    currentBmi: Number(row.current_bmi),
    targetBmi: Number(row.target_bmi),
    healthyWeight: Number(row.healthy_weight),
    requirementWeight: Number(row.requirement_weight ?? row.healthy_weight),
    tmb: Number(row.tmb),
    tdee: Number(row.tdee),
    caloricRestriction: Number(row.caloric_restriction),
    targetCalories: Number(row.target_calories),
    formulaType: (row.formula_type as FormulaType) ?? 'mifflin',
    createdAt: row.created_at,
  };
}

export type TmbCalculationInput = Omit<TmbCalculation, 'id' | 'createdAt'>;

function toDbInsert(d: TmbCalculationInput) {
  return {
    patient_id: d.patientId,
    current_weight: d.currentWeight,
    height: d.height,
    age: d.age,
    sex: d.sex,
    activity_level: d.activityLevel,
    activity_factor: d.activityFactor,
    objective: d.objective,
    current_bmi: d.currentBmi,
    target_bmi: d.targetBmi,
    healthy_weight: d.healthyWeight,
    requirement_weight: d.requirementWeight,
    tmb: d.tmb,
    tdee: d.tdee,
    caloric_restriction: d.caloricRestriction,
    target_calories: d.targetCalories,
    formula_type: d.formulaType,
  };
}

// ─── Queries ────────────────────────────────────────────────

export async function getTmbCalculations(patientId: string): Promise<TmbCalculation[]> {
  const { data, error } = await supabase
    .from('tmb_calculations')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toTmbCalculation);
}

export async function getTmbCalculationById(id: string): Promise<TmbCalculation | null> {
  const { data, error } = await supabase
    .from('tmb_calculations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? toTmbCalculation(data) : null;
}

export async function createTmbCalculation(input: TmbCalculationInput): Promise<TmbCalculation> {
  const { data, error } = await supabase
    .from('tmb_calculations')
    .insert(toDbInsert(input))
    .select()
    .single();
  if (error) throw error;
  return toTmbCalculation(data);
}

export async function deleteTmbCalculation(id: string): Promise<void> {
  const { error } = await supabase.from('tmb_calculations').delete().eq('id', id);
  if (error) throw error;
}
