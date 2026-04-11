'use client';

import { useMemo, useState } from 'react';
import type { ActivityLevel, Patient } from '@/lib/types/patient';
import type { TmbCalculationInput } from '@/lib/supabase/tmb-calculations';
import type { ActivityFactorParam, MifflinCoefficients } from '@/lib/supabase/types';
import { DEFAULT_MIFFLIN_COEFFICIENTS } from '@/lib/supabase/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { RestrictionInput } from './RestrictionInput';
import { TmbResult } from './TmbResult';
import { calculateTMB, calculateTDEE, calculateTargetCalories } from '@/lib/utils/mifflin';
import { calculateBMI, calculateWeightFromBMI, getBmiCategory } from '@/lib/utils/bmi';
import { formatNumber } from '@/lib/utils/format';
import { ACTIVITY_FACTORS } from '@/lib/constants/activity-factors';
import { OBJECTIVES } from '@/lib/constants/objectives';

interface TmbCalculatorProps {
  patient: Patient;
  onSave: (data: TmbCalculationInput) => void;
  /** Activity factors from DB. Falls back to hardcoded constants when not provided. */
  activityFactors?: ActivityFactorParam[];
  /** Mifflin coefficients from DB. Falls back to standard values when not provided. */
  mifflinCoefficients?: MifflinCoefficients;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-xs text-ink-tertiary mb-0.5">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

export function TmbCalculator({ patient, onSave, activityFactors, mifflinCoefficients }: TmbCalculatorProps) {
  const { weight: currentWeight, height, age, sex, objective } = patient;
  const requiresRestriction = OBJECTIVES[objective].requiresRestriction;
  const [restriction, setRestriction] = useState(0);
  const [targetBmi, setTargetBmi] = useState(22);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(patient.activityLevel);

  // Build activity options from DB params or fallback to constants
  const activityOptions = useMemo(() => {
    if (activityFactors && activityFactors.length > 0) {
      return activityFactors.map(f => ({ value: f.key, label: f.label }));
    }
    return (Object.entries(ACTIVITY_FACTORS) as [ActivityLevel, typeof ACTIVITY_FACTORS[ActivityLevel]][])
      .map(([value, { label }]) => ({ value, label }));
  }, [activityFactors]);

  // Resolve current activity info (factor + label) from DB or fallback
  const activityInfo = useMemo(() => {
    if (activityFactors && activityFactors.length > 0) {
      const found = activityFactors.find(f => f.key === activityLevel);
      return found ? { factor: found.factor, label: found.label } : { factor: ACTIVITY_FACTORS[activityLevel].factor, label: ACTIVITY_FACTORS[activityLevel].label };
    }
    return { factor: ACTIVITY_FACTORS[activityLevel].factor, label: ACTIVITY_FACTORS[activityLevel].label };
  }, [activityFactors, activityLevel]);

  const coefficients = mifflinCoefficients ?? DEFAULT_MIFFLIN_COEFFICIENTS;
  const effectiveTargetBmi = Math.min(24.9, Math.max(18.5, targetBmi));

  const currentBmi = useMemo(() => calculateBMI(currentWeight, height), [currentWeight, height]);
  const bmiCategory = useMemo(() => getBmiCategory(currentBmi), [currentBmi]);
  const healthyWeight = useMemo(() => calculateWeightFromBMI(effectiveTargetBmi, height), [effectiveTargetBmi, height]);
  const weightDiff = useMemo(() => currentWeight - healthyWeight, [currentWeight, healthyWeight]);

  const tmb = useMemo(() => calculateTMB(healthyWeight, height, age, sex, coefficients), [healthyWeight, height, age, sex, coefficients]);
  const tdee = useMemo(() => calculateTDEE(tmb, activityInfo.factor), [tmb, activityInfo.factor]);
  const targetCalories = useMemo(() => calculateTargetCalories(tdee, restriction), [tdee, restriction]);

  const canSave = !requiresRestriction || restriction > 0;
  const targetBmiInvalid = targetBmi < 18.5 || targetBmi > 24.9;

  function handleSave() {
    onSave({
      patientId: patient.id,
      currentWeight,
      height,
      age,
      sex,
      activityLevel,
      activityFactor: activityInfo.factor,
      objective,
      currentBmi,
      targetBmi: effectiveTargetBmi,
      healthyWeight,
      tmb,
      tdee,
      caloricRestriction: restriction,
      targetCalories,
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-heading text-lg font-semibold text-ink mb-4">Datos del paciente</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          <ReadOnlyField label="Peso actual" value={`${formatNumber(currentWeight, 1)} kg`} />
          <ReadOnlyField label="Talla" value={`${height} cm`} />
          <ReadOnlyField label="Edad" value={`${age} años`} />
          <ReadOnlyField label="Sexo" value={sex === 'M' ? 'Masculino' : 'Femenino'} />
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <span className="block text-xs text-ink-tertiary mb-0.5">Objetivo</span>
          <Badge>{OBJECTIVES[objective].label}</Badge>
        </div>
      </Card>

      <Card>
        <h3 className="font-heading text-lg font-semibold text-ink mb-4">Evaluación IMC</h3>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-ink-secondary">IMC actual</span>
            <span className="text-lg font-semibold text-ink tabular-nums">{formatNumber(currentBmi, 1)}</span>
            <Badge variant={bmiCategory.color}>{bmiCategory.label}</Badge>
          </div>
          <div className="max-w-xs">
            <Input
              type="number"
              label="IMC saludable"
              helperText="Rango normal: 18.5 - 24.9"
              min={18.5}
              max={24.9}
              step={0.1}
              value={targetBmi}
              onChange={e => {
                const v = Number(e.target.value);
                setTargetBmi(Number.isFinite(v) ? v : 22);
              }}
              error={targetBmiInvalid ? 'Use un valor entre 18.5 y 24.9' : undefined}
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-2 text-sm">
            <span className="text-ink-secondary">Peso saludable</span>
            <span className="font-semibold text-ink tabular-nums">{formatNumber(healthyWeight, 1)} kg</span>
          </div>
          <p className="text-sm text-ink-secondary">
            Diferencia con peso actual:{' '}
            <span className={`font-medium tabular-nums ${weightDiff > 0 ? 'text-warning' : weightDiff < 0 ? 'text-info' : 'text-ink'}`}>
              {weightDiff >= 0 ? '+' : ''}{formatNumber(weightDiff, 1)} kg
            </span>
          </p>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="font-heading text-lg font-semibold text-ink">Cálculo energético</h3>
        <div className="max-w-md">
          <Select
            label="Factor de actividad"
            options={activityOptions}
            value={activityLevel}
            onChange={e => setActivityLevel(e.target.value as ActivityLevel)}
          />
        </div>
        <TmbResult
          healthyWeight={healthyWeight}
          height={height}
          age={age}
          sex={sex}
          tmb={tmb}
          activityLabel={activityInfo.label}
          activityFactor={activityInfo.factor}
          tdee={tdee}
          restriction={restriction}
          targetCalories={targetCalories}
        >
          <div className="pt-2 space-y-2">
            <p className="text-xs font-medium text-ink-tertiary uppercase tracking-wider">Restricción calórica</p>
            <div className="max-w-xs">
              <RestrictionInput value={restriction} onChange={setRestriction} required={requiresRestriction} />
              {requiresRestriction && restriction === 0 && (
                <p className="mt-2 text-xs text-warning">El objetivo de pérdida de peso requiere una restricción calórica.</p>
              )}
            </div>
          </div>
        </TmbResult>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!canSave || targetBmiInvalid} size="lg">
          Guardar y continuar a Fórmula
        </Button>
      </div>
    </div>
  );
}
