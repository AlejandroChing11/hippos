'use client';

import type { ReportSummary } from '@/lib/types/report';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatPercent } from '@/lib/utils/format';
import { getAdequacyStatus } from '@/lib/utils/formula-calc';
import { OBJECTIVES } from '@/lib/constants/objectives';

interface Props {
  summary: ReportSummary;
}

export function ReportSummaryCards({ summary }: Props) {
  const adequacyStatus = getAdequacyStatus(summary.averageAdequacy);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card padding="sm" className="space-y-1">
          <p className="text-xs text-ink-tertiary">Fórmulas generadas</p>
          <p className="text-2xl font-heading font-bold text-ink tabular-nums">{summary.totalFormulas}</p>
          <p className="text-xs text-ink-muted">en el período</p>
        </Card>

        <Card padding="sm" className="space-y-1">
          <p className="text-xs text-ink-tertiary">Pacientes atendidos</p>
          <p className="text-2xl font-heading font-bold text-ink tabular-nums">{summary.uniquePatients}</p>
          <p className="text-xs text-ink-muted">pacientes únicos</p>
        </Card>

        <Card padding="sm" className="space-y-1">
          <p className="text-xs text-ink-tertiary">Adecuación promedio</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-heading font-bold text-ink tabular-nums">
              {summary.totalFormulas > 0 ? formatPercent(summary.averageAdequacy) : '—'}
            </p>
            {summary.totalFormulas > 0 && (
              <Badge variant={adequacyStatus.variant}>{adequacyStatus.label}</Badge>
            )}
          </div>
        </Card>

        <Card padding="sm" className="space-y-1">
          <p className="text-xs text-ink-tertiary">Kcal promedio</p>
          <p className="text-2xl font-heading font-bold text-ink tabular-nums">
            {summary.totalFormulas > 0 ? `${Math.round(summary.averageTargetCalories).toLocaleString('es-CO')}` : '—'}
          </p>
          <p className="text-xs text-ink-muted">kcal objetivo</p>
        </Card>
      </div>

      {summary.byObjective.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {summary.byObjective.map(o => (
            <span
              key={o.objective}
              className="inline-flex items-center gap-1.5 rounded-lg bg-inset px-3 py-1.5 text-xs font-medium text-ink-secondary"
            >
              {OBJECTIVES[o.objective].label}
              <span className="tabular-nums font-semibold text-ink">{o.count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
