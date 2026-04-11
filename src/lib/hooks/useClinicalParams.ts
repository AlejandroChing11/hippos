'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  DbClinicalParam,
  DbClinicalParamUpdate,
  ParamCategory,
  ActivityFactorParam,
  MifflinCoefficients,
  MacroRange,
} from '@/lib/supabase/types';
import { DEFAULT_MIFFLIN_COEFFICIENTS } from '@/lib/supabase/types';
import {
  getParamsByCategory,
  getActivityFactors,
  getMifflinCoefficients,
  getMacroRanges,
  updateClinicalParam,
  resetCategoryToDefaults,
} from '@/lib/supabase/clinical-params';
import { ACTIVITY_FACTORS } from '@/lib/constants/activity-factors';

// ─── Fallback typed defaults ─────────────────────────────────

const FALLBACK_ACTIVITY_FACTORS: ActivityFactorParam[] = Object.entries(ACTIVITY_FACTORS).map(
  ([key, v]) => ({ id: key, key, label: v.label, description: v.description, factor: v.factor }),
);

export function useClinicalParams() {
  // Typed params for calculator/formula
  const [activityFactors, setActivityFactors] = useState<ActivityFactorParam[]>(FALLBACK_ACTIVITY_FACTORS);
  const [mifflinCoefficients, setMifflinCoefficients] = useState<MifflinCoefficients>(DEFAULT_MIFFLIN_COEFFICIENTS);
  const [macroRanges, setMacroRanges] = useState<MacroRange[]>([]);

  // Raw rows for settings forms (with ids)
  const [activityFactorRows, setActivityFactorRows] = useState<DbClinicalParam[]>([]);
  const [mifflinCoefficientRows, setMifflinCoefficientRows] = useState<DbClinicalParam[]>([]);
  const [macroRangeRows, setMacroRangeRows] = useState<DbClinicalParam[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [af, mc, mr, afRaw, mcRaw, mrRaw] = await Promise.all([
        getActivityFactors(),
        getMifflinCoefficients(),
        getMacroRanges(),
        getParamsByCategory('ACTIVITY_FACTOR'),
        getParamsByCategory('MIFFLIN_COEFFICIENT'),
        getParamsByCategory('MACRO_RANGE'),
      ]);
      setActivityFactors(af.length > 0 ? af : FALLBACK_ACTIVITY_FACTORS);
      setMifflinCoefficients(mc);
      setMacroRanges(mr);
      setActivityFactorRows(afRaw);
      setMifflinCoefficientRows(mcRaw);
      setMacroRangeRows(mrRaw);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar parámetros');
      // Keep fallback values on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateParam = useCallback(async (id: string, updates: DbClinicalParamUpdate) => {
    await updateClinicalParam(id, updates);
    await fetchAll();
  }, [fetchAll]);

  const resetCategory = useCallback(async (category: ParamCategory) => {
    await resetCategoryToDefaults(category);
    await fetchAll();
  }, [fetchAll]);

  return {
    activityFactors,
    mifflinCoefficients,
    macroRanges,
    activityFactorRows,
    mifflinCoefficientRows,
    macroRangeRows,
    loading,
    error,
    updateParam,
    resetCategory,
    refetch: fetchAll,
  };
}
