'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { EXCHANGE_SUMMARY_GROUPS } from '@/lib/constants/exchange-summary-groups';
import { MEAL_TIMES } from '@/lib/constants/meal-times';

interface Props {
  summaryTotals: Record<string, number>;
  distribution: Record<string, Record<string, number>>;
  onChange: (groupId: string, timeKey: string, value: number) => void;
  disabled?: boolean;
}

export function MealDistributionTable({ summaryTotals, distribution, onChange, disabled }: Props) {
  const groups = useMemo(() => EXCHANGE_SUMMARY_GROUPS, []);
  const times = useMemo(() => MEAL_TIMES, []);

  function getDistributionValue(groupId: string, timeKey: string): number {
    return distribution[groupId]?.[timeKey] ?? 0;
  }

  function getRowSum(groupId: string): number {
    return times.reduce((sum, t) => sum + getDistributionValue(groupId, t.key), 0);
  }

  function getDiff(groupId: string): number {
    const total = summaryTotals[groupId] ?? 0;
    const sum = getRowSum(groupId);
    return Math.round((sum - total) * 10) / 10;
  }

  function renderValidation(groupId: string) {
    const diff = getDiff(groupId);
    if (Math.abs(diff) < 0.001) {
      return (
        <span className="tabular-nums text-sm font-medium text-success flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      );
    }
    if (diff < 0) {
      return <Badge variant="warning">Faltan {Math.abs(diff)}</Badge>;
    }
    return <Badge variant="danger">Excedido por {diff}</Badge>;
  }

  return (
    <div className="overflow-x-auto -mx-2 px-0.5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-2.5 text-left font-medium text-ink-secondary text-xs uppercase tracking-wider">Grupo</th>
            <th className="px-3 py-2.5 text-center font-medium text-ink-secondary text-xs uppercase tracking-wider">Total</th>
            <th className="px-3 py-2.5 text-center font-medium text-ink-secondary text-xs uppercase tracking-wider w-[4px]"></th>
            {times.map(t => (
              <th key={t.key} className="px-1.5 py-2.5 text-center font-medium text-ink-secondary text-xs uppercase tracking-wider min-w-[68px]">
                {t.shortLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map(group => {
            const total = summaryTotals[group.id] ?? 0;
            return (
              <tr key={group.id} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                <td className="px-3 py-2 text-left text-ink font-medium whitespace-nowrap">
                  {group.label}
                </td>
                <td className={`px-3 py-2 text-center tabular-nums font-semibold ${total > 0 ? 'text-ink' : 'text-ink-muted'}`}>
                  {total}
                </td>
                <td className="px-1.5 py-2 text-center">
                  {renderValidation(group.id)}
                </td>
                {times.map(t => (
                  <td key={t.key} className="px-1 py-1.5">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={getDistributionValue(group.id, t.key) || ''}
                      onChange={e => onChange(group.id, t.key, parseFloat(e.target.value) || 0)}
                      disabled={disabled}
                      className="tabular-nums w-full text-center px-1.5 py-1.5 rounded-lg border border-border bg-inset text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage disabled:opacity-50 transition-colors"
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
