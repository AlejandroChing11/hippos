import { supabase } from './client';
import type {
  DbFoodEquivalency,
  DbFoodEquivalencyInsert,
  DbFoodEquivalencyUpdate,
} from './types';

// ─── Converters ─────────────────────────────────────────────

export interface FoodEquivalency {
  id: string;
  summaryGroup: string;
  foodName: string;
  portionDesc: string;
  portionGrams: number | null;
  notes: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function toDomain(row: DbFoodEquivalency): FoodEquivalency {
  return {
    id: row.id,
    summaryGroup: row.summary_group,
    foodName: row.food_name,
    portionDesc: row.portion_desc,
    portionGrams: row.portion_grams,
    notes: row.notes,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbInsert(d: DbFoodEquivalencyInsert) {
  return {
    summary_group: d.summary_group,
    food_name: d.food_name,
    portion_desc: d.portion_desc,
    portion_grams: d.portion_grams,
    notes: d.notes,
    sort_order: d.sort_order,
    is_active: d.is_active,
  };
}

function toDbUpdate(d: DbFoodEquivalencyUpdate) {
  const u: Record<string, unknown> = {};
  if (d.food_name !== undefined) u.food_name = d.food_name;
  if (d.portion_desc !== undefined) u.portion_desc = d.portion_desc;
  if (d.portion_grams !== undefined) u.portion_grams = d.portion_grams;
  if (d.notes !== undefined) u.notes = d.notes;
  if (d.sort_order !== undefined) u.sort_order = d.sort_order;
  if (d.is_active !== undefined) u.is_active = d.is_active;
  return u;
}

// ─── Queries ────────────────────────────────────────────────

export async function getFoodEquivalencies(
  summaryGroup?: string,
): Promise<FoodEquivalency[]> {
  let query = supabase
    .from('food_equivalencies')
    .select('*')
    .order('sort_order', { ascending: true });

  if (summaryGroup) {
    query = query.eq('summary_group', summaryGroup);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toDomain);
}

export async function createFoodEquivalency(
  data: DbFoodEquivalencyInsert,
): Promise<FoodEquivalency> {
  const { data: inserted, error } = await supabase
    .from('food_equivalencies')
    .insert(toDbInsert(data))
    .select()
    .single();
  if (error) throw error;
  return toDomain(inserted);
}

export async function updateFoodEquivalency(
  id: string,
  data: DbFoodEquivalencyUpdate,
): Promise<FoodEquivalency> {
  const { data: updated, error } = await supabase
    .from('food_equivalencies')
    .update({ ...toDbUpdate(data), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return toDomain(updated);
}

export async function deleteFoodEquivalency(id: string): Promise<void> {
  const { error } = await supabase.from('food_equivalencies').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderFoodEquivalencies(
  items: { id: string; sort_order: number }[],
): Promise<void> {
  for (const item of items) {
    const { error } = await supabase
      .from('food_equivalencies')
      .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
      .eq('id', item.id);
    if (error) throw error;
  }
}
