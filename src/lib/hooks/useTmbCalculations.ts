'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TmbCalculation } from '@/lib/types/tmb';
import {
  getTmbCalculations,
  createTmbCalculation as createSvc,
  type TmbCalculationInput,
} from '@/lib/supabase/tmb-calculations';

export type { TmbCalculationInput };

export function useTmbCalculations(patientId: string | undefined) {
  const [calculations, setCalculations] = useState<TmbCalculation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!patientId) { setCalculations([]); setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      setCalculations(await getTmbCalculations(patientId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cálculos');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = useCallback(async (data: TmbCalculationInput) => {
    const created = await createSvc(data);
    setCalculations(prev => [created, ...prev]);
    return created;
  }, []);

  return { calculations, loading, error, create, refetch: fetchAll };
}
