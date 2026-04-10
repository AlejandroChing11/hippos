'use client';

import { useMemo } from 'react';
import type { ReportRow } from '@/lib/types/report';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { OBJECTIVES } from '@/lib/constants/objectives';
import { FOOD_GROUPS } from '@/lib/constants/food-groups';
import { EXCHANGE_SUMMARY_GROUPS } from '@/lib/constants/exchange-summary-groups';
import { formatNumber, formatKcal, formatPercent } from '@/lib/utils/format';
import { formatDate } from '@/lib/utils/format';
import { getAdequacyStatus } from '@/lib/utils/formula-calc';

interface Props {
  row: ReportRow | null;
  onClose: () => void;
  onGoToFormula: (tmbCalculationId: string) => void;
}

const subgroupMap = new Map(
  FOOD_GROUPS.flatMap(g => g.subgroups.map(s => [s.id, s] as const)),
);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-ink-tertiary">{label}</p>
      <p className="text-sm font-medium text-ink mt-0.5">{children}</p>
    </div>
  );
}

export function ReportDetail({ row, onClose, onGoToFormula }: Props) {
  const nonZeroExchanges = useMemo(() => {
    if (!row) return [];
    return row.exchanges
      .filter(e => e.exchanges > 0)
      .map(e => {
        const sub = subgroupMap.get(e.subgroupId);
        return sub
          ? { name: sub.name, exchanges: e.exchanges, kcal: e.exchanges * sub.kcalPerExchange }
          : null;
      })
      .filter(Boolean) as { name: string; exchanges: number; kcal: number }[];
  }, [row]);

  const exchangeSummary = useMemo(() => {
    if (!row) return [];
    const map = new Map<string, number>();
    for (const e of row.exchanges) map.set(e.subgroupId, e.exchanges);
    return EXCHANGE_SUMMARY_GROUPS.map(g => {
      let total = 0;
      for (const id of g.subgroupIds) total += map.get(id) ?? 0;
      return { label: g.label, total };
    }).filter(r => r.total > 0);
  }, [row]);

  if (!row) return null;

  const adeq = getAdequacyStatus(row.adequacyPercent);

  return (
    <Modal open size="lg" onClose={onClose} title={`${row.patientName} — ${formatDate(row.formulaDate)}`}>
      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-ink-tertiary">Cálculo TMB</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Peso actual">{formatNumber(row.currentWeight, 1)} kg</Field>
            <Field label="IMC actual">{formatNumber(row.currentBmi, 1)}</Field>
            <Field label="IMC saludable">{formatNumber(row.targetBmi, 1)}</Field>
            <Field label="Peso saludable">{formatNumber(row.healthyWeight, 1)} kg</Field>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Objetivo">
              <Badge>{OBJECTIVES[row.objective].label}</Badge>
            </Field>
            <Field label="Requerimiento">{formatKcal(row.targetCalories)}</Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-ink-tertiary">Fórmula desarrollada</h3>
          {nonZeroExchanges.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-inset text-left text-xs font-medium text-ink-secondary">
                    <th className="px-3 py-2">Subgrupo</th>
                    <th className="px-3 py-2 text-right">Intercambios</th>
                    <th className="px-3 py-2 text-right">Kcal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {nonZeroExchanges.map(e => (
                    <tr key={e.name}>
                      <td className="px-3 py-1.5 text-ink">{e.name}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatNumber(e.exchanges, 1)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{Math.round(e.kcal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border-strong bg-inset font-semibold text-ink">
                    <td className="px-3 py-2">Total</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatNumber(nonZeroExchanges.reduce((s, e) => s + e.exchanges, 0), 1)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {Math.round(nonZeroExchanges.reduce((s, e) => s + e.kcal, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Sin intercambios asignados.</p>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-ink-tertiary">Macronutrientes</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Proteínas">{formatNumber(row.totals.protein, 1)}g ({formatPercent(row.proteinPercent)})</Field>
            <Field label="Grasas">{formatNumber(row.totals.fat, 1)}g ({formatPercent(row.fatPercent)})</Field>
            <Field label="Carbohidratos">{formatNumber(row.totals.carbs, 1)}g ({formatPercent(row.carbsPercent)})</Field>
            <Field label="Adecuación">
              <span className="inline-flex items-center gap-1.5">
                {formatPercent(row.adequacyPercent)}
                <Badge variant={adeq.variant}>{adeq.label}</Badge>
              </span>
            </Field>
          </div>
        </section>

        {exchangeSummary.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-ink-tertiary">Intercambios agrupados</h3>
            <div className="flex flex-wrap gap-2">
              {exchangeSummary.map(g => (
                <span
                  key={g.label}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-inset px-3 py-1.5 text-xs font-medium text-ink-secondary"
                >
                  {g.label}
                  <span className="tabular-nums font-semibold text-ink">{formatNumber(g.total, 1)}</span>
                </span>
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          <Button onClick={() => { onGoToFormula(row.tmbCalculationId); onClose(); }}>
            Ir a fórmula completa
          </Button>
        </div>
      </div>
    </Modal>
  );
}
