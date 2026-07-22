'use client';

import { useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { WeightGoalsTimeline } from '@/components/plan-generator/WeightGoalsTimeline';
import { TemplateSlideSelector } from '@/components/plan-generator/TemplateSlideSelector';
import { generateWeightGoals } from '@/lib/utils/weight-goals';
import type { WeightGoal } from '@/lib/supabase/types';
import type { PatientObjective } from '@/lib/types/patient';

interface Props {
  patientWeight: number;
  patientObjective: PatientObjective;
  objectiveText: string;
  onObjectiveTextChange: (text: string) => void;
  durationMonths: number;
  onDurationChange: (months: number) => void;
  weightLossPerMonth: number;
  onWeightLossChange: (loss: number) => void;
  weightGoals: WeightGoal[];
  onWeightGoalsChange: (goals: WeightGoal[]) => void;
  selectedTemplateIds: string[];
  onTemplateIdsChange: (ids: string[]) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isValid: boolean;
}

export function PlanConfigForm({
  patientWeight,
  patientObjective,
  objectiveText,
  onObjectiveTextChange,
  durationMonths,
  onDurationChange,
  weightLossPerMonth,
  onWeightLossChange,
  weightGoals,
  onWeightGoalsChange,
  selectedTemplateIds,
  onTemplateIdsChange,
  onGenerate,
  isGenerating,
  isValid,
}: Props) {
  const isWeightLoss = patientObjective === 'WEIGHT_LOSS';

  const handleDurationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) onDurationChange(Math.max(1, Math.min(12, val)));
  }, [onDurationChange]);

  const handleLossChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) onWeightLossChange(Math.max(0, Math.min(5, val)));
  }, [onWeightLossChange]);

  const autoGoals = useMemo(() => {
    if (!isWeightLoss) return [];
    return generateWeightGoals(patientWeight, durationMonths, weightLossPerMonth);
  }, [isWeightLoss, patientWeight, durationMonths, weightLossPerMonth]);

  const displayGoals = weightGoals.length > 0 ? weightGoals : autoGoals;

  return (
    <Card padding="md">
      <h2 className="font-heading text-lg font-semibold text-ink mb-4">Configuración del plan</h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-1.5">
            Objetivo del plan
          </label>
          <textarea
            rows={3}
            placeholder="Ej: Reducir el 6% del peso corporal en 3 meses, priorizando la conservación de masa magra..."
            value={objectiveText}
            onChange={e => onObjectiveTextChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-inset text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage transition-colors resize-vertical"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1.5">
              Duración (meses)
            </label>
            <input
              type="number"
              min={1}
              max={12}
              step={1}
              value={durationMonths}
              onChange={handleDurationChange}
              className="w-full px-3 py-2 rounded-lg border border-border bg-inset text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage transition-colors"
            />
          </div>

          {isWeightLoss && (
            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-1.5">
                Pérdida por mes (kg)
              </label>
              <input
                type="number"
                min={0}
                max={5}
                step={0.5}
                value={weightLossPerMonth}
                onChange={handleLossChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-inset text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage transition-colors"
              />
            </div>
          )}
        </div>

        {isWeightLoss && (
          <div>
            <h3 className="text-sm font-medium text-ink-secondary mb-1.5">Timeline de peso</h3>
            <WeightGoalsTimeline goals={displayGoals} onChange={onWeightGoalsChange} />
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-ink-secondary mb-1.5">Slides educativas incluidas</h3>
          <TemplateSlideSelector selectedIds={selectedTemplateIds} onChange={onTemplateIdsChange} />
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={onGenerate}
            disabled={!isValid || isGenerating}
            loading={isGenerating}
            className="w-full sm:w-auto"
          >
            {isGenerating ? 'Generando…' : 'Generar Plan PPTX'}
          </Button>
          {!isValid && (
            <p className="text-xs text-ink-muted mt-1.5">
              Distribui todos los intercambios correctamente antes de generar el plan.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
