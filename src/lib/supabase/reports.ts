import { supabase } from './client';
import type { DbReportRow } from './types';
import type { ReportRow } from '@/lib/types/report';
import type { PatientObjective } from '@/lib/types/patient';
import type { ExchangeEntry, MacroTotals } from '@/lib/types/formula';

// ─── Converter ──────────────────────────────────────────────

function toReportRow(row: DbReportRow): ReportRow {
  const totals: MacroTotals = {
    protein: 0, fat: 0, carbs: 0,
    proteinKcal: 0, fatKcal: 0, carbsKcal: 0,
    totalKcal: Number(row.total_kcal),
    proteinPercent: Number(row.protein_percent),
    fatPercent: Number(row.fat_percent),
    carbsPercent: Number(row.carbs_percent),
  };
  return {
    formulaId: row.formula_id,
    formulaDate: row.formula_date,
    patientId: row.patient_id,
    patientName: row.patient_name,
    patientSex: row.patient_sex,
    patientAge: Number(row.patient_age),
    objective: row.objective as PatientObjective,
    currentWeight: Number(row.current_weight),
    healthyWeight: Number(row.healthy_weight),
    currentBmi: Number(row.current_bmi),
    targetBmi: Number(row.target_bmi),
    targetCalories: Number(row.target_calories),
    totalKcal: Number(row.total_kcal),
    adequacyPercent: Number(row.adequacy_percent),
    proteinPercent: Number(row.protein_percent),
    fatPercent: Number(row.fat_percent),
    carbsPercent: Number(row.carbs_percent),
    tmbCalculationId: row.tmb_calculation_id,
    exchanges: (row.exchanges ?? []) as ExchangeEntry[],
    totals,
  };
}

// ─── Query ──────────────────────────────────────────────────

export async function getReportData(filters: {
  startDate: string;
  endDate: string;
  patientId?: string | null;
  objective?: string | null;
}): Promise<ReportRow[]> {
  let query = supabase
    .from('report_view')
    .select('*')
    .gte('formula_date', filters.startDate)
    .lte('formula_date', filters.endDate + 'T23:59:59.999Z')
    .order('formula_date', { ascending: false });

  if (filters.patientId) {
    query = query.eq('patient_id', filters.patientId);
  }
  if (filters.objective && filters.objective !== 'ALL') {
    query = query.eq('objective', filters.objective);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toReportRow);
}
