'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FormulaSession } from '@/lib/types/formula';
import {
  getFormulaSessionsByTmb,
  createFormulaSession as createSvc,
  updateFormulaSession as updateSvc,
  duplicateFormulaSession as dupSvc,
  type FormulaSessionInput,
} from '@/lib/supabase/formula-sessions';

export type { FormulaSessionInput };

export function useFormulaSessions(tmbCalculationId: string | undefined) {
  const [sessions, setSessions] = useState<FormulaSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!tmbCalculationId) { setSessions([]); setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      setSessions(await getFormulaSessionsByTmb(tmbCalculationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar sesiones');
    } finally {
      setLoading(false);
    }
  }, [tmbCalculationId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = useCallback(async (data: FormulaSessionInput) => {
    const created = await createSvc(data);
    setSessions(prev => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, data: Partial<FormulaSessionInput>) => {
    const updated = await updateSvc(id, data);
    setSessions(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  }, []);

  const duplicate = useCallback(async (id: string) => {
    const dup = await dupSvc(id);
    setSessions(prev => [dup, ...prev]);
    return dup;
  }, []);

  return { sessions, loading, error, create, update, duplicate, refetch: fetchAll };
}
