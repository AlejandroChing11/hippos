'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { DbClinicalParam, DbClinicalParamUpdate, ParamCategory } from '@/lib/supabase/types';
import { ParamResetButton } from './ParamResetButton';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface ActivityFactorsFormProps {
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

export function ActivityFactorsForm({ rows, onUpdate, onReset }: ActivityFactorsFormProps) {
  const [localRows, setLocalRows] = useState<DbClinicalParam[]>(rows);
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => { setLocalRows(rows); }, [rows]);

  const scheduleAutoSave = useCallback((id: string, updates: DbClinicalParamUpdate) => {
    const existing = timers.current.get(id);
    if (existing) clearTimeout(existing);
    setSaveStates(prev => ({ ...prev, [id]: 'saving' }));
    timers.current.set(id, setTimeout(async () => {
      try {
        await onUpdate(id, updates);
        setSaveStates(prev => ({ ...prev, [id]: 'saved' }));
        setTimeout(() => setSaveStates(prev => ({ ...prev, [id]: 'idle' })), 2000);
      } catch {
        setSaveStates(prev => ({ ...prev, [id]: 'error' }));
      }
    }, 500));
  }, [onUpdate]);

  function handleLabelChange(id: string, value: string) {
    setLocalRows(prev => prev.map(r => r.id === id ? { ...r, label: value } : r));
    const row = localRows.find(r => r.id === id);
    if (row) scheduleAutoSave(id, { label: value, description: row.description, value: row.value, max_value: row.max_value });
  }

  function handleDescriptionChange(id: string, value: string) {
    setLocalRows(prev => prev.map(r => r.id === id ? { ...r, description: value } : r));
    const row = localRows.find(r => r.id === id);
    if (row) scheduleAutoSave(id, { label: row.label, description: value, value: row.value, max_value: row.max_value });
  }

  function handleFactorChange(id: string, value: number) {
    setLocalRows(prev => prev.map(r => r.id === id ? { ...r, value } : r));
    const row = localRows.find(r => r.id === id);
    if (row) scheduleAutoSave(id, { label: row.label, description: row.description, value, max_value: row.max_value });
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-inset">
              <th className="px-4 py-3 text-left text-xs font-medium text-ink-tertiary uppercase tracking-wider">Nivel</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-ink-tertiary uppercase tracking-wider">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-ink-tertiary uppercase tracking-wider w-32">Factor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-ink-tertiary uppercase tracking-wider w-24">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {localRows.map(row => (
              <tr key={row.id} className="bg-surface hover:bg-surface-hover transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={row.label}
                    onChange={e => handleLabelChange(row.id, e.target.value)}
                    className="w-full bg-transparent text-ink font-medium focus:outline-none focus:bg-inset focus:px-2 focus:py-1 focus:rounded-md transition-all"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={row.description}
                    onChange={e => handleDescriptionChange(row.id, e.target.value)}
                    className="w-full bg-transparent text-ink-secondary focus:outline-none focus:bg-inset focus:px-2 focus:py-1 focus:rounded-md transition-all"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={row.value}
                    step={0.001}
                    min={1.0}
                    max={3.0}
                    onChange={e => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v)) handleFactorChange(row.id, v);
                    }}
                    className="w-24 tabular-nums bg-inset border border-border rounded-lg px-2 py-1.5 text-sm text-ink focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
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
        <ParamResetButton category="ACTIVITY_FACTOR" onReset={onReset} />
      </div>
    </div>
  );
}
