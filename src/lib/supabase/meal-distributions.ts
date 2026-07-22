import { supabase } from './client';
import type {
  DbMealDistribution,
  DbMealDistributionInsert,
  MealDistributionMap,
} from './types';

// ─── Converters ─────────────────────────────────────────────

export interface MealDistribution {
  id: string;
  formulaSessionId: string;
  patientId: string;
  distribution: MealDistributionMap;
  createdAt: string;
  updatedAt: string;
}

function toDomain(row: DbMealDistribution): MealDistribution {
  return {
    id: row.id,
    formulaSessionId: row.formula_session_id,
    patientId: row.patient_id,
    distribution: row.distribution,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbInsert(d: DbMealDistributionInsert) {
  return {
    formula_session_id: d.formula_session_id,
    patient_id: d.patient_id,
    distribution: d.distribution,
  };
}

// ─── Queries ────────────────────────────────────────────────

export async function getMealDistribution(
  formulaSessionId: string,
): Promise<MealDistribution | null> {
  const { data, error } = await supabase
    .from('meal_distributions')
    .select('*')
    .eq('formula_session_id', formulaSessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toDomain(data) : null;
}

export async function upsertMealDistribution(
  data: DbMealDistributionInsert,
): Promise<MealDistribution> {
  const existing = await getMealDistribution(data.formula_session_id);

  if (existing) {
    const { data: updated, error } = await supabase
      .from('meal_distributions')
      .update({ distribution: data.distribution, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return toDomain(updated);
  }

  const { data: inserted, error } = await supabase
    .from('meal_distributions')
    .insert(toDbInsert(data))
    .select()
    .single();
  if (error) throw error;
  return toDomain(inserted);
}

export async function deleteMealDistribution(id: string): Promise<void> {
  const { error } = await supabase.from('meal_distributions').delete().eq('id', id);
  if (error) throw error;
}
