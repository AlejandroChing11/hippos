import { supabase } from './client';
import type {
  DbClinicalParam,
  DbClinicalParamUpdate,
  ParamCategory,
  ActivityFactorParam,
  MifflinCoefficients,
  MacroRange,
} from './types';
import { DEFAULT_MIFFLIN_COEFFICIENTS } from './types';

// ─── Read ────────────────────────────────────────────────────

export async function getParamsByCategory(category: ParamCategory): Promise<DbClinicalParam[]> {
  const { data, error } = await supabase
    .from('clinical_params')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(row => ({
    ...row,
    value: Number(row.value),
    max_value: row.max_value !== null ? Number(row.max_value) : null,
  }));
}

export async function getActivityFactors(): Promise<ActivityFactorParam[]> {
  const rows = await getParamsByCategory('ACTIVITY_FACTOR');
  return rows.map(row => ({
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description,
    factor: row.value,
  }));
}

export async function getMifflinCoefficients(): Promise<MifflinCoefficients> {
  const rows = await getParamsByCategory('MIFFLIN_COEFFICIENT');
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return {
    weightCoefficient: map['WEIGHT_COEFFICIENT'] ?? DEFAULT_MIFFLIN_COEFFICIENTS.weightCoefficient,
    heightCoefficient: map['HEIGHT_COEFFICIENT'] ?? DEFAULT_MIFFLIN_COEFFICIENTS.heightCoefficient,
    ageCoefficient: map['AGE_COEFFICIENT'] ?? DEFAULT_MIFFLIN_COEFFICIENTS.ageCoefficient,
    maleConstant: map['MALE_CONSTANT'] ?? DEFAULT_MIFFLIN_COEFFICIENTS.maleConstant,
    femaleConstant: map['FEMALE_CONSTANT'] ?? DEFAULT_MIFFLIN_COEFFICIENTS.femaleConstant,
  };
}

export async function getMacroRanges(): Promise<MacroRange[]> {
  const rows = await getParamsByCategory('MACRO_RANGE');
  return rows.map(row => ({
    id: row.id,
    key: row.key,
    label: row.label,
    min: row.value,
    max: row.max_value ?? 100,
  }));
}

// ─── Update ──────────────────────────────────────────────────

export async function updateClinicalParam(
  id: string,
  updates: DbClinicalParamUpdate,
): Promise<DbClinicalParam> {
  const { data, error } = await supabase
    .from('clinical_params')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    value: Number(data.value),
    max_value: data.max_value !== null ? Number(data.max_value) : null,
  };
}

// ─── Reset to defaults ───────────────────────────────────────

const DEFAULTS: Record<ParamCategory, { key: string; value: number; max_value: number | null }[]> = {
  ACTIVITY_FACTOR: [
    { key: 'SEDENTARY',         value: 1.2,   max_value: null },
    { key: 'LIGHTLY_ACTIVE',    value: 1.375, max_value: null },
    { key: 'MODERATELY_ACTIVE', value: 1.55,  max_value: null },
    { key: 'VERY_ACTIVE',       value: 1.725, max_value: null },
    { key: 'EXTREMELY_ACTIVE',  value: 1.9,   max_value: null },
  ],
  MIFFLIN_COEFFICIENT: [
    { key: 'WEIGHT_COEFFICIENT', value: 10,   max_value: null },
    { key: 'HEIGHT_COEFFICIENT', value: 6.25, max_value: null },
    { key: 'AGE_COEFFICIENT',    value: 5,    max_value: null },
    { key: 'MALE_CONSTANT',      value: 5,    max_value: null },
    { key: 'FEMALE_CONSTANT',    value: -161, max_value: null },
  ],
  MACRO_RANGE: [
    { key: 'CARBS_RANGE',   value: 45, max_value: 65  },
    { key: 'FAT_RANGE',     value: 0,  max_value: 35  },
    { key: 'PROTEIN_RANGE', value: 25, max_value: 100 },
  ],
};

export async function resetCategoryToDefaults(category: ParamCategory): Promise<void> {
  for (const def of DEFAULTS[category]) {
    const { error } = await supabase
      .from('clinical_params')
      .update({ value: def.value, max_value: def.max_value })
      .eq('category', category)
      .eq('key', def.key);
    if (error) throw error;
  }
}
