'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GeneratedPlan } from '@/lib/supabase/generated-plans';
import type { DbGeneratedPlanInsert } from '@/lib/supabase/types';
import {
  getGeneratedPlans,
  createGeneratedPlan as createSvc,
} from '@/lib/supabase/generated-plans';

export type { GeneratedPlan, DbGeneratedPlanInsert };

export function useGeneratedPlans(patientId: string | undefined) {
  const [plans, setPlans] = useState<GeneratedPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!patientId) { setPlans([]); setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      setPlans(await getGeneratedPlans(patientId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar planes generados');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { plans, loading, error, refetch: fetchAll };
}

export function useCreateGeneratedPlan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: DbGeneratedPlanInsert) => {
    try {
      setLoading(true);
      setError(null);
      return await createSvc(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear plan generado');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}
