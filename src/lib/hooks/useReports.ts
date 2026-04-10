'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ReportRow, ReportSummary, ReportFiltersState } from '@/lib/types/report';
import type { PatientObjective } from '@/lib/types/patient';
import { getReportData } from '@/lib/supabase/reports';
import { resolveDateRange } from '@/lib/utils/date-filters';

export function useReports(filters: ReportFiltersState) {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { startDate, endDate } = resolveDateRange(filters.preset, filters.startDate, filters.endDate);
      const data = await getReportData({
        startDate,
        endDate,
        patientId: filters.patientId,
        objective: filters.objectiveFilter,
      });
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const summary: ReportSummary = useMemo(() => {
    const totalFormulas = rows.length;
    const uniquePatients = new Set(rows.map(r => r.patientId)).size;
    const averageAdequacy = totalFormulas > 0 ? rows.reduce((s, r) => s + r.adequacyPercent, 0) / totalFormulas : 0;
    const averageTargetCalories = totalFormulas > 0 ? rows.reduce((s, r) => s + r.targetCalories, 0) / totalFormulas : 0;

    const objCount = new Map<PatientObjective, number>();
    for (const r of rows) objCount.set(r.objective, (objCount.get(r.objective) ?? 0) + 1);
    const byObjective = [...objCount.entries()]
      .map(([objective, count]) => ({ objective, count }))
      .sort((a, b) => b.count - a.count);

    return { totalFormulas, uniquePatients, averageAdequacy, averageTargetCalories, byObjective };
  }, [rows]);

  return { rows, summary, loading, error, refetch: fetchReport };
}
