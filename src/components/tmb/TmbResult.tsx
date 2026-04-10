'use client';

import { Card } from '@/components/ui/Card';
import { formatKcal, formatNumber } from '@/lib/utils/format';

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
  children,
}: TmbResultProps) {
  const sexTerm = sex === 'M' ? '+ 5' : '− 161';
  const formula = `TMB = (10 × ${formatNumber(healthyWeight, 1)}) + (6.25 × ${height}) − (5 × ${age}) ${sexTerm}`;

  return (
    <Card className="space-y-4">
      <div className="rounded-lg bg-inset px-3 py-2.5 text-xs text-ink-secondary leading-relaxed font-mono tabular-nums break-all">
        <span className="block text-[11px] font-sans text-ink-tertiary mb-1">Mifflin-St Jeor (peso saludable)</span>
        {formula}
      </div>

      <div className="divide-y divide-border">
        <Row label="TMB (Mifflin-St Jeor)" value={formatKcal(tmb)} />
        <Row label="Factor de actividad" value={`${activityLabel} (×${activityFactor})`} />
        <Row label="TDEE" value={formatKcal(tdee)} />
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
