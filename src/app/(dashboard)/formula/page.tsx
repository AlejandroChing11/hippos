'use client';

import { Suspense, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Patient } from '@/lib/types/patient';
import type { TmbCalculation } from '@/lib/types/tmb';
import type { FormulaSession, ExchangeEntry } from '@/lib/types/formula';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { calculateMacroTotals, createEmptyExchanges } from '@/lib/utils/formula-calc';
import { formatKcal, formatDate } from '@/lib/utils/format';
import { generateId } from '@/lib/utils/slug';
import { FormulaTable } from '@/components/formula/FormulaTable';
import { MacroSummary } from '@/components/formula/MacroSummary';
import { CalorieGauge } from '@/components/formula/CalorieGauge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import type { SelectOption } from '@/components/ui/Select';

function FormulaContent() {
  const searchParams = useSearchParams();
  const paramTmbId = searchParams.get('tmbCalculationId');

  const [patients] = useSessionStorage<Patient[]>('hippos_patients', []);
  const [tmbCalcs] = useSessionStorage<TmbCalculation[]>('hippos_tmb_calculations', []);
  const [sessions, setSessions] = useSessionStorage<FormulaSession[]>('hippos_formula_sessions', []);

  const linkedTmb = useMemo(
    () => (paramTmbId ? tmbCalcs.find(t => t.id === paramTmbId) : undefined),
    [paramTmbId, tmbCalcs],
  );
  const linkedPatient = useMemo(
    () => (linkedTmb ? patients.find(p => p.id === linkedTmb.patientId) : undefined),
    [linkedTmb, patients],
  );

  const [selectedPatientId, setSelectedPatientId] = useState<string>(linkedPatient?.id ?? '');
  const [selectedTmbId, setSelectedTmbId] = useState<string>(linkedTmb?.id ?? '');

  const activePatientId = linkedPatient?.id ?? selectedPatientId;
  const activeTmbId = linkedTmb?.id ?? selectedTmbId;

  const activePatient = useMemo(
    () => patients.find(p => p.id === activePatientId),
    [patients, activePatientId],
  );
  const activeTmb = useMemo(
    () => tmbCalcs.find(t => t.id === activeTmbId),
    [tmbCalcs, activeTmbId],
  );

  const patientTmbs = useMemo(
    () => tmbCalcs.filter(t => t.patientId === activePatientId),
    [tmbCalcs, activePatientId],
  );

  const existingSession = useMemo(
    () => (activeTmbId ? sessions.find(s => s.tmbCalculationId === activeTmbId) : undefined),
    [sessions, activeTmbId],
  );

  const [exchanges, setExchanges] = useState<ExchangeEntry[]>(
    () => existingSession?.exchanges ?? createEmptyExchanges(),
  );

  const targetCalories = activeTmb?.targetCalories ?? 0;

  const totals = useMemo(() => calculateMacroTotals(exchanges), [exchanges]);
  const adequacyPercent = useMemo(
    () => (targetCalories > 0 ? (totals.totalKcal / targetCalories) * 100 : 0),
    [totals.totalKcal, targetCalories],
  );

  const patientOptions: SelectOption[] = useMemo(
    () => patients.map(p => ({ value: p.id, label: p.fullName })),
    [patients],
  );
  const tmbOptions: SelectOption[] = useMemo(
    () =>
      patientTmbs.map(t => ({
        value: t.id,
        label: `${formatKcal(t.targetCalories)} — ${formatDate(t.createdAt)}`,
      })),
    [patientTmbs],
  );

  const handlePatientChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedPatientId(e.target.value);
      setSelectedTmbId('');
      setExchanges(createEmptyExchanges());
    },
    [],
  );

  const handleTmbChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      setSelectedTmbId(id);
      const existing = sessions.find(s => s.tmbCalculationId === id);
      setExchanges(existing?.exchanges ?? createEmptyExchanges());
    },
    [sessions],
  );

  const handleSave = useCallback(() => {
    if (!activeTmbId || !activePatientId) return;
    const now = new Date().toISOString();
    const session: FormulaSession = {
      id: existingSession?.id ?? generateId(),
      patientId: activePatientId,
      tmbCalculationId: activeTmbId,
      targetCalories,
      exchanges,
      totals,
      adequacyPercent,
      createdAt: existingSession?.createdAt ?? now,
      updatedAt: now,
    };
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === session.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = session;
        return next;
      }
      return [...prev, session];
    });
  }, [activeTmbId, activePatientId, targetCalories, exchanges, totals, adequacyPercent, existingSession, setSessions]);

  const handleReset = useCallback(() => {
    setExchanges(createEmptyExchanges());
  }, []);

  const handleDuplicate = useCallback(() => {
    if (!activeTmbId || !activePatientId) return;
    const now = new Date().toISOString();
    const dup: FormulaSession = {
      id: generateId(),
      patientId: activePatientId,
      tmbCalculationId: activeTmbId,
      targetCalories,
      exchanges,
      totals,
      adequacyPercent,
      createdAt: now,
      updatedAt: now,
    };
    setSessions(prev => [...prev, dup]);
  }, [activeTmbId, activePatientId, targetCalories, exchanges, totals, adequacyPercent, setSessions]);

  const hasAllergies = activePatient && activePatient.foodAllergies.length > 0;
  const isReady = !!activeTmb;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-ink">Fórmula Desarrollada</h1>
        {isReady && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Resetear intercambios
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDuplicate}>
              Duplicar plan
            </Button>
            <Button size="sm" onClick={handleSave}>
              Guardar plan
            </Button>
          </div>
        )}
      </div>

      {!linkedTmb && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Paciente"
            options={patientOptions}
            placeholder="Selecciona un paciente"
            value={selectedPatientId}
            onChange={handlePatientChange}
          />
          <Select
            label="Cálculo TMB"
            options={tmbOptions}
            placeholder={selectedPatientId ? 'Selecciona un cálculo' : 'Selecciona paciente primero'}
            value={selectedTmbId}
            onChange={handleTmbChange}
            disabled={!selectedPatientId}
          />
        </div>
      )}

      {linkedTmb && linkedPatient && (
        <div className="flex items-center gap-3 text-sm text-ink-secondary bg-surface-hover rounded-lg px-4 py-2.5">
          <span className="font-medium text-ink">{linkedPatient.fullName}</span>
          <span className="text-ink-muted">·</span>
          <span>{formatKcal(linkedTmb.targetCalories)} objetivo</span>
        </div>
      )}

      {hasAllergies && (
        <div className="flex items-start gap-3 bg-warning-light border border-warning/20 rounded-lg px-4 py-3">
          <svg className="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-warning">Alergias alimentarias</p>
            <p className="text-sm text-ink-secondary mt-0.5">
              {activePatient!.foodAllergies.join(', ')}
            </p>
          </div>
        </div>
      )}

      {isReady ? (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-[70%] min-w-0">
            <FormulaTable exchanges={exchanges} onChange={setExchanges} />
          </div>
          <div className="lg:w-[30%] space-y-4">
            <CalorieGauge
              target={targetCalories}
              actual={totals.totalKcal}
              adequacyPercent={adequacyPercent}
            />
            <MacroSummary
              targetCalories={targetCalories}
              totals={totals}
              adequacyPercent={adequacyPercent}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-inset flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
            </svg>
          </div>
          <p className="text-ink-secondary text-sm">
            Selecciona un paciente y un cálculo TMB para comenzar.
          </p>
        </div>
      )}
    </div>
  );
}

export default function FormulaPage() {
  return (
    <Suspense fallback={<div className="text-ink-tertiary text-sm py-12 text-center">Cargando…</div>}>
      <FormulaContent />
    </Suspense>
  );
}
