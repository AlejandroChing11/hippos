'use client';

import { Suspense, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Patient } from '@/lib/types/patient';
import type { TmbCalculation } from '@/lib/types/tmb';
import type { FormulaSession } from '@/lib/types/formula';
import { getTmbCalculationById } from '@/lib/supabase/tmb-calculations';
import { getPatientById } from '@/lib/supabase/patients';
import { getFormulaSessionById } from '@/lib/supabase/formula-sessions';
import { useMealDistribution, useUpsertMealDistribution } from '@/lib/hooks/useMealDistribution';
import { useCreateGeneratedPlan } from '@/lib/hooks/useGeneratedPlans';
import { EXCHANGE_SUMMARY_GROUPS } from '@/lib/constants/exchange-summary-groups';
import { MealDistributionTable } from '@/components/meal-distribution/MealDistributionTable';
import { PlanConfigForm } from '@/components/meal-distribution/PlanConfigForm';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { formatKcal } from '@/lib/utils/format';
import { generateWeightGoals } from '@/lib/utils/weight-goals';
import type { WeightGoal, MealTimeAllocation } from '@/lib/supabase/types';

type DistributionMap = Record<string, Record<string, number>>;

function createEmptyDistribution(): DistributionMap {
  const map: DistributionMap = {};
  for (const group of EXCHANGE_SUMMARY_GROUPS) {
    map[group.id] = {};
  }
  return map;
}

function computeSummaryTotals(session: FormulaSession): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const entry of session.exchanges) {
    const group = EXCHANGE_SUMMARY_GROUPS.find(g => g.subgroupIds.includes(entry.subgroupId));
    if (group) {
      totals[group.id] = (totals[group.id] ?? 0) + entry.exchanges;
    }
  }
  for (const group of EXCHANGE_SUMMARY_GROUPS) {
    totals[group.id] = Math.round((totals[group.id] ?? 0) * 10) / 10;
  }
  return totals;
}

function areAllRowsValid(
  summaryTotals: Record<string, number>,
  distribution: DistributionMap,
): boolean {
  const mealTimes = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner'];
  for (const group of EXCHANGE_SUMMARY_GROUPS) {
    const total = summaryTotals[group.id] ?? 0;
    if (total === 0) continue;
    const rowSum = mealTimes.reduce(
      (sum, t) => sum + (distribution[group.id]?.[t] ?? 0),
      0,
    );
    if (Math.abs(Math.round((rowSum - total) * 10) / 10) > 0.001) return false;
  }
  return true;
}

function MealPlanContent() {
  const searchParams = useSearchParams();
  const fsId = searchParams.get('formulaSessionId');
  const { toast } = useToast();

  const [tmb, setTmb] = useState<TmbCalculation | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [session, setSession] = useState<FormulaSession | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const { distribution: existingDist } = useMealDistribution(fsId ?? undefined);
  const { upsert } = useUpsertMealDistribution();
  const { create: createPlan } = useCreateGeneratedPlan();

  const [distribution, setDistribution] = useState<DistributionMap>(createEmptyDistribution());

  const [objectiveText, setObjectiveText] = useState('');
  const [durationMonths, setDurationMonths] = useState(3);
  const [weightLossPerMonth, setWeightLossPerMonth] = useState(2.0);
  const [weightGoals, setWeightGoals] = useState<WeightGoal[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!fsId) { setDataLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const sessionData = await getFormulaSessionById(fsId);
        if (cancelled) return;
        if (!sessionData) { setDataLoading(false); return; }
        setSession(sessionData);

        const tmbData = await getTmbCalculationById(sessionData.tmbCalculationId);
        if (cancelled) return;
        setTmb(tmbData);

        if (tmbData) {
          const pat = await getPatientById(tmbData.patientId);
          if (!cancelled) setPatient(pat);
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fsId]);

  useEffect(() => {
    if (existingDist?.distribution) {
      const map: DistributionMap = {};
      for (const [groupId, alloc] of Object.entries(existingDist.distribution)) {
        map[groupId] = { ...alloc };
      }
      for (const group of EXCHANGE_SUMMARY_GROUPS) {
        if (!map[group.id]) map[group.id] = {};
      }
      setDistribution(map);
    }
  }, [existingDist]);

  const summaryTotals = useMemo(
    () => session ? computeSummaryTotals(session) : ({} as Record<string, number>),
    [session],
  );

  const isValid = useMemo(
    () => areAllRowsValid(summaryTotals, distribution),
    [summaryTotals, distribution],
  );

  const handleDistributionChange = useCallback((groupId: string, timeKey: string, value: number) => {
    setDistribution(prev => ({
      ...prev,
      [groupId]: { ...prev[groupId], [timeKey]: value },
    }));
  }, []);

  useEffect(() => {
    if (!fsId || !patient || !session) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const flatDist: Record<string, MealTimeAllocation> = {};
    for (const group of EXCHANGE_SUMMARY_GROUPS) {
      const row = distribution[group.id];
      if (!row) continue;
      flatDist[group.id] = {
        breakfast: row.breakfast ?? 0,
        morningSnack: row.morningSnack ?? 0,
        lunch: row.lunch ?? 0,
        afternoonSnack: row.afternoonSnack ?? 0,
        dinner: row.dinner ?? 0,
      };
    }

    const mealTimes = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner'];
    const allComplete = EXCHANGE_SUMMARY_GROUPS.every(group => {
      const total = summaryTotals[group.id] ?? 0;
      if (total === 0) return true;
      const rowSum = mealTimes.reduce((sum, t) => sum + (distribution[group.id]?.[t] ?? 0), 0);
      return Math.abs(Math.round((rowSum - total) * 10) / 10) < 0.001;
    });

    if (!allComplete) return;

    debounceRef.current = setTimeout(async () => {
      try {
        await upsert({
          formula_session_id: session.id,
          patient_id: patient.id,
          distribution: flatDist,
        });
      } catch {
        // Debounce save silently fails — user will see error on generate
      }
    }, 500);
  }, [distribution, fsId, patient, session, summaryTotals, upsert]);

  const handleGenerate = useCallback(async () => {
    if (!patient || !session || !tmb || !fsId) return;

    setIsGenerating(true);
    try {
      const flatDist: Record<string, MealTimeAllocation> = {};
      for (const group of EXCHANGE_SUMMARY_GROUPS) {
        const row = distribution[group.id];
        if (!row) continue;
        flatDist[group.id] = {
          breakfast: row.breakfast ?? 0,
          morningSnack: row.morningSnack ?? 0,
          lunch: row.lunch ?? 0,
          afternoonSnack: row.afternoonSnack ?? 0,
          dinner: row.dinner ?? 0,
        };
      }

      const saved = await upsert({
        formula_session_id: session.id,
        patient_id: patient.id,
        distribution: flatDist,
      });

      const finalGoals = weightGoals.length > 0
        ? weightGoals
        : (patient.objective === 'WEIGHT_LOSS'
          ? generateWeightGoals(patient.weight, durationMonths, weightLossPerMonth)
          : []);

      const plan = await createPlan({
        patient_id: patient.id,
        formula_session_id: session.id,
        meal_distribution_id: saved.id,
        plan_title: `Plan — ${patient.fullName}`,
        objective_text: objectiveText,
        duration_months: durationMonths,
        weight_loss_per_month: weightLossPerMonth,
        weight_goals: finalGoals,
        template_slide_ids: selectedTemplateIds,
      });

      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          formulaSessionId: session.id,
          mealDistributionId: saved.id,
          planTitle: `Plan — ${patient.fullName}`,
          objectiveText,
          durationMonths,
          weightLossPerMonth,
          weightGoals: finalGoals,
          templateSlideIds: selectedTemplateIds,
        }),
      });

      if (!res.ok) throw new Error('Error al generar el PPTX');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plan-${patient.fullName.replace(/\s+/g, '-').toLowerCase()}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast('Plan generado correctamente');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al generar el plan', 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [patient, session, tmb, fsId, distribution, upsert, createPlan, objectiveText, durationMonths, weightLossPerMonth, weightGoals, selectedTemplateIds, toast]);

  if (dataLoading) {
    return <div className="py-12 text-center text-sm text-ink-tertiary">Cargando plan…</div>;
  }

  if (!fsId || !patient || !session || !tmb) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-inset">
          <svg className="h-7 w-7 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
            <circle cx="12" cy="11" r="7" />
            <path d="M12 8v6M9 11h6" strokeLinecap="round" />
            <path d="M5 20h4m2 0h4m2 0h2" strokeLinecap="round" />
            <path d="M7 19.5v1a1.5 1.5 0 001.5 1.5h7a1.5 1.5 0 001.5-1.5v-1" />
          </svg>
        </div>
        <p className="max-w-sm text-pretty text-sm text-ink-secondary">
          Guardá una fórmula primero desde la página de Fórmula para acceder al plan de comidas.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 pb-12">
      <header className="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="font-heading text-2xl font-bold text-balance text-ink md:text-3xl">
            Plan de comidas — {patient.fullName}
          </h1>
          <p className="text-pretty text-sm text-ink-secondary">
            {formatKcal(tmb.targetCalories)} objetivo · Distribui los intercambios por comida.
          </p>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-ink">Distribución por comidas</h2>
        <Card padding="md">
          <MealDistributionTable
            summaryTotals={summaryTotals}
            distribution={distribution}
            onChange={handleDistributionChange}
          />
        </Card>
      </section>

      <section className="space-y-4">
        <PlanConfigForm
          patientWeight={patient.weight}
          patientObjective={patient.objective}
          objectiveText={objectiveText}
          onObjectiveTextChange={setObjectiveText}
          durationMonths={durationMonths}
          onDurationChange={setDurationMonths}
          weightLossPerMonth={weightLossPerMonth}
          onWeightLossChange={setWeightLossPerMonth}
          weightGoals={weightGoals}
          onWeightGoalsChange={setWeightGoals}
          selectedTemplateIds={selectedTemplateIds}
          onTemplateIdsChange={setSelectedTemplateIds}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          isValid={isValid}
        />
      </section>
    </div>
  );
}

export default function MealPlanPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-ink-tertiary">Cargando…</div>}>
      <MealPlanContent />
    </Suspense>
  );
}
