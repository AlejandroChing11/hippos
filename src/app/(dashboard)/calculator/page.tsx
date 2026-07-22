'use client';

import { Suspense, useMemo, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { TmbCalculation } from '@/lib/types/tmb';
import type { TmbCalculationInput } from '@/lib/supabase/tmb-calculations';
import { usePatients } from '@/lib/hooks/usePatients';
import { useTmbCalculations } from '@/lib/hooks/useTmbCalculations';
import { useClinicalParams } from '@/lib/hooks/useClinicalParams';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Table, type Column } from '@/components/ui/Table';
import { TmbCalculator } from '@/components/tmb/TmbCalculator';
import { formatDate, formatKcal, formatNumber } from '@/lib/utils/format';

function CalculatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdFromUrl = searchParams.get('patientId');
  const { toast } = useToast();

  const { patients, loading: patientsLoading } = usePatients();
  const { activityFactors, mifflinCoefficients, error: paramsError } = useClinicalParams();
  const [selectedId, setSelectedId] = useState<string>(patientIdFromUrl ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const activePatientId = patientIdFromUrl ?? selectedId;
  const patient = useMemo(() => patients.find(p => p.id === activePatientId), [patients, activePatientId]);

  const { calculations: patientHistory, loading: calcsLoading, create } = useTmbCalculations(activePatientId || undefined);

  const patientOptions = useMemo(() => patients.map(p => ({ value: p.id, label: p.fullName })), [patients]);

  const handleSave = useCallback(async (data: TmbCalculationInput) => {
    setIsSaving(true);
    try {
      const created = await create(data);
      toast('Cálculo guardado. Continuando a la fórmula…');
      router.push(`/formula?tmbCalculationId=${created.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al guardar el cálculo', 'error');
      setIsSaving(false);
    }
  }, [create, router, toast]);

  const columns: Column<TmbCalculation>[] = useMemo(
    () => [
      { key: 'createdAt', header: 'Fecha', render: c => formatDate(c.createdAt) },
      { key: 'currentWeight', header: 'Peso actual', render: c => `${formatNumber(c.currentWeight, 1)} kg`, className: 'whitespace-nowrap' },
      { key: 'currentBmi', header: 'IMC actual', render: c => formatNumber(c.currentBmi, 1), className: 'whitespace-nowrap' },
      { key: 'targetBmi', header: 'IMC saludable', render: c => formatNumber(c.targetBmi, 1), className: 'whitespace-nowrap' },
      { key: 'healthyWeight', header: 'Peso saludable', render: c => `${formatNumber(c.healthyWeight, 1)} kg`, className: 'whitespace-nowrap' },
      { key: 'tmb', header: 'TMB', render: c => formatKcal(c.tmb) },
      { key: 'tdee', header: 'TDEE', render: c => formatKcal(c.tdee) },
      { key: 'caloricRestriction', header: 'Restricción', render: c => (c.caloricRestriction > 0 ? `−${formatKcal(c.caloricRestriction)}` : '—') },
      { key: 'targetCalories', header: 'Requerimiento', render: c => formatKcal(c.targetCalories), className: 'font-semibold' },
      {
        key: 'actions',
        header: 'Acciones',
        render: c => (
          <Button variant="ghost" size="sm" onClick={() => router.push(`/formula?tmbCalculationId=${c.id}`)}>
            Ir a Fórmula
          </Button>
        ),
      },
    ],
    [router],
  );

  if (patientsLoading) {
    return <div className="py-12 text-center text-sm text-ink-tertiary">Cargando…</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Calculadora TMB</h1>
        <p className="text-sm text-ink-secondary mt-1">Calcula el gasto energético y requerimiento calórico del paciente.</p>
      </div>

      {paramsError && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning-light px-4 py-3 text-sm text-ink-secondary">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          No se pudieron cargar los parámetros personalizados. Usando valores estándar.
        </div>
      )}

      {!patientIdFromUrl && (
        <div className="max-w-sm">
          <Select label="Seleccionar paciente" options={patientOptions} placeholder="Elegir paciente…" value={selectedId} onChange={e => setSelectedId(e.target.value)} />
        </div>
      )}

      {patient ? (
        <>
          <TmbCalculator
            key={patient.id}
            patient={patient}
            onSave={handleSave}
            activityFactors={activityFactors}
            mifflinCoefficients={mifflinCoefficients}
          />
          {isSaving && <p className="text-sm text-ink-tertiary text-center">Guardando cálculo…</p>}
          {!calcsLoading && patientHistory.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-heading text-lg font-semibold text-ink">Historial de cálculos</h2>
              <Table columns={columns} data={patientHistory} keyExtractor={c => c.id} emptyMessage="Sin cálculos previos" />
            </div>
          )}
        </>
      ) : (
        activePatientId && <p className="text-sm text-ink-tertiary">No se encontró el paciente seleccionado.</p>
      )}
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <Suspense fallback={<div className="text-ink-tertiary text-sm py-12 text-center">Cargando…</div>}>
      <CalculatorContent />
    </Suspense>
  );
}
