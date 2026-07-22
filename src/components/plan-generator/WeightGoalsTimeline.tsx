'use client';

import type { WeightGoal } from '@/lib/supabase/types';

interface Props {
  goals: WeightGoal[];
  onChange: (goals: WeightGoal[]) => void;
  disabled?: boolean;
}

function formatDateEs(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function WeightGoalsTimeline({ goals, onChange, disabled }: Props) {
  if (goals.length === 0) {
    return (
      <p className="text-xs text-ink-muted mt-2">Configura duración y pérdida por mes para ver el timeline.</p>
    );
  }

  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left font-medium text-ink-secondary text-xs uppercase tracking-wider">Fecha</th>
            <th className="px-3 py-2 text-center font-medium text-ink-secondary text-xs uppercase tracking-wider">Peso meta (kg)</th>
          </tr>
        </thead>
        <tbody>
          {goals.map((goal, i) => (
            <tr key={goal.date} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
              <td className="px-3 py-1.5 text-left text-ink whitespace-nowrap text-xs">
                {formatDateEs(goal.date)}
              </td>
              <td className="px-3 py-1.5 text-center">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={goal.targetWeight}
                  onChange={e => {
                    const updated = [...goals];
                    updated[i] = { ...updated[i], targetWeight: parseFloat(e.target.value) || 0 };
                    onChange(updated);
                  }}
                  disabled={disabled}
                  className="tabular-nums w-24 text-center px-2 py-1 rounded-lg border border-border bg-inset text-xs text-ink focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage disabled:opacity-50 transition-colors"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
