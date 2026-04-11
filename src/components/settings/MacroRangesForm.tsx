'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { DbClinicalParam, DbClinicalParamUpdate, ParamCategory } from '@/lib/supabase/types';
import { ParamResetButton } from './ParamResetButton';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface MacroRangesFormProps {
  rows: DbClinicalParam[];
  onUpdate: (id: string, updates: DbClinicalParamUpdate) => Promise<void>;
  onReset: (category: ParamCategory) => Promise<void>;
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'idle') return null;
  if (state === 'saving') return <span className="text-xs text-ink-tertiary animate-pulse">Guardando…</span>;
  if (state === 'saved') return (
    <span className="flex items-center gap-1 text-xs text-sage">
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Guardado
    </span>
  );
  return <span className="text-xs text-danger">Error al guardar</span>;
}

export function MacroRangesForm({ rows, onUpdate, onReset }: MacroRangesFormProps) {
  const [localRows, setLocalRows] = useState<DbClinicalParam[]>(rows);
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => { setLocalRows(rows); }, [rows]);

  const scheduleAutoSave = useCallback((id: string, row: DbClinicalParam) => {
    const existing = timers.current.get(id);
    if (existing) clearTimeout(existing);

    // Validate min ≤ max
    const min = row.value;
    const max = row.max_value ?? 100;
    if (min > max) {
      setFieldErrors(prev => ({ ...prev, [id]: 'El mínimo no puede superar el máximo' }));
      return;
    }
    setFieldErrors(prev => { const next = { ...prev }; delete next[id]; return next; });
    setSaveStates(prev => ({ ...prev, [id]: 'saving' }));

    timers.current.set(id, setTimeout(async () => {
      try {
        await onUpdate(id, { label: row.label, description: row.description, value: row.value, max_value: row.max_value });
        setSaveStates(prev => ({ ...prev, [id]: 'saved' }));
        setTimeout(() => setSaveStates(prev => ({ ...prev, [id]: 'idle' })), 2000);
      } catch {
        setSaveStates(prev => ({ ...prev, [id]: 'error' }));
      }
    }, 500));
  }, [onUpdate]);

  function handleMinChange(id: string, value: number) {
    setLocalRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, value };
      scheduleAutoSave(id, updated);
      return updated;
    }));
  }

  function handleMaxChange(id: string, maxValue: number) {
    setLocalRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, max_value: maxValue };
      scheduleAutoSave(id, updated);
      return updated;
    }));
  }

  // Warning when sum of mins > 100
  const sumOfMins = useMemo(() => localRows.reduce((acc, r) => acc + r.value, 0), [localRows]);

  return (
    <div className="space-y-4">
      {sumOfMins > 100 && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning-light px-3 py-2 text-xs text-warning">
          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          La suma de los valores mínimos supera el 100% ({Math.round(sumOfMins)}%). Revisa la distribución.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-inset">
              <th className="px-4 py-3 text-left text-xs font-medium text-ink-tertiary uppercase tracking-wider">Macronutriente</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-ink-tertiary uppercase tracking-wider w-36">Mínimo (%)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-ink-tertiary uppercase tracking-wider w-36">Máximo (%)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-ink-tertiary uppercase tracking-wider w-36">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {localRows.map(row => (
              <tr key={row.id} className="bg-surface hover:bg-surface-hover transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{row.label}</p>
                  <p className="text-xs text-ink-tertiary mt-0.5">{row.description}</p>
                  {fieldErrors[row.id] && (
                    <p className="text-xs text-danger mt-1">{fieldErrors[row.id]}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={row.value}
                    step={1}
                    min={0}
                    max={100}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) handleMinChange(row.id, v);
                    }}
                    className={`w-24 tabular-nums bg-inset border rounded-lg px-2 py-1.5 text-sm text-ink focus:outline-none focus:ring-1 transition-colors ${
                      fieldErrors[row.id] ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border focus:border-sage focus:ring-sage'
                    }`}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={row.max_value ?? 100}
                    step={1}
                    min={0}
                    max={100}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) handleMaxChange(row.id, v);
                    }}
                    className={`w-24 tabular-nums bg-inset border rounded-lg px-2 py-1.5 text-sm text-ink focus:outline-none focus:ring-1 transition-colors ${
                      fieldErrors[row.id] ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border focus:border-sage focus:ring-sage'
                    }`}
                  />
                </td>
                <td className="px-4 py-3">
                  <SaveIndicator state={saveStates[row.id] ?? 'idle'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <ParamResetButton category="MACRO_RANGE" onReset={onReset} />
      </div>
    </div>
  );
}
