'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Patient } from '@/lib/types/patient';
import {
  getPatients,
  createPatient as createSvc,
  updatePatient as updateSvc,
  deletePatient as deleteSvc,
  type PatientFormData,
} from '@/lib/supabase/patients';

export type { PatientFormData };

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPatients(await getPatients());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = useCallback(async (data: PatientFormData) => {
    const created = await createSvc(data);
    setPatients(prev => [...prev, created].sort((a, b) => a.fullName.localeCompare(b.fullName)));
    return created;
  }, []);

  const update = useCallback(async (id: string, data: PatientFormData) => {
    const updated = await updateSvc(id, data);
    setPatients(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    const snapshot = patients;
    setPatients(prev => prev.filter(p => p.id !== id));
    try {
      await deleteSvc(id);
    } catch (err) {
      setPatients(snapshot);
      throw err;
    }
  }, [patients]);

  return { patients, loading, error, create, update, remove, refetch: fetchAll };
}
