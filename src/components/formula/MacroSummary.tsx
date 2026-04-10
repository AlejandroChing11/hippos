'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { MacroTotals } from '@/lib/types/formula';
import { getAdequacyStatus } from '@/lib/utils/formula-calc';
import { formatNumber, formatKcal, formatPercent } from '@/lib/utils/format';

interface MacroSummaryProps {
  targetCalories: number;
  totals: MacroTotals;
  adequacyPercent: number;
}

interface MacroBarConfig {
  label: string;
  grams: number;
  kcal: number;
  percent: number;
  barColor: string;
}

function getMacroBarColor(macro: 'protein' | 'fat' | 'carbs', percent: number): string {
  if (percent === 0) return 'bg-border';
  switch (macro) {
    case 'protein':
      return percent >= 10 && percent <= 35 ? 'bg-sage' : 'bg-warning';
    case 'fat':
      return percent <= 35 ? 'bg-sage' : 'bg-danger';
    case 'carbs':
      return percent >= 45 && percent <= 65 ? 'bg-sage' : 'bg-warning';
  }
}

function MacroBar({ config }: { config: MacroBarConfig }) {
  const clampedPercent = Math.min(config.percent, 100);
  return (
    <div className="space-y-1.5 min-w-0">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3 text-sm min-w-0">
        <span className="font-medium text-ink shrink-0">{config.label}</span>
        <span className="text-ink-secondary tabular-nums text-xs sm:text-sm break-words sm:text-right min-w-0">
          {formatNumber(config.grams)}g · {formatKcal(config.kcal)} · {formatPercent(config.percent)}
        </span>
      </div>
      <div className="h-2.5 w-full min-w-[120px] bg-inset rounded-lg overflow-hidden">
        <div
          className={`h-full rounded-lg transition-all duration-300 ${config.barColor}`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
}

export function MacroSummary({ targetCalories, totals, adequacyPercent }: MacroSummaryProps) {
  const status = useMemo(() => getAdequacyStatus(adequacyPercent), [adequacyPercent]);
  const diff = totals.totalKcal - targetCalories;

  const macroBars: MacroBarConfig[] = useMemo(
    () => [
      {
        label: 'Proteínas',
        grams: totals.protein,
        kcal: totals.proteinKcal,
        percent: totals.proteinPercent,
        barColor: getMacroBarColor('protein', totals.proteinPercent),
      },
      {
        label: 'Grasas',
        grams: totals.fat,
        kcal: totals.fatKcal,
        percent: totals.fatPercent,
        barColor: getMacroBarColor('fat', totals.fatPercent),
      },
      {
        label: 'Carbohidratos',
        grams: totals.carbs,
        kcal: totals.carbsKcal,
        percent: totals.carbsPercent,
        barColor: getMacroBarColor('carbs', totals.carbsPercent),
      },
    ],
    [totals],
  );

  return (
    <Card className="space-y-5 min-w-0">
      <h3 className="font-heading font-semibold text-ink text-lg">Resumen Nutricional</h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-inset rounded-lg p-3 space-y-0.5 min-w-0">
          <p className="text-xs text-ink-tertiary">Requerimiento</p>
          <p className="text-lg font-semibold text-ink tabular-nums break-all">{formatKcal(targetCalories)}</p>
        </div>
        <div className="bg-inset rounded-lg p-3 space-y-0.5 min-w-0">
          <p className="text-xs text-ink-tertiary">Total actual</p>
          <p className="text-lg font-semibold text-ink tabular-nums break-all">{formatKcal(totals.totalKcal)}</p>
        </div>
        <div className="bg-inset rounded-lg p-3 space-y-0.5 min-w-0">
          <p className="text-xs text-ink-tertiary">Diferencia</p>
          <p className={`text-lg font-semibold tabular-nums break-all ${Math.abs(diff) <= targetCalories * 0.1 ? 'text-success' : 'text-danger'}`}>
            {diff >= 0 ? '+' : ''}{Math.round(diff)} kcal
          </p>
        </div>
        <div className="bg-inset rounded-lg p-3 min-w-0 space-y-2">
          <p className="text-xs text-ink-tertiary">% Adecuación</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
            <span className="text-lg font-semibold text-ink tabular-nums shrink-0">{formatPercent(adequacyPercent)}</span>
            <Badge variant={status.variant}>
              <span className="whitespace-nowrap">{status.label}</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <p className="text-xs font-medium text-ink-tertiary uppercase tracking-wider">Distribución de macros</p>
        <div className="flex flex-col gap-4">
          {macroBars.map((config) => (
            <MacroBar key={config.label} config={config} />
          ))}
        </div>
      </div>
    </Card>
  );
}
