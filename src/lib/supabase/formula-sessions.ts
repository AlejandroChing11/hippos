import { supabase } from './client';
import type { Database, DbFormulaSession } from './types';
import type { FormulaSession, ExchangeEntry, MacroTotals } from '@/lib/types/formula';

// ─── Converters ─────────────────────────────────────────────

function toFormulaSession(row: DbFormulaSession): FormulaSession {
  const totals: MacroTotals = {
    protein: Number(row.total_protein),
    fat: Number(row.total_fat),
    carbs: Number(row.total_carbs),
    proteinKcal: Number(row.protein_kcal),
    fatKcal: Number(row.fat_kcal),
    carbsKcal: Number(row.carbs_kcal),
    totalKcal: Number(row.total_kcal),
    proteinPercent: Number(row.protein_percent),
    fatPercent: Number(row.fat_percent),
    carbsPercent: Number(row.carbs_percent),
  };
  return {
    id: row.id,
    patientId: row.patient_id,
    tmbCalculationId: row.tmb_calculation_id,
    targetCalories: Number(row.target_calories),
    exchanges: row.exchanges as ExchangeEntry[],
    totals,
    adequacyPercent: Number(row.adequacy_percent),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface FormulaSessionInput {
  patientId: string;
  tmbCalculationId: string;
  targetCalories: number;
  exchanges: ExchangeEntry[];
  totals: MacroTotals;
  adequacyPercent: number;
}

function toDbInsert(d: FormulaSessionInput) {
  return {
    patient_id: d.patientId,
    tmb_calculation_id: d.tmbCalculationId,
    target_calories: d.targetCalories,
    exchanges: d.exchanges as unknown as { subgroupId: string; exchanges: number }[],
    total_protein: d.totals.protein,
    total_fat: d.totals.fat,
    total_carbs: d.totals.carbs,
    protein_kcal: d.totals.proteinKcal,
    fat_kcal: d.totals.fatKcal,
    carbs_kcal: d.totals.carbsKcal,
    total_kcal: d.totals.totalKcal,
    protein_percent: d.totals.proteinPercent,
    fat_percent: d.totals.fatPercent,
    carbs_percent: d.totals.carbsPercent,
    adequacy_percent: d.adequacyPercent,
  };
}

type DbFormulaUpdate = Database['hippos']['Tables']['formula_sessions']['Update'];

function toDbUpdate(d: Partial<FormulaSessionInput>): DbFormulaUpdate {
  const u: DbFormulaUpdate = {};
  if (d.targetCalories !== undefined) u.target_calories = d.targetCalories;
  if (d.exchanges !== undefined) u.exchanges = d.exchanges;
  if (d.totals) {
    u.total_protein = d.totals.protein;
    u.total_fat = d.totals.fat;
    u.total_carbs = d.totals.carbs;
    u.protein_kcal = d.totals.proteinKcal;
    u.fat_kcal = d.totals.fatKcal;
    u.carbs_kcal = d.totals.carbsKcal;
    u.total_kcal = d.totals.totalKcal;
    u.protein_percent = d.totals.proteinPercent;
    u.fat_percent = d.totals.fatPercent;
    u.carbs_percent = d.totals.carbsPercent;
  }
  if (d.adequacyPercent !== undefined) u.adequacy_percent = d.adequacyPercent;
  return u;
}

// ─── Queries ────────────────────────────────────────────────

export async function getFormulaSessionsByTmb(tmbCalculationId: string): Promise<FormulaSession[]> {
  const { data, error } = await supabase
    .from('formula_sessions')
    .select('*')
    .eq('tmb_calculation_id', tmbCalculationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toFormulaSession);
}

export async function getFormulaSessionByTmbId(tmbCalculationId: string): Promise<FormulaSession | null> {
  const { data, error } = await supabase
    .from('formula_sessions')
    .select('*')
    .eq('tmb_calculation_id', tmbCalculationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toFormulaSession(data) : null;
}

export async function getFormulaSessionById(id: string): Promise<FormulaSession | null> {
  const { data, error } = await supabase
    .from('formula_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? toFormulaSession(data) : null;
}

export async function createFormulaSession(input: FormulaSessionInput): Promise<FormulaSession> {
  const { data, error } = await supabase
    .from('formula_sessions')
    .insert(toDbInsert(input))
    .select()
    .single();
  if (error) throw error;
  return toFormulaSession(data);
}

export async function updateFormulaSession(id: string, input: Partial<FormulaSessionInput>): Promise<FormulaSession> {
  const { data, error } = await supabase
    .from('formula_sessions')
    .update(toDbUpdate(input))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return toFormulaSession(data);
}

export async function duplicateFormulaSession(sourceId: string): Promise<FormulaSession> {
  const { data: original, error: fetchErr } = await supabase
    .from('formula_sessions')
    .select('*')
    .eq('id', sourceId)
    .single();
  if (fetchErr) throw fetchErr;

  const session = toFormulaSession(original);
  return createFormulaSession({
    patientId: session.patientId,
    tmbCalculationId: session.tmbCalculationId,
    targetCalories: session.targetCalories,
    exchanges: session.exchanges,
    totals: session.totals,
    adequacyPercent: session.adequacyPercent,
  });
}

export async function deleteFormulaSession(id: string): Promise<void> {
  const { error } = await supabase.from('formula_sessions').delete().eq('id', id);
  if (error) throw error;
}
