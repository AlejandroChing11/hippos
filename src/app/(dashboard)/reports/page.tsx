'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ReportFiltersState, ReportRow } from '@/lib/types/report';
import { usePatients } from '@/lib/hooks/usePatients';
import { useReports } from '@/lib/hooks/useReports';
import { todayISO } from '@/lib/utils/date-filters';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportSummaryCards } from '@/components/reports/ReportSummaryCards';
import { ReportTable } from '@/components/reports/ReportTable';
import { ReportDetail } from '@/components/reports/ReportDetail';
import { Button } from '@/components/ui/Button';

const DEFAULT_FILTERS: ReportFiltersState = {
  preset: 'all_time',
  startDate: '2000-01-01',
  endDate: todayISO(),
  patientId: null,
  objectiveFilter: 'ALL',
};

export default function ReportsPage() {
  const router = useRouter();
  const { patients } = usePatients();
  const [filters, setFilters] = useState<ReportFiltersState>(DEFAULT_FILTERS);
  const { rows, summary, loading, error, refetch } = useReports(filters);
  const [detailRow, setDetailRow] = useState<ReportRow | null>(null);

  const patientOptions = useMemo(() => patients.map(p => ({ value: p.id, label: p.fullName })), [patients]);

  const goToFormula = useCallback(
    (tmbCalculationId: string) => router.push(`/formula?tmbCalculationId=${tmbCalculationId}`),
    [router],
  );

  const hasActiveFilter = filters.preset !== 'all_time' || !!filters.patientId || filters.objectiveFilter !== 'ALL';

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 pb-12 touch-manipulation">
      <header className="space-y-1 border-b border-border/80 pb-6">
        <h1 className="font-heading text-2xl font-bold text-balance text-ink md:text-3xl">Historial y reportes</h1>
        <p className="text-pretty text-sm text-ink-secondary">Registro consolidado de fórmulas desarrolladas, productividad y seguimiento clínico.</p>
      </header>

      <ReportFilters filters={filters} onChange={setFilters} patientOptions={patientOptions} />

      {error && (
        <div className="rounded-xl border border-danger/25 bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
          <Button variant="ghost" size="sm" className="ml-3" onClick={refetch}>Reintentar</Button>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-ink-tertiary">Cargando reportes…</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-inset">
            <svg className="h-7 w-7 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <circle cx="11" cy="14" r="3" />
              <path d="M13.5 16.5L16 19" strokeLinecap="round" />
            </svg>
          </div>
          {hasActiveFilter ? (
            <>
              <p className="text-sm font-medium text-ink">Sin resultados para este filtro</p>
              <p className="mt-1 text-sm text-ink-secondary">Prueba con otro período, paciente u objetivo.</p>
              <Button variant="ghost" size="sm" className="mt-4" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Limpiar filtros
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-ink">Aún no hay fórmulas registradas</p>
              <p className="mt-1 max-w-sm text-pretty text-sm text-ink-secondary">Las fórmulas desarrolladas que guardes aparecerán aquí como historial de consultas.</p>
              <Button className="mt-6" onClick={() => router.push('/patients')}>Ir a crear un plan</Button>
            </>
          )}
        </div>
      ) : (
        <>
          <ReportSummaryCards summary={summary} />
          <section className="space-y-4" aria-labelledby="report-table-heading">
            <h2 id="report-table-heading" className="font-heading text-lg font-semibold text-ink">Fórmulas en el período</h2>
            <ReportTable rows={rows} onViewDetail={setDetailRow} onGoToFormula={goToFormula} />
          </section>
        </>
      )}

      <ReportDetail row={detailRow} onClose={() => setDetailRow(null)} onGoToFormula={goToFormula} />
    </div>
  );
}
