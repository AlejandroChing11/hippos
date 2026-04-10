'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Patient } from '@/lib/types/patient';
import type { PatientObjective } from '@/lib/types/patient';
import type { TmbCalculation } from '@/lib/types/tmb';
import type { FormulaSession } from '@/lib/types/formula';
import type { ReportFiltersState, ReportRow, ReportSummary } from '@/lib/types/report';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { normalizeTmbCalculation } from '@/lib/utils/tmb-migrate';
import { resolveDateRange, isDateInRange, todayISO, firstOfMonthISO } from '@/lib/utils/date-filters';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportSummaryCards } from '@/components/reports/ReportSummaryCards';
import { ReportTable } from '@/components/reports/ReportTable';
import { ReportDetail } from '@/components/reports/ReportDetail';
import { Button } from '@/components/ui/Button';

const DEFAULT_FILTERS: ReportFiltersState = {
  preset: 'this_month',
  startDate: firstOfMonthISO(),
  endDate: todayISO(),
  patientId: null,
  objectiveFilter: 'ALL',
};

export default function ReportsPage() {
  const router = useRouter();
  const [patients] = useSessionStorage<Patient[]>('hippos_patients', []);
  const [tmbCalcs] = useSessionStorage<TmbCalculation[]>('hippos_tmb_calculations', []);
  const [sessions] = useSessionStorage<FormulaSession[]>('hippos_formula_sessions', []);

  const [filters, setFilters] = useSessionStorage<ReportFiltersState>('hippos_report_filters', DEFAULT_FILTERS);
  const [detailRow, setDetailRow] = useState<ReportRow | null>(null);

  const patientMap = useMemo(() => new Map(patients.map(p => [p.id, p])), [patients]);
  const tmbMap = useMemo(() => {
    const m = new Map<string, TmbCalculation>();
    for (const raw of tmbCalcs) {
      const t = normalizeTmbCalculation(raw as Parameters<typeof normalizeTmbCalculation>[0]);
      m.set(t.id, t);
    }
    return m;
  }, [tmbCalcs]);

  const allRows: ReportRow[] = useMemo(() => {
    const result: ReportRow[] = [];
    for (const s of sessions) {
      const tmb = tmbMap.get(s.tmbCalculationId);
      const pat = patientMap.get(s.patientId);
      if (!tmb || !pat) continue;

      result.push({
        formulaId: s.id,
        formulaDate: s.createdAt,
        patientId: pat.id,
        patientName: pat.fullName,
        patientSex: pat.sex,
        patientAge: pat.age,
        objective: tmb.objective,
        currentWeight: tmb.currentWeight,
        healthyWeight: tmb.healthyWeight,
        currentBmi: tmb.currentBmi,
        targetBmi: tmb.targetBmi,
        targetCalories: tmb.targetCalories,
        totalKcal: s.totals.totalKcal,
        adequacyPercent: s.adequacyPercent,
        proteinPercent: s.totals.proteinPercent,
        fatPercent: s.totals.fatPercent,
        carbsPercent: s.totals.carbsPercent,
        tmbCalculationId: s.tmbCalculationId,
        exchanges: s.exchanges,
        totals: s.totals,
      });
    }
    result.sort((a, b) => (b.formulaDate > a.formulaDate ? 1 : -1));
    return result;
  }, [sessions, tmbMap, patientMap]);

  const filteredRows: ReportRow[] = useMemo(() => {
    const { startDate, endDate } = resolveDateRange(filters.preset, filters.startDate, filters.endDate);
    return allRows.filter(r => {
      if (!isDateInRange(r.formulaDate, startDate, endDate)) return false;
      if (filters.patientId && r.patientId !== filters.patientId) return false;
      if (filters.objectiveFilter !== 'ALL' && r.objective !== filters.objectiveFilter) return false;
      return true;
    });
  }, [allRows, filters]);

  const summary: ReportSummary = useMemo(() => {
    const rows = filteredRows;
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
  }, [filteredRows]);

  const patientOptions = useMemo(
    () => patients.map(p => ({ value: p.id, label: p.fullName })),
    [patients],
  );

  const goToFormula = useCallback(
    (tmbCalculationId: string) => router.push(`/formula?tmbCalculationId=${tmbCalculationId}`),
    [router],
  );

  if (sessions.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-24 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-inset">
          <svg className="h-9 w-9 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
          </svg>
        </div>
        <h2 className="font-heading text-xl font-bold text-ink">Aún no hay fórmulas registradas</h2>
        <p className="mt-2 text-pretty text-sm text-ink-secondary">
          Las fórmulas desarrolladas que guardes aparecerán aquí como historial de consultas.
        </p>
        <Button className="mt-6" onClick={() => router.push('/patients')}>
          Ir a crear un plan
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 pb-12 touch-manipulation">
      <header className="space-y-1 border-b border-border/80 pb-6">
        <h1 className="font-heading text-2xl font-bold text-balance text-ink md:text-3xl">
          Historial y reportes
        </h1>
        <p className="text-pretty text-sm text-ink-secondary">
          Registro consolidado de fórmulas desarrolladas, productividad y seguimiento clínico.
        </p>
      </header>

      <ReportFilters
        filters={filters}
        onChange={setFilters}
        patientOptions={patientOptions}
      />

      <ReportSummaryCards summary={summary} />

      <section className="space-y-4" aria-labelledby="report-table-heading">
        <h2 id="report-table-heading" className="font-heading text-lg font-semibold text-ink">
          Fórmulas en el período
        </h2>
        <ReportTable
          rows={filteredRows}
          onViewDetail={setDetailRow}
          onGoToFormula={goToFormula}
        />
      </section>

      <ReportDetail
        row={detailRow}
        onClose={() => setDetailRow(null)}
        onGoToFormula={goToFormula}
      />
    </div>
  );
}
