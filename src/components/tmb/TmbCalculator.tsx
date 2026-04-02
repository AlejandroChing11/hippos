'use client';

import { useMemo, useState } from 'react';
import type { Patient } from '@/lib/types/patient';
import type { TmbCalculation } from '@/lib/types/tmb';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RestrictionInput } from './RestrictionInput';
import { TmbResult } from './TmbResult';
import { calculateTMB, calculateTDEE, calculateTargetCalories } from '@/lib/utils/mifflin';
import { generateId } from '@/lib/utils/slug';
import { ACTIVITY_FACTORS } from '@/lib/constants/activity-factors';
import { OBJECTIVES } from '@/lib/constants/objectives';

interface TmbCalculatorProps {
  patient: Patient;
  onSave: (calc: TmbCalculation) => void;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-xs text-ink-tertiary mb-0.5">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

export function TmbCalculator({ patient, onSave }: TmbCalculatorProps) {
  const { weight, height, age, sex, activityLevel, objective } = patient;
  const requiresRestriction = OBJECTIVES[objective].requiresRestriction;
  const [restriction, setRestriction] = useState(0);

  const activityInfo = ACTIVITY_FACTORS[activityLevel];

  const tmb = useMemo(() => calculateTMB(weight, height, age, sex), [weight, height, age, sex]);
  const tdee = useMemo(() => calculateTDEE(tmb, activityInfo.factor), [tmb, activityInfo.factor]);
  const targetCalories = useMemo(() => calculateTargetCalories(tdee, restriction), [tdee, restriction]);

  const canSave = !requiresRestriction || restriction > 0;

  function handleSave() {
    const calc: TmbCalculation = {
      id: generateId(),
      patientId: patient.id,
      weight,
      height,
      age,
      sex,
      activityLevel,
      activityFactor: activityInfo.factor,
      objective,
      tmb,
      tdee,
      caloricRestriction: restriction,
      targetCalories,
      createdAt: new Date().toISOString(),
    };
    onSave(calc);
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-heading text-lg font-semibold text-ink mb-4">Datos del paciente</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <ReadOnlyField label="Peso" value={`${weight} kg`} />
          <ReadOnlyField label="Talla" value={`${height} cm`} />
          <ReadOnlyField label="Edad" value={`${age} años`} />
          <ReadOnlyField label="Sexo" value={sex === 'M' ? 'Masculino' : 'Femenino'} />
          <ReadOnlyField label="Nivel de actividad" value={activityInfo.label} />
          <div>
            <span className="block text-xs text-ink-tertiary mb-0.5">Objetivo</span>
            <Badge>{OBJECTIVES[objective].label}</Badge>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-heading text-lg font-semibold text-ink mb-4">Restricción calórica</h3>
        <div className="max-w-xs">
          <RestrictionInput
            value={restriction}
            onChange={setRestriction}
            required={requiresRestriction}
          />
          {requiresRestriction && restriction === 0 && (
            <p className="mt-2 text-xs text-warning">
              El objetivo de pérdida de peso requiere una restricción calórica.
            </p>
          )}
        </div>
      </Card>

      <TmbResult
        tmb={tmb}
        activityLabel={activityInfo.label}
        activityFactor={activityInfo.factor}
        tdee={tdee}
        restriction={restriction}
        targetCalories={targetCalories}
      />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!canSave} size="lg">
          Guardar cálculo y continuar
        </Button>
      </div>
    </div>
  );
}
