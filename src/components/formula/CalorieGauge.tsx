'use client';

import { useMemo } from 'react';
import { formatKcal, formatPercent } from '@/lib/utils/format';

interface CalorieGaugeProps {
  target: number;
  actual: number;
  adequacyPercent: number;
}

function getGaugeColor(adequacy: number): { bar: string; text: string } {
  if (adequacy >= 90 && adequacy <= 110) return { bar: 'bg-sage', text: 'text-sage' };
  if ((adequacy >= 80 && adequacy < 90) || (adequacy > 110 && adequacy <= 120))
    return { bar: 'bg-warning', text: 'text-warning' };
  return { bar: 'bg-danger', text: 'text-danger' };
}

export function CalorieGauge({ target, actual, adequacyPercent }: CalorieGaugeProps) {
  const colors = useMemo(() => getGaugeColor(adequacyPercent), [adequacyPercent]);
  const fillPercent = useMemo(
    () => (target > 0 ? Math.min((actual / target) * 100, 100) : 0),
    [target, actual],
  );
  const overflow = actual > target;

  return (
    <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Calorías</p>
        <span className={`text-sm font-semibold tabular-nums ${colors.text}`}>
          {formatPercent(adequacyPercent)}
        </span>
      </div>

      <div className="relative h-4 bg-inset rounded-lg overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-lg transition-all duration-300 ${colors.bar}`}
          style={{ width: `${fillPercent}%` }}
        />
        {overflow && (
          <div className="absolute inset-y-0 right-0 w-1.5 bg-danger animate-pulse rounded-r-lg" />
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-ink-secondary tabular-nums">
        <span>
          <span className="font-semibold text-ink">{formatKcal(actual)}</span> actual
        </span>
        <span>
          <span className="font-semibold text-ink">{formatKcal(target)}</span> objetivo
        </span>
      </div>
    </div>
  );
}
