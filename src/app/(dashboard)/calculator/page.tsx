'use client';

import { Suspense, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Patient } from '@/lib/types/patient';
import type { TmbCalculation } from '@/lib/types/tmb';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Table, type Column } from '@/components/ui/Table';
import { TmbCalculator } from '@/components/tmb/TmbCalculator';
import { formatDate, formatKcal } from '@/lib/utils/format';

function CalculatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdFromUrl = searchParams.get('patientId');

  const [patients] = useSessionStorage<Patient[]>('hippos_patients', []);
  const [calculations, setCalculations] = useSessionStorage<TmbCalculation[]>('hippos_tmb_calculations', []);
  const [selectedId, setSelectedId] = useSessionStorage<string>('hippos_calc_selected_patient', patientIdFromUrl ?? '');

  const activePatientId = patientIdFromUrl ?? selectedId;
  const patient = useMemo(() => patients.find((p) => p.id === activePatientId), [patients, activePatientId]);

  const patientHistory = useMemo(
    () =>
      calculations
        .filter((c) => c.patientId === activePatientId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [calculations, activePatientId],
  );

  const patientOptions = useMemo(
    () => patients.map((p) => ({ value: p.id, label: p.fullName })),
    [patients],
  );

  const handleSave = useCallback(
    (calc: TmbCalculation) => {
      setCalculations((prev) => [...prev, calc]);
      router.push(`/formula?tmbCalculationId=${calc.id}`);
    },
    [setCalculations, router],
  );

  const columns: Column<TmbCalculation>[] = useMemo(
    () => [
      { key: 'createdAt', header: 'Fecha', render: (c) => formatDate(c.createdAt) },
      { key: 'weight', header: 'Peso', render: (c) => `${c.weight} kg` },
      { key: 'tmb', header: 'TMB', render: (c) => formatKcal(c.tmb) },
      { key: 'tdee', header: 'TDEE', render: (c) => formatKcal(c.tdee) },
      { key: 'caloricRestriction', header: 'Restricción', render: (c) => (c.caloricRestriction > 0 ? `−${formatKcal(c.caloricRestriction)}` : '—') },
      { key: 'targetCalories', header: 'Requerimiento', render: (c) => formatKcal(c.targetCalories), className: 'font-semibold' },
      {
        key: 'actions',
        header: 'Acciones',
        render: (c) => (
          <Button variant="ghost" size="sm" onClick={() => router.push(`/formula?tmbCalculationId=${c.id}`)}>
            Ir a Fórmula
          </Button>
        ),
      },
    ],
    [router],
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Calculadora TMB</h1>
        <p className="text-sm text-ink-secondary mt-1">
          Calcula el gasto energético y requerimiento calórico del paciente.
        </p>
      </div>

      {!patientIdFromUrl && (
        <div className="max-w-sm">
          <Select
            label="Seleccionar paciente"
            options={patientOptions}
            placeholder="Elegir paciente…"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          />
        </div>
      )}

      {patient ? (
        <>
          <TmbCalculator patient={patient} onSave={handleSave} />

          {patientHistory.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-heading text-lg font-semibold text-ink">Historial de cálculos</h2>
              <Table
                columns={columns}
                data={patientHistory}
                keyExtractor={(c) => c.id}
                emptyMessage="Sin cálculos previos"
              />
            </div>
          )}
        </>
      ) : (
        activePatientId && (
          <p className="text-sm text-ink-tertiary">
            No se encontró el paciente seleccionado.
          </p>
        )
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
