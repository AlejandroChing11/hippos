'use client';

import { useClinicalParams } from '@/lib/hooks/useClinicalParams';
import { ActivityFactorsForm } from '@/components/settings/ActivityFactorsForm';
import { MifflinCoefficientsForm } from '@/components/settings/MifflinCoefficientsForm';
import { MacroRangesForm } from '@/components/settings/MacroRangesForm';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const {
    activityFactorRows,
    mifflinCoefficientRows,
    macroRangeRows,
    loading,
    error,
    updateParam,
    resetCategory,
    refetch,
  } = useClinicalParams();

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold text-ink">Configuración</h1>
        <div className="py-12 text-center text-sm text-ink-tertiary">Cargando parámetros clínicos…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold text-ink">Configuración</h1>
        <div className="rounded-xl border border-danger/25 bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
          <Button variant="ghost" size="sm" className="ml-3" onClick={refetch}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <header className="space-y-1 border-b border-border/80 pb-6">
        <h1 className="font-heading text-2xl font-bold text-balance text-ink md:text-3xl">Configuración</h1>
        <p className="text-pretty text-sm text-ink-secondary">Parámetros clínicos configurables. Los cambios aplican inmediatamente a nuevos cálculos.</p>
      </header>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info-light px-4 py-3 text-sm text-ink-secondary">
        <svg className="mt-0.5 h-4 w-4 shrink-0 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>
          Los cambios en esta configuración aplican inmediatamente a los <strong>nuevos cálculos</strong>.
          Los cálculos ya guardados conservan los valores con los que fueron calculados (snapshot).
        </p>
      </div>

      {/* Section 1: Activity Factors */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold text-ink">Factores de actividad física</h2>
          <p className="text-sm text-ink-secondary">
            Multiplican el TMB basal para obtener el gasto energético total (TDEE).
            Los labels y descripciones se muestran en el dropdown de la calculadora.
          </p>
        </div>
        {activityFactorRows.length > 0 ? (
          <ActivityFactorsForm rows={activityFactorRows} onUpdate={updateParam} onReset={resetCategory} />
        ) : (
          <EmptyParamsNotice />
        )}
      </section>

      <div className="border-t border-border" />

      {/* Section 2: Mifflin Coefficients */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold text-ink">Coeficientes Mifflin-St Jeor</h2>
          <p className="text-sm text-ink-secondary">
            Valores de la ecuación para calcular el metabolismo basal (TMB) a partir del peso saludable.
          </p>
        </div>
        {mifflinCoefficientRows.length > 0 ? (
          <MifflinCoefficientsForm rows={mifflinCoefficientRows} onUpdate={updateParam} onReset={resetCategory} />
        ) : (
          <EmptyParamsNotice />
        )}
      </section>

      <div className="border-t border-border" />

      {/* Section 3: Macro Ranges */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold text-ink">Rangos objetivo de macronutrientes</h2>
          <p className="text-sm text-ink-secondary">
            Porcentajes de referencia para la distribución calórica. Las barras de progreso en la Fórmula
            se muestran en verde cuando el valor cae dentro del rango definido.
          </p>
        </div>
        {macroRangeRows.length > 0 ? (
          <MacroRangesForm rows={macroRangeRows} onUpdate={updateParam} onReset={resetCategory} />
        ) : (
          <EmptyParamsNotice />
        )}
      </section>
    </div>
  );
}

function EmptyParamsNotice() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/50 px-4 py-8 text-center text-sm text-ink-tertiary">
      No se encontraron parámetros. Ejecuta la migración <code className="text-xs bg-inset px-1 py-0.5 rounded">03-clinical-params.sql</code> en el SQL Editor de Supabase.
    </div>
  );
}
