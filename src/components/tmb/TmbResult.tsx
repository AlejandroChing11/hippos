'use client';

import { Card } from '@/components/ui/Card';
import { formatKcal, formatNumber } from '@/lib/utils/format';
import type { FormulaType } from '@/lib/types/tmb';

interface TmbResultProps {
  healthyWeight: number;
  height: number;
  age: number;
  sex: 'M' | 'F';
  tmb: number;
  activityLabel: string;
  activityFactor: number;
  tdee: number;
  restriction: number;
  targetCalories: number;
  formulaType: FormulaType;
  /** When DRI is active, show Mifflin TMB for reference */
  mifflinTmb?: number;
  /** Peso RQTO used in DRI formula */
  requirementWeight: number;
  children?: React.ReactNode;
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className={muted ? 'text-ink-tertiary text-sm shrink-0' : 'text-ink-secondary text-sm'}>{label}</span>
      <span className={`text-right text-sm tabular-nums ${muted ? 'text-ink-tertiary' : 'text-ink font-medium'}`}>{value}</span>
    </div>
  );
}

const SEX_TERM: Record<string, string> = { M: '+ 5', F: '− 161' };

export function TmbResult({
  healthyWeight,
  height,
  age,
  sex,
  tmb,
  activityLabel,
  activityFactor,
  tdee,
  restriction,
  targetCalories,
  formulaType,
  mifflinTmb,
  requirementWeight,
  children,
}: TmbResultProps) {
  const isDri = formulaType === 'dri';

  // DRI formula display
  const driFormula = isDri
    ? sex === 'M'
      ? `EER = 662 − (9.53 × ${age}) + ${activityFactor} × [(15.91 × ${formatNumber(requirementWeight, 1)}) + (539.6 × ${(height / 100).toFixed(2)})]`
      : `EER = 354 − (6.91 × ${age}) + ${activityFactor} × [(9.36 × ${formatNumber(requirementWeight, 1)}) + (726 × ${(height / 100).toFixed(2)})]`
    : null;

  // Mifflin formula display (for reference)
  const mifflinFormula = `TMB = (10 × ${formatNumber(healthyWeight, 1)}) + (6.25 × ${height}) − (5 × ${age}) ${SEX_TERM[sex]}`;

  return (
    <Card className="space-y-4">
      {/* Active formula */}
      <div className="rounded-lg bg-inset px-3 py-2.5 text-xs text-ink-secondary leading-relaxed font-mono tabular-nums break-all">
        <span className="block text-[11px] font-sans text-ink-tertiary mb-1">
          {isDri ? 'DRI — IOM 2005 (Peso RQTO)' : 'Mifflin-St Jeor (peso saludable)'}
        </span>
        {isDri ? driFormula : mifflinFormula}
      </div>

      {/* Mifflin reference when DRI is active */}
      {isDri && mifflinTmb !== undefined && (
        <div className="rounded-lg bg-amber-50/50 px-3 py-2 text-xs text-amber-800 leading-relaxed">
          <span className="block text-[11px] font-sans text-amber-600 mb-0.5">Referencia — Mifflin-St Jeor (peso saludable)</span>
          <span className="font-mono tabular-nums">{mifflinFormula} = {formatKcal(mifflinTmb)}</span>
        </div>
      )}

      <div className="divide-y divide-border">
        <Row
          label={isDri ? 'Requerimiento DRI (EER)' : 'TMB (Mifflin-St Jeor)'}
          value={formatKcal(tmb)}
        />
        {!isDri && (
          <Row label="Factor de actividad" value={`${activityLabel} (×${activityFactor})`} />
        )}
        {isDri && (
          <Row label="PA (IOM) incorporado" value={`${activityLabel} (PA ×${activityFactor})`} muted />
        )}
        <Row label={isDri ? 'Gasto total (TEE)' : 'TDEE'} value={formatKcal(tdee)} />
      </div>

      {children}

      {restriction > 0 && (
        <div className="border-t border-border pt-2">
          <Row label="Restricción aplicada" value={`−${formatKcal(restriction)}`} muted />
        </div>
      )}

      <div className="pt-4 border-t border-border-strong">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-ink-secondary font-medium">Requerimiento final</span>
          <span className="font-heading text-2xl font-bold text-sage tabular-nums">{formatKcal(targetCalories)}</span>
        </div>
      </div>
    </Card>
  );
}
