'use client';

import { useMemo, useState } from 'react';
import type { ReportRow } from '@/lib/types/report';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { OBJECTIVES } from '@/lib/constants/objectives';
import { formatNumber, formatKcal, formatPercent } from '@/lib/utils/format';
import { getAdequacyStatus } from '@/lib/utils/formula-calc';

interface Props {
  rows: ReportRow[];
  onViewDetail: (row: ReportRow) => void;
  onGoToFormula: (tmbCalculationId: string) => void;
}

type SortKey = 'formulaDate' | 'patientName';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 15;

const objectiveBadgeVariant: Record<string, 'warning' | 'info' | 'success' | 'neutral' | 'danger'> = {
  WEIGHT_LOSS: 'warning',
  MAINTENANCE: 'info',
  MUSCLE_GAIN: 'success',
  PREGNANCY: 'neutral',
  OTHER: 'neutral',
};

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function ReportTable({ rows, onViewDetail, onGoToFormula }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('formulaDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
    setPage(0);
  }

  const sorted = useMemo(() => {
    const copy = [...rows];
    const dir = sortDir === 'asc' ? 1 : -1;
    copy.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      return va < vb ? -dir : va > vb ? dir : 0;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = useMemo(() => sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [sorted, page]);

  const avgAdequacy = useMemo(
    () => (rows.length > 0 ? rows.reduce((s, r) => s + r.adequacyPercent, 0) / rows.length : 0),
    [rows],
  );

  function SortHeader({ k, children }: { k: SortKey; children: React.ReactNode }) {
    const active = sortKey === k;
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 cursor-pointer hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sage rounded"
        onClick={() => toggleSort(k)}
      >
        {children}
        {active && <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>}
      </button>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 py-16 text-center">
        <svg className="mb-3 h-10 w-10 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <p className="text-sm font-medium text-ink-secondary">No se encontraron fórmulas en el período seleccionado</p>
        <p className="mt-1 text-xs text-ink-muted">Ajusta los filtros o selecciona otro rango de fechas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-inset text-left text-xs font-medium uppercase tracking-wider text-ink-secondary">
              <th className="px-3 py-2.5"><SortHeader k="formulaDate">Fecha</SortHeader></th>
              <th className="px-3 py-2.5"><SortHeader k="patientName">Paciente</SortHeader></th>
              <th className="px-3 py-2.5">Sexo</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Edad</th>
              <th className="px-3 py-2.5">Objetivo</th>
              <th className="px-3 py-2.5 text-right whitespace-nowrap">Peso act.</th>
              <th className="px-3 py-2.5 text-right whitespace-nowrap">Peso sal.</th>
              <th className="px-3 py-2.5 text-right">Req.</th>
              <th className="px-3 py-2.5 text-right">Kcal</th>
              <th className="px-3 py-2.5 text-right">Adec.</th>
              <th className="px-3 py-2.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.map(r => {
              const adeq = getAdequacyStatus(r.adequacyPercent);
              return (
                <tr key={r.formulaId} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="px-3 py-2.5 tabular-nums whitespace-nowrap">{formatShortDate(r.formulaDate)}</td>
                  <td className="px-3 py-2.5 font-medium text-ink">{r.patientName}</td>
                  <td className="px-3 py-2.5"><Badge variant="neutral">{r.patientSex}</Badge></td>
                  <td className="px-3 py-2.5 tabular-nums">{r.patientAge}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant={objectiveBadgeVariant[r.objective] ?? 'neutral'}>
                      {OBJECTIVES[r.objective].label}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(r.currentWeight, 1)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(r.healthyWeight, 1)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{formatKcal(r.targetCalories)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{formatKcal(r.totalKcal)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      {formatPercent(r.adequacyPercent)}
                      <Badge variant={adeq.variant}>{adeq.label}</Badge>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onViewDetail(r)}>Ver</Button>
                      <Button variant="ghost" size="sm" onClick={() => onGoToFormula(r.tmbCalculationId)}>Fórmula</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border-strong bg-inset text-xs font-semibold text-ink">
              <td className="px-3 py-2.5" colSpan={4}>Total: {rows.length} fórmulas</td>
              <td colSpan={5} />
              <td className="px-3 py-2.5 text-right tabular-nums">
                {rows.length > 0 && <span>Prom. {formatPercent(avgAdequacy)}</span>}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            Anterior
          </Button>
          <span className="text-xs tabular-nums text-ink-secondary">
            {page + 1} / {totalPages}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
