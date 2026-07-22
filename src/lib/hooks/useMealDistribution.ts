'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MealDistribution } from '@/lib/supabase/meal-distributions';
import type { DbMealDistributionInsert } from '@/lib/supabase/types';
import {
  getMealDistribution,
  upsertMealDistribution as upsertSvc,
  deleteMealDistribution as deleteSvc,
} from '@/lib/supabase/meal-distributions';

export type { MealDistribution, DbMealDistributionInsert };

export function useMealDistribution(formulaSessionId: string | undefined) {
  const [distribution, setDistribution] = useState<MealDistribution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!formulaSessionId) { setDistribution(null); setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      setDistribution(await getMealDistribution(formulaSessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar distribución');
    } finally {
      setLoading(false);
    }
  }, [formulaSessionId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { distribution, loading, error, refetch: fetch };
}

export function useUpsertMealDistribution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsert = useCallback(async (data: DbMealDistributionInsert) => {
    try {
      setLoading(true);
      setError(null);
      const result = await upsertSvc(data);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar distribución');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteSvc(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar distribución');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { upsert, remove, loading, error };
}
