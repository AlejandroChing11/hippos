'use client';

import { useMemo } from 'react';
import type { DateRangePreset, ReportFiltersState } from '@/lib/types/report';
import type { PatientObjective } from '@/lib/types/patient';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { OBJECTIVES } from '@/lib/constants/objectives';

interface ReportFiltersProps {
  filters: ReportFiltersState;
  onChange: (f: ReportFiltersState) => void;
  patientOptions: { value: string; label: string }[];
}

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'this_week', label: 'Esta semana' },
  { value: 'this_month', label: 'Este mes' },
  { value: 'last_week', label: 'Semana pasada' },
  { value: 'last_month', label: 'Mes pasado' },
  { value: 'custom', label: 'Personalizado' },
];

export function ReportFilters({ filters, onChange, patientOptions }: ReportFiltersProps) {
  const objectiveOptions = useMemo(
    () => [
      { value: 'ALL', label: 'Todos los objetivos' },
      ...(Object.entries(OBJECTIVES) as [PatientObjective, (typeof OBJECTIVES)[PatientObjective]][]).map(
        ([k, v]) => ({ value: k, label: v.label }),
      ),
    ],
    [],
  );

  const allPatientOptions = useMemo(
    () => [{ value: '', label: 'Todos los pacientes' }, ...patientOptions],
    [patientOptions],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Período">
        {PRESETS.map(p => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange({ ...filters, preset: p.value })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage ${
              filters.preset === p.value
                ? 'bg-sage text-white shadow-xs'
                : 'bg-inset text-ink-secondary hover:bg-surface-hover hover:text-ink'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {filters.preset === 'custom' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-md">
          <Input
            type="date"
            label="Desde"
            value={filters.startDate}
            onChange={e => onChange({ ...filters, startDate: e.target.value })}
          />
          <Input
            type="date"
            label="Hasta"
            value={filters.endDate}
            onChange={e => onChange({ ...filters, endDate: e.target.value })}
            error={filters.startDate && filters.endDate && filters.startDate > filters.endDate ? 'Debe ser ≥ fecha inicio' : undefined}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl">
        <Select
          label="Paciente"
          options={allPatientOptions}
          value={filters.patientId ?? ''}
          onChange={e => onChange({ ...filters, patientId: e.target.value || null })}
        />
        <Select
          label="Objetivo"
          options={objectiveOptions}
          value={filters.objectiveFilter}
          onChange={e => onChange({ ...filters, objectiveFilter: e.target.value as PatientObjective | 'ALL' })}
        />
      </div>
    </div>
  );
}
