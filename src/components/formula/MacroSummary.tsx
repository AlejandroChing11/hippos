'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { MacroTotals } from '@/lib/types/formula';
import type { MacroRange } from '@/lib/supabase/types';
import { getAdequacyStatus } from '@/lib/utils/formula-calc';
import { formatNumber, formatKcal, formatPercent } from '@/lib/utils/format';

interface MacroSummaryProps {
  targetCalories: number;
  totals: MacroTotals;
  adequacyPercent: number;
  /** Macro ranges from DB. Falls back to standard values (Protein 10–35%, Fat ≤35%, Carbs 45–65%) when not provided. */
  macroRanges?: MacroRange[];
}

interface MacroBarConfig {
  label: string;
  grams: number;
  kcal: number;
  percent: number;
  barColor: string;
  rangeLabel: string;
}

function getMacroBarColor(percent: number, min: number, max: number): string {
  if (percent === 0) return 'bg-border';
  return percent >= min && percent <= max ? 'bg-sage' : (percent < min ? 'bg-warning' : 'bg-danger');
}

function MacroBar({ config }: { config: MacroBarConfig }) {
  const clampedPercent = Math.min(config.percent, 100);
  return (
    <div className="space-y-1.5 min-w-0">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3 text-sm min-w-0">
        <div className="shrink-0">
          <span className="font-medium text-ink">{config.label}</span>
          <span className="ml-2 text-xs text-ink-tertiary">{config.rangeLabel}</span>
        </div>
        <span className="text-ink-secondary tabular-nums text-xs sm:text-sm wrap-break-word sm:text-right min-w-0">
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

// Standard fallback ranges
const FALLBACK_RANGES = {
  protein: { min: 10, max: 35 },
  fat:     { min: 0,  max: 35 },
  carbs:   { min: 45, max: 65 },
};

export function MacroSummary({ targetCalories, totals, adequacyPercent, macroRanges }: MacroSummaryProps) {
  const status = useMemo(() => getAdequacyStatus(adequacyPercent), [adequacyPercent]);
  const diff = totals.totalKcal - targetCalories;

  const ranges = useMemo(() => {
    if (!macroRanges || macroRanges.length === 0) return FALLBACK_RANGES;
    const protein = macroRanges.find(r => r.key === 'PROTEIN_RANGE');
    const fat = macroRanges.find(r => r.key === 'FAT_RANGE');
    const carbs = macroRanges.find(r => r.key === 'CARBS_RANGE');
    return {
      protein: { min: protein?.min ?? FALLBACK_RANGES.protein.min, max: protein?.max ?? FALLBACK_RANGES.protein.max },
      fat:     { min: fat?.min     ?? FALLBACK_RANGES.fat.min,     max: fat?.max     ?? FALLBACK_RANGES.fat.max     },
      carbs:   { min: carbs?.min   ?? FALLBACK_RANGES.carbs.min,   max: carbs?.max   ?? FALLBACK_RANGES.carbs.max   },
    };
  }, [macroRanges]);

  const macroBars: MacroBarConfig[] = useMemo(
    () => [
      {
        label: 'Proteínas',
        grams: totals.protein,
        kcal: totals.proteinKcal,
        percent: totals.proteinPercent,
        barColor: getMacroBarColor(totals.proteinPercent, ranges.protein.min, ranges.protein.max),
        rangeLabel: `${ranges.protein.min}–${ranges.protein.max}%`,
      },
      {
        label: 'Grasas',
        grams: totals.fat,
        kcal: totals.fatKcal,
        percent: totals.fatPercent,
        barColor: getMacroBarColor(totals.fatPercent, ranges.fat.min, ranges.fat.max),
        rangeLabel: `${ranges.fat.min}–${ranges.fat.max}%`,
      },
      {
        label: 'Carbohidratos',
        grams: totals.carbs,
        kcal: totals.carbsKcal,
        percent: totals.carbsPercent,
        barColor: getMacroBarColor(totals.carbsPercent, ranges.carbs.min, ranges.carbs.max),
        rangeLabel: `${ranges.carbs.min}–${ranges.carbs.max}%`,
      },
    ],
    [totals, ranges],
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
            <Badge variant={status.variant}><span className="whitespace-nowrap">{status.label}</span></Badge>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <p className="text-xs font-medium text-ink-tertiary uppercase tracking-wider">Distribución de macros</p>
        <div className="flex flex-col gap-4">
          {macroBars.map(config => (
            <MacroBar key={config.label} config={config} />
          ))}
        </div>
      </div>
    </Card>
  );
}
