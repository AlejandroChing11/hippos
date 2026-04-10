'use client';

import { useMemo } from 'react';
import type { ExchangeEntry } from '@/lib/types/formula';
import { EXCHANGE_SUMMARY_GROUPS } from '@/lib/constants/exchange-summary-groups';
import { Card } from '@/components/ui/Card';
import { formatNumber } from '@/lib/utils/format';

interface ExchangeSummaryProps {
  exchanges: ExchangeEntry[];
}

export function ExchangeSummary({ exchanges }: ExchangeSummaryProps) {
  const map = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of exchanges) m.set(e.subgroupId, e.exchanges);
    return m;
  }, [exchanges]);

  const rows = useMemo(
    () =>
      EXCHANGE_SUMMARY_GROUPS.map((g) => {
        let total = 0;
        for (const id of g.subgroupIds) total += map.get(id) ?? 0;
        return { ...g, total };
      }),
    [map],
  );

  return (
    <Card className="space-y-4">
      <h3 className="font-heading font-semibold text-ink text-lg">Resumen de Intercambios por Grupo</h3>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-inset text-left text-xs font-medium text-ink-secondary uppercase tracking-wide">
              <th className="px-3 py-2.5">Grupo</th>
              <th className="px-3 py-2.5 text-right">Intercambios</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id} className="bg-surface hover:bg-surface-hover/50">
                <td className="px-3 py-2 text-ink">
                  <span className="font-medium">{r.label}</span>
                  <p className="text-xs text-ink-tertiary mt-0.5">{r.subgroupIds.join(' + ')}</p>
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-medium text-ink">
                  {formatNumber(r.total, 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
