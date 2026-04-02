'use client';

import { Card } from '@/components/ui/Card';
import { formatKcal } from '@/lib/utils/format';

interface TmbResultProps {
  tmb: number;
  activityLabel: string;
  activityFactor: number;
  tdee: number;
  restriction: number;
  targetCalories: number;
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className={muted ? 'text-ink-tertiary text-sm' : 'text-ink-secondary text-sm'}>{label}</span>
      <span className={muted ? 'text-ink-tertiary text-sm' : 'text-ink font-medium text-sm'}>{value}</span>
    </div>
  );
}

export function TmbResult({
  tmb,
  activityLabel,
  activityFactor,
  tdee,
  restriction,
  targetCalories,
}: TmbResultProps) {
  return (
    <Card className="space-y-1">
      <h3 className="font-heading text-lg font-semibold text-ink mb-2">Resultados</h3>

      <div className="divide-y divide-border">
        <Row label="TMB (Mifflin-St Jeor)" value={formatKcal(tmb)} />
        <Row label="Factor de actividad" value={`${activityLabel} (×${activityFactor})`} />
        <Row label="TDEE" value={formatKcal(tdee)} />
        {restriction > 0 && (
          <Row label="Restricción" value={`−${formatKcal(restriction)}`} muted />
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border-strong">
        <div className="flex items-center justify-between">
          <span className="text-ink-secondary font-medium">Requerimiento final</span>
          <span className="font-heading text-2xl font-bold text-sage">{formatKcal(targetCalories)}</span>
        </div>
      </div>
    </Card>
  );
}
