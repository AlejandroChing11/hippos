'use client';

import { Suspense, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Patient } from '@/lib/types/patient';
import type { TmbCalculation } from '@/lib/types/tmb';
import type { FormulaSession, ExchangeEntry } from '@/lib/types/formula';
import { usePatients } from '@/lib/hooks/usePatients';
import { useTmbCalculations } from '@/lib/hooks/useTmbCalculations';
import { getTmbCalculationById } from '@/lib/supabase/tmb-calculations';
import { getPatientById } from '@/lib/supabase/patients';
import {
  getFormulaSessionByTmbId,
  createFormulaSession,
  updateFormulaSession,
  duplicateFormulaSession,
} from '@/lib/supabase/formula-sessions';
import { calculateMacroTotals, createEmptyExchanges } from '@/lib/utils/formula-calc';
import { formatKcal, formatDate } from '@/lib/utils/format';
import { FormulaTable } from '@/components/formula/FormulaTable';
import { MacroSummary } from '@/components/formula/MacroSummary';
import { ExchangeSummary } from '@/components/formula/ExchangeSummary';
import { CalorieGauge } from '@/components/formula/CalorieGauge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import type { SelectOption } from '@/components/ui/Select';

function FormulaContent() {
  const searchParams = useSearchParams();
  const paramTmbId = searchParams.get('tmbCalculationId');
  const saveMsgRef = useRef<HTMLParagraphElement>(null);

  const { patients } = usePatients();

  // Linked-mode data (fetched once)
  const [linkedTmb, setLinkedTmb] = useState<TmbCalculation | null>(null);
  const [linkedPatient, setLinkedPatient] = useState<Patient | null>(null);
  const [existingSession, setExistingSession] = useState<FormulaSession | null>(null);
  const [dataLoading, setDataLoading] = useState(!!paramTmbId);

  // Manual-mode state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedTmbId, setSelectedTmbId] = useState('');
  const { calculations: patientTmbs } = useTmbCalculations(paramTmbId ? undefined : selectedPatientId || undefined);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load linked TMB + patient + session
  useEffect(() => {
    if (!paramTmbId) { setDataLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const tmb = await getTmbCalculationById(paramTmbId);
        if (cancelled || !tmb) { setDataLoading(false); return; }
        setLinkedTmb(tmb);
        const [pat, session] = await Promise.all([
          getPatientById(tmb.patientId),
          getFormulaSessionByTmbId(paramTmbId),
        ]);
        if (!cancelled) {
          setLinkedPatient(pat);
          setExistingSession(session);
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [paramTmbId]);

  // Resolve active TMB/patient from either mode
  const activeTmb = linkedTmb ?? (selectedTmbId ? patientTmbs.find(t => t.id === selectedTmbId) ?? null : null);
  const activePatient = linkedPatient ?? patients.find(p => p.id === (activeTmb?.patientId ?? selectedPatientId)) ?? null;
  const activeTmbId = activeTmb?.id ?? null;
  const activePatientId = activeTmb?.patientId ?? activePatient?.id ?? null;

  // Load existing session when manual TMB changes
  useEffect(() => {
    if (paramTmbId || !selectedTmbId) return;
    let cancelled = false;
    getFormulaSessionByTmbId(selectedTmbId).then(s => {
      if (!cancelled) setExistingSession(s);
    });
    return () => { cancelled = true; };
  }, [selectedTmbId, paramTmbId]);

  // Exchanges state
  const [exchanges, setExchanges] = useState<ExchangeEntry[]>(
    () => existingSession?.exchanges ?? createEmptyExchanges(),
  );

  // Sync exchanges when existingSession loads
  useEffect(() => {
    if (existingSession) setExchanges(existingSession.exchanges);
  }, [existingSession]);

  const targetCalories = activeTmb?.targetCalories ?? 0;
  const totals = useMemo(() => calculateMacroTotals(exchanges), [exchanges]);
  const adequacyPercent = useMemo(
    () => (targetCalories > 0 ? (totals.totalKcal / targetCalories) * 100 : 0),
    [totals.totalKcal, targetCalories],
  );

  const patientOptions: SelectOption[] = useMemo(() => patients.map(p => ({ value: p.id, label: p.fullName })), [patients]);
  const tmbOptions: SelectOption[] = useMemo(
    () => patientTmbs.map(t => ({ value: t.id, label: `${formatKcal(t.targetCalories)} — ${formatDate(t.createdAt)}` })),
    [patientTmbs],
  );

  const handlePatientChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPatientId(e.target.value);
    setSelectedTmbId('');
    setExchanges(createEmptyExchanges());
    setExistingSession(null);
  }, []);

  const handleTmbChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTmbId(e.target.value);
    setExchanges(createEmptyExchanges());
  }, []);

  useEffect(() => {
    if (!saveMessage) return;
    const t = window.setTimeout(() => setSaveMessage(null), 5000);
    return () => window.clearTimeout(t);
  }, [saveMessage]);

  const handleSave = useCallback(async () => {
    if (!activeTmbId || !activePatientId) return;
    setIsSaving(true);
    try {
      const input = { patientId: activePatientId, tmbCalculationId: activeTmbId, targetCalories, exchanges, totals, adequacyPercent };
      if (existingSession) {
        const updated = await updateFormulaSession(existingSession.id, input);
        setExistingSession(updated);
      } else {
        const created = await createFormulaSession(input);
        setExistingSession(created);
      }
      setSaveMessage('Plan guardado. Puedes continuar desde Pacientes o ajustar la fórmula.');
      queueMicrotask(() => saveMsgRef.current?.focus());
    } catch (err) {
      setSaveMessage(`Error: ${err instanceof Error ? err.message : 'No se pudo guardar'}`);
    } finally {
      setIsSaving(false);
    }
  }, [activeTmbId, activePatientId, targetCalories, exchanges, totals, adequacyPercent, existingSession]);

  const handleReset = useCallback(() => { setExchanges(createEmptyExchanges()); }, []);

  const handleDuplicate = useCallback(async () => {
    if (!existingSession) return;
    setIsSaving(true);
    try {
      await duplicateFormulaSession(existingSession.id);
      setSaveMessage('Copia del plan guardada en el historial de sesiones.');
    } catch (err) {
      setSaveMessage(`Error: ${err instanceof Error ? err.message : 'No se pudo duplicar'}`);
    } finally {
      setIsSaving(false);
    }
  }, [existingSession]);

  const hasAllergies = activePatient && activePatient.foodAllergies.length > 0;
  const isReady = !!activeTmb && !dataLoading;

  if (dataLoading) {
    return <div className="py-12 text-center text-sm text-ink-tertiary">Cargando fórmula…</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 pb-12 touch-manipulation">
      <header className="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="font-heading text-2xl font-bold text-balance text-ink md:text-3xl">Fórmula desarrollada</h1>
          <p className="text-pretty text-sm text-ink-secondary">Asigna intercambios y revisa el adecuación respecto al requerimiento calórico del cálculo TMB.</p>
        </div>
        {isReady && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={isSaving}>Resetear intercambios</Button>
            <Button variant="secondary" size="sm" onClick={handleDuplicate} disabled={isSaving || !existingSession}>Duplicar plan</Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Guardando…' : 'Guardar plan'}</Button>
          </div>
        )}
      </header>

      <div aria-live="polite" className="min-h-5 text-sm text-sage" role="status">
        {saveMessage ? (
          <p ref={saveMsgRef} tabIndex={-1} className="rounded-lg border border-sage/30 bg-sage-light/80 px-4 py-3 text-ink outline-none">{saveMessage}</p>
        ) : null}
      </div>

      {!linkedTmb && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Select label="Paciente" options={patientOptions} placeholder="Selecciona un paciente" value={selectedPatientId} onChange={handlePatientChange} />
          <Select label="Cálculo TMB" options={tmbOptions} placeholder={selectedPatientId ? 'Selecciona un cálculo' : 'Selecciona paciente primero'} value={selectedTmbId} onChange={handleTmbChange} disabled={!selectedPatientId} />
        </div>
      )}

      {linkedTmb && linkedPatient && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink-secondary shadow-xs">
          <span className="font-medium text-ink">{linkedPatient.fullName}</span>
          <span className="text-ink-muted" aria-hidden>·</span>
          <span>{formatKcal(linkedTmb.targetCalories)} objetivo</span>
        </div>
      )}

      {hasAllergies && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning-light px-4 py-3">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-warning">Alergias alimentarias</p>
            <p className="mt-0.5 text-sm text-ink-secondary">{activePatient!.foodAllergies.join(', ')}</p>
          </div>
        </div>
      )}

      {isReady ? (
        <>
          <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:gap-12">
            <section className="min-w-0 flex-1 space-y-4" aria-labelledby="formula-table-heading">
              <h2 id="formula-table-heading" className="font-heading text-lg font-semibold text-ink">Intercambios por subgrupo</h2>
              <FormulaTable exchanges={exchanges} onChange={setExchanges} />
            </section>
            <aside className="flex w-full min-w-0 flex-col gap-6 xl:w-[min(100%,400px)] xl:shrink-0" aria-label="Resumen nutricional y calorías">
              <CalorieGauge target={targetCalories} actual={totals.totalKcal} adequacyPercent={adequacyPercent} />
              <MacroSummary targetCalories={targetCalories} totals={totals} adequacyPercent={adequacyPercent} />
            </aside>
          </div>
          <section className="space-y-4" aria-labelledby="exchange-summary-heading">
            <h2 id="exchange-summary-heading" className="font-heading text-lg font-semibold text-ink">Resumen por grupos clínicos</h2>
            <ExchangeSummary exchanges={exchanges} />
          </section>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-inset">
            <svg className="h-7 w-7 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
            </svg>
          </div>
          <p className="max-w-sm text-pretty text-sm text-ink-secondary">Selecciona un paciente y un cálculo TMB para comenzar a armar la fórmula.</p>
        </div>
      )}
    </div>
  );
}

export default function FormulaPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-ink-tertiary">Cargando…</div>}>
      <FormulaContent />
    </Suspense>
  );
}
