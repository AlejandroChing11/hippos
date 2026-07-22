import { supabase } from './client';
import type { DbGeneratedPlan, DbGeneratedPlanInsert, WeightGoal } from './types';

// ─── Converters ─────────────────────────────────────────────

export interface GeneratedPlan {
  id: string;
  patientId: string;
  formulaSessionId: string;
  mealDistributionId: string;
  planTitle: string;
  objectiveText: string;
  durationMonths: number;
  weightLossPerMonth: number;
  weightGoals: WeightGoal[];
  templateSlideIds: string[];
  generatedAt: string;
}

function toDomain(row: DbGeneratedPlan): GeneratedPlan {
  return {
    id: row.id,
    patientId: row.patient_id,
    formulaSessionId: row.formula_session_id,
    mealDistributionId: row.meal_distribution_id,
    planTitle: row.plan_title,
    objectiveText: row.objective_text,
    durationMonths: row.duration_months,
    weightLossPerMonth: row.weight_loss_per_month,
    weightGoals: row.weight_goals,
    templateSlideIds: row.template_slide_ids,
    generatedAt: row.generated_at,
  };
}

function toDbInsert(d: DbGeneratedPlanInsert) {
  return {
    patient_id: d.patient_id,
    formula_session_id: d.formula_session_id,
    meal_distribution_id: d.meal_distribution_id,
    plan_title: d.plan_title,
    objective_text: d.objective_text,
    duration_months: d.duration_months,
    weight_loss_per_month: d.weight_loss_per_month,
    weight_goals: d.weight_goals,
    template_slide_ids: d.template_slide_ids,
  };
}

// ─── Queries ────────────────────────────────────────────────

export async function getGeneratedPlans(
  patientId: string,
): Promise<GeneratedPlan[]> {
  const { data, error } = await supabase
    .from('generated_plans')
    .select('*')
    .eq('patient_id', patientId)
    .order('generated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toDomain);
}

export async function getGeneratedPlan(
  id: string,
): Promise<GeneratedPlan | null> {
  const { data, error } = await supabase
    .from('generated_plans')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? toDomain(data) : null;
}

export async function createGeneratedPlan(
  data: DbGeneratedPlanInsert,
): Promise<GeneratedPlan> {
  const { data: inserted, error } = await supabase
    .from('generated_plans')
    .insert(toDbInsert(data))
    .select()
    .single();
  if (error) throw error;
  return toDomain(inserted);
}
