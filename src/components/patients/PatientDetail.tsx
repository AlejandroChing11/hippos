'use client';

import type { Patient } from '@/lib/types/patient';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ACTIVITY_FACTORS } from '@/lib/constants/activity-factors';
import { OBJECTIVES } from '@/lib/constants/objectives';

interface PatientDetailProps {
  patient: Patient;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-ink-tertiary uppercase tracking-wider">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  );
}

export function PatientDetail({ patient }: PatientDetailProps) {
  return (
    <Card>
      <h3 className="text-lg font-heading font-semibold text-ink mb-4">{patient.fullName}</h3>

      <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Field label="Edad">{patient.age} años</Field>
        <Field label="Sexo">{patient.sex === 'M' ? 'Masculino' : 'Femenino'}</Field>
        <Field label="Peso">{patient.weight} kg</Field>
        <Field label="Talla">{patient.height} cm</Field>
        <Field label="Actividad">{ACTIVITY_FACTORS[patient.activityLevel].label}</Field>
        <Field label="Objetivo">{OBJECTIVES[patient.objective].label}</Field>
      </dl>

      {patient.pathologies.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-ink-tertiary uppercase tracking-wider mb-1.5">Patologías</p>
          <div className="flex flex-wrap gap-1.5">
            {patient.pathologies.map(p => (
              <Badge key={p} variant="warning">{p}</Badge>
            ))}
          </div>
        </div>
      )}

      {patient.foodAllergies.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-ink-tertiary uppercase tracking-wider mb-1.5">Alergias alimentarias</p>
          <div className="flex flex-wrap gap-1.5">
            {patient.foodAllergies.map(a => (
              <Badge key={a} variant="danger">{a}</Badge>
            ))}
          </div>
        </div>
      )}

      {patient.notes && (
        <div className="mt-4">
          <p className="text-xs font-medium text-ink-tertiary uppercase tracking-wider mb-1">Notas</p>
          <p className="text-sm text-ink-secondary whitespace-pre-wrap">{patient.notes}</p>
        </div>
      )}
    </Card>
  );
}
