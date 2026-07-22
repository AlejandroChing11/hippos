'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FoodEquivalency } from '@/lib/supabase/food-equivalencies';
import type { DbFoodEquivalencyInsert, DbFoodEquivalencyUpdate } from '@/lib/supabase/types';
import {
  getFoodEquivalencies,
  createFoodEquivalency as createSvc,
  updateFoodEquivalency as updateSvc,
  deleteFoodEquivalency as deleteSvc,
} from '@/lib/supabase/food-equivalencies';

export type { FoodEquivalency, DbFoodEquivalencyInsert, DbFoodEquivalencyUpdate };

export function useFoodEquivalencies(summaryGroup?: string) {
  const [items, setItems] = useState<FoodEquivalency[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setItems(await getFoodEquivalencies(summaryGroup));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar equivalentes');
    } finally {
      setLoading(false);
    }
  }, [summaryGroup]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { items, loading, error, refetch: fetchAll };
}

export function useCreateFoodEquivalency() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: DbFoodEquivalencyInsert) => {
    try {
      setLoading(true);
      setError(null);
      return await createSvc(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear equivalente');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}

export function useUpdateFoodEquivalency() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, data: DbFoodEquivalencyUpdate) => {
    try {
      setLoading(true);
      setError(null);
      return await updateSvc(id, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar equivalente');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
}

export function useDeleteFoodEquivalency() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteSvc(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar equivalente');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading, error };
}
