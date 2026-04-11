'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { DbClinicalParam, DbClinicalParamUpdate, ParamCategory } from '@/lib/supabase/types';
import { ParamResetButton } from './ParamResetButton';
import { formatNumber } from '@/lib/utils/format';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface MifflinCoefficientsFormProps {
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

const FIELD_CONFIG: Record<string, { label: string; step: number; min: number; max: number }> = {
  WEIGHT_COEFFICIENT: { label: 'Coeficiente peso',    step: 0.01, min: 0.1, max: 50 },
  HEIGHT_COEFFICIENT: { label: 'Coeficiente talla',   step: 0.01, min: 0.1, max: 50 },
  AGE_COEFFICIENT:    { label: 'Coeficiente edad',    step: 0.01, min: 0.1, max: 50 },
  MALE_CONSTANT:      { label: 'Constante masculina', step: 1,    min: -500, max: 500 },
  FEMALE_CONSTANT:    { label: 'Constante femenina',  step: 1,    min: -500, max: 500 },
};

export function MifflinCoefficientsForm({ rows, onUpdate, onReset }: MifflinCoefficientsFormProps) {
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

  function handleValueChange(id: string, value: number) {
    setLocalRows(prev => prev.map(r => r.id === id ? { ...r, value } : r));
    const row = localRows.find(r => r.id === id);
    if (row) scheduleAutoSave(id, { label: row.label, description: row.description, value, max_value: row.max_value });
  }

  // Live preview values derived from localRows
  const coefs = useMemo(() => {
    const map = Object.fromEntries(localRows.map(r => [r.key, r.value]));
    return {
      w: map['WEIGHT_COEFFICIENT'] ?? 10,
      h: map['HEIGHT_COEFFICIENT'] ?? 6.25,
      a: map['AGE_COEFFICIENT'] ?? 5,
      m: map['MALE_CONSTANT'] ?? 5,
      f: map['FEMALE_CONSTANT'] ?? -161,
    };
  }, [localRows]);

  // Example: 70kg, 170cm, 30 years
  const exampleMale = useMemo(
    () => coefs.w * 70 + coefs.h * 170 - coefs.a * 30 + coefs.m,
    [coefs],
  );
  const exampleFemale = useMemo(
    () => coefs.w * 70 + coefs.h * 170 - coefs.a * 30 + coefs.f,
    [coefs],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {localRows.map(row => {
          const cfg = FIELD_CONFIG[row.key] ?? { label: row.label, step: 0.01, min: -500, max: 500 };
          return (
            <div key={row.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-ink">{cfg.label}</label>
                <SaveIndicator state={saveStates[row.id] ?? 'idle'} />
              </div>
              <p className="text-xs text-ink-tertiary">{row.description}</p>
              <input
                type="number"
                value={row.value}
                step={cfg.step}
                min={cfg.min}
                max={cfg.max}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) handleValueChange(row.id, v);
                }}
                className="w-full tabular-nums bg-inset border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
              />
            </div>
          );
        })}
      </div>

      {/* Live preview */}
      <div className="rounded-xl border border-border bg-inset p-4 space-y-3">
        <p className="text-xs font-medium text-ink-tertiary uppercase tracking-wider">Previsualización de la fórmula</p>
        <div className="space-y-1 font-mono text-xs text-ink-secondary leading-relaxed">
          <p>
            <span className="text-ink font-semibold">Hombres:</span>{' '}
            TMB = ({coefs.w} × peso) + ({coefs.h} × talla) − ({coefs.a} × edad) + {coefs.m}
          </p>
          <p>
            <span className="text-ink font-semibold">Mujeres:</span>{' '}
            TMB = ({coefs.w} × peso) + ({coefs.h} × talla) − ({coefs.a} × edad) + ({coefs.f})
          </p>
        </div>
        <div className="border-t border-border pt-3 space-y-0.5">
          <p className="text-xs text-ink-tertiary">Ejemplo (70 kg · 170 cm · 30 años)</p>
          <p className="text-sm text-ink">
            <span className="font-medium">Hombre:</span>{' '}
            <span className="tabular-nums font-semibold text-sage">{formatNumber(exampleMale, 1)} kcal</span>
            <span className="mx-3 text-ink-tertiary">|</span>
            <span className="font-medium">Mujer:</span>{' '}
            <span className="tabular-nums font-semibold text-sage">{formatNumber(exampleFemale, 1)} kcal</span>
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <ParamResetButton category="MIFFLIN_COEFFICIENT" onReset={onReset} />
      </div>
    </div>
  );
}
