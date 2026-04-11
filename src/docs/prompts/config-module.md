# Hippos — Módulo Configuración de Parámetros Clínicos

```
ESTA ES UNA SESION LONG AUTONOMOUS RUNNING AGENTIC CODING SESSION, NO TIEMPO LIMITE.
```

---

## Contexto

Hippos ya está en producción con Supabase (schema `hippos`). Actualmente los factores de actividad física y los coeficientes de la fórmula Mifflin-St Jeor están hardcodeados como constantes en el código:

```typescript
// src/lib/constants/activity-factors.ts (ACTUAL — HARDCODED)
SEDENTARY:          { factor: 1.2 }
LIGHTLY_ACTIVE:     { factor: 1.375 }
MODERATELY_ACTIVE:  { factor: 1.55 }
VERY_ACTIVE:        { factor: 1.725 }
EXTREMELY_ACTIVE:   { factor: 1.9 }

// src/lib/utils/mifflin.ts (ACTUAL — HARDCODED)
// Hombres: (10 × peso) + (6.25 × altura) − (5 × edad) + 5
// Mujeres: (10 × peso) + (6.25 × altura) − (5 × edad) − 161
```

**Problema:** La nutricionista necesita poder ajustar estos valores según actualizaciones de guías clínicas o criterio profesional sin depender de un deploy. Si una guía nueva dice que "Moderadamente activo" debe ser 1.6 en vez de 1.55, ella debería poder cambiarlo desde la app.

**Solución:** Mover estos magic numbers a una tabla de configuración en Supabase y crear un módulo de admin para editarlos.

---

## Alcance de lo configurable

Estos son los parámetros que pasan de código a base de datos:

### 1. Factores de actividad física (5 registros)
| key | label | description | factor |
|---|---|---|---|
| SEDENTARY | Sedentario | Poco o nada de ejercicio | 1.2 |
| LIGHTLY_ACTIVE | Ligeramente activo | Ejercicio 1-3 días/semana | 1.375 |
| MODERATELY_ACTIVE | Moderadamente activo | Ejercicio 3-5 días/semana | 1.55 |
| VERY_ACTIVE | Muy activo | Ejercicio 6-7 días/semana | 1.725 |
| EXTREMELY_ACTIVE | Extremadamente activo | Atleta / trabajo físico intenso | 1.9 |

### 2. Coeficientes Mifflin-St Jeor (5 registros)
| key | label | default_value | description |
|---|---|---|---|
| WEIGHT_COEFFICIENT | Coeficiente peso | 10 | Multiplica al peso en kg |
| HEIGHT_COEFFICIENT | Coeficiente talla | 6.25 | Multiplica a la talla en cm |
| AGE_COEFFICIENT | Coeficiente edad | 5 | Multiplica a la edad (se resta) |
| MALE_CONSTANT | Constante masculina | 5 | Se suma para hombres |
| FEMALE_CONSTANT | Constante femenina | -161 | Se suma para mujeres (negativo) |

### 3. Rangos objetivo de macronutrientes (3 registros)
| key | label | min_value | max_value |
|---|---|---|---|
| CARBS_RANGE | Carbohidratos | 45 | 65 |
| FAT_RANGE | Grasas | 0 | 35 |
| PROTEIN_RANGE | Proteínas | 25 | 100 |

---

## SQL — Migración

Ejecutar en el SQL Editor de Supabase. Crea la tabla + seed con valores por defecto.

```sql
-- ============================================================
-- MIGRACIÓN: Tabla de parámetros clínicos configurables
-- Schema: hippos
-- ============================================================

SET search_path TO hippos;

-- ────────────────────────────────────────────────────────────
-- ENUM: categoría del parámetro
-- ────────────────────────────────────────────────────────────

CREATE TYPE hippos.param_category AS ENUM (
  'ACTIVITY_FACTOR',
  'MIFFLIN_COEFFICIENT',
  'MACRO_RANGE'
);

-- ────────────────────────────────────────────────────────────
-- TABLA: clinical_params
-- ────────────────────────────────────────────────────────────
-- Una sola tabla para todos los parámetros configurables.
-- category + key forman la clave lógica de negocio.
-- Cada parámetro tiene hasta 2 valores numéricos (value, max_value)
-- para cubrir tanto valores simples (factor: 1.55) como rangos (min: 45, max: 65).
-- ────────────────────────────────────────────────────────────

CREATE TABLE hippos.clinical_params (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    hippos.param_category NOT NULL,
  key         TEXT        NOT NULL,
  label       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  value       NUMERIC(8,4) NOT NULL,              -- valor principal (factor, coeficiente, o min de rango)
  max_value   NUMERIC(8,4),                       -- solo para MACRO_RANGE: límite superior del rango
  sort_order  INT         NOT NULL DEFAULT 0,      -- orden de presentación en la UI
  is_active   BOOLEAN     NOT NULL DEFAULT true,   -- para desactivar sin borrar
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_clinical_params_category_key UNIQUE (category, key)
);

COMMENT ON TABLE hippos.clinical_params IS 'Parámetros clínicos configurables: factores de actividad, coeficientes Mifflin, rangos de macros';
COMMENT ON COLUMN hippos.clinical_params.value IS 'Valor principal: factor de actividad, coeficiente Mifflin, o mínimo de rango de macros';
COMMENT ON COLUMN hippos.clinical_params.max_value IS 'Solo para MACRO_RANGE: límite superior del porcentaje. NULL para las demás categorías';
COMMENT ON COLUMN hippos.clinical_params.sort_order IS 'Orden de presentación en la UI de configuración';

-- ────────────────────────────────────────────────────────────
-- ÍNDICES
-- ────────────────────────────────────────────────────────────

CREATE INDEX idx_clinical_params_category ON hippos.clinical_params (category, sort_order);

-- ────────────────────────────────────────────────────────────
-- TRIGGER: updated_at automático
-- ────────────────────────────────────────────────────────────

CREATE TRIGGER set_clinical_params_updated_at
  BEFORE UPDATE ON hippos.clinical_params
  FOR EACH ROW EXECUTE FUNCTION hippos.trigger_set_updated_at();

-- ────────────────────────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────────────────────────

ALTER TABLE hippos.clinical_params ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinical_params_all_access" ON hippos.clinical_params
  FOR ALL USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- SEED: Valores por defecto
-- ────────────────────────────────────────────────────────────

-- Factores de actividad física
INSERT INTO hippos.clinical_params (category, key, label, description, value, max_value, sort_order) VALUES
  ('ACTIVITY_FACTOR', 'SEDENTARY',          'Sedentario',            'Poco o nada de ejercicio',           1.2,    NULL, 1),
  ('ACTIVITY_FACTOR', 'LIGHTLY_ACTIVE',     'Ligeramente activo',    'Ejercicio 1-3 días/semana',          1.375,  NULL, 2),
  ('ACTIVITY_FACTOR', 'MODERATELY_ACTIVE',  'Moderadamente activo',  'Ejercicio 3-5 días/semana',          1.55,   NULL, 3),
  ('ACTIVITY_FACTOR', 'VERY_ACTIVE',        'Muy activo',            'Ejercicio 6-7 días/semana',          1.725,  NULL, 4),
  ('ACTIVITY_FACTOR', 'EXTREMELY_ACTIVE',   'Extremadamente activo', 'Atleta / trabajo físico intenso',    1.9,    NULL, 5);

-- Coeficientes Mifflin-St Jeor
INSERT INTO hippos.clinical_params (category, key, label, description, value, max_value, sort_order) VALUES
  ('MIFFLIN_COEFFICIENT', 'WEIGHT_COEFFICIENT', 'Coeficiente peso',      'Multiplica al peso en kg',                    10,    NULL, 1),
  ('MIFFLIN_COEFFICIENT', 'HEIGHT_COEFFICIENT', 'Coeficiente talla',     'Multiplica a la talla en cm',                 6.25,  NULL, 2),
  ('MIFFLIN_COEFFICIENT', 'AGE_COEFFICIENT',    'Coeficiente edad',      'Multiplica a la edad en años (se resta)',      5,    NULL, 3),
  ('MIFFLIN_COEFFICIENT', 'MALE_CONSTANT',      'Constante masculina',   'Se suma al resultado para hombres',            5,    NULL, 4),
  ('MIFFLIN_COEFFICIENT', 'FEMALE_CONSTANT',    'Constante femenina',    'Se suma al resultado para mujeres (negativo)', -161, NULL, 5);

-- Rangos objetivo de macronutrientes (% del total calórico)
INSERT INTO hippos.clinical_params (category, key, label, description, value, max_value, sort_order) VALUES
  ('MACRO_RANGE', 'CARBS_RANGE',   'Carbohidratos', 'Rango porcentual objetivo de carbohidratos', 45, 65,  1),
  ('MACRO_RANGE', 'FAT_RANGE',     'Grasas',        'Rango porcentual objetivo de grasas',          0, 35,  2),
  ('MACRO_RANGE', 'PROTEIN_RANGE', 'Proteínas',     'Rango porcentual objetivo de proteínas',      25, 100, 3);
```

---

## Arquitectura de archivos

### Archivos NUEVOS a crear

```
src/
├── lib/
│   ├── supabase/
│   │   └── clinical-params.ts        # CRUD de clinical_params
│   └── hooks/
│       └── useClinicalParams.ts      # Hook React para configuración
│
├── components/
│   └── settings/
│       ├── ActivityFactorsForm.tsx    # Formulario para factores de actividad
│       ├── MifflinCoefficientsForm.tsx # Formulario para coeficientes Mifflin
│       ├── MacroRangesForm.tsx        # Formulario para rangos de macros
│       └── ParamResetButton.tsx       # Botón restaurar valores por defecto
│
└── app/(dashboard)/
    └── settings/
        └── page.tsx                   # Módulo 5: Configuración
```

### Archivos a MODIFICAR

```
src/
├── lib/
│   ├── supabase/
│   │   └── types.ts                  # Agregar tipos de clinical_params
│   ├── constants/
│   │   └── activity-factors.ts       # Convertir a valores por defecto (fallback)
│   └── utils/
│       └── mifflin.ts                # Recibir coeficientes como parámetro
│
├── components/
│   └── layout/
│       └── Sidebar.tsx               # Agregar nav item "Configuración"
│
└── app/(dashboard)/
    ├── calculator/page.tsx           # Leer factores y coeficientes de DB
    └── formula/page.tsx              # Leer rangos de macros de DB
```

---

## Tipos

```typescript
// Agregar a src/lib/supabase/types.ts

// ─── clinical_params ───

export type ParamCategory = 'ACTIVITY_FACTOR' | 'MIFFLIN_COEFFICIENT' | 'MACRO_RANGE';

export interface DbClinicalParam {
  id: string;
  category: ParamCategory;
  key: string;
  label: string;
  description: string;
  value: number;
  max_value: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DbClinicalParamUpdate = Pick<DbClinicalParam, 'value' | 'max_value' | 'label' | 'description'>;

// Tipos de negocio derivados (lo que consumen los componentes)

export interface ActivityFactorParam {
  key: string;          // 'SEDENTARY', 'LIGHTLY_ACTIVE', etc.
  label: string;
  description: string;
  factor: number;       // mapped from value
}

export interface MifflinCoefficients {
  weightCoefficient: number;   // default 10
  heightCoefficient: number;   // default 6.25
  ageCoefficient: number;      // default 5
  maleConstant: number;        // default 5
  femaleConstant: number;      // default -161
}

export interface MacroRange {
  key: string;          // 'CARBS_RANGE', 'FAT_RANGE', 'PROTEIN_RANGE'
  label: string;
  min: number;          // mapped from value
  max: number;          // mapped from max_value
}
```

---

## Servicio

```typescript
// src/lib/supabase/clinical-params.ts
import { supabase } from './client';

// ─── Lectura por categoría ───

export async function getParamsByCategory(category: ParamCategory): Promise<DbClinicalParam[]> {
  const { data, error } = await supabase
    .from('clinical_params')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(row => ({
    ...row,
    value: Number(row.value),
    max_value: row.max_value !== null ? Number(row.max_value) : null,
  }));
}

// ─── Funciones tipadas para cada categoría ───

// Retorna los factores de actividad como los espera el calculador TMB
export async function getActivityFactors(): Promise<ActivityFactorParam[]> {
  const rows = await getParamsByCategory('ACTIVITY_FACTOR');
  return rows.map(row => ({
    key: row.key,
    label: row.label,
    description: row.description,
    factor: row.value,
  }));
}

// Retorna los coeficientes Mifflin como objeto plano
export async function getMifflinCoefficients(): Promise<MifflinCoefficients> {
  const rows = await getParamsByCategory('MIFFLIN_COEFFICIENT');

  // Construir objeto desde los rows
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));

  return {
    weightCoefficient: map['WEIGHT_COEFFICIENT'] ?? 10,
    heightCoefficient: map['HEIGHT_COEFFICIENT'] ?? 6.25,
    ageCoefficient: map['AGE_COEFFICIENT'] ?? 5,
    maleConstant: map['MALE_CONSTANT'] ?? 5,
    femaleConstant: map['FEMALE_CONSTANT'] ?? -161,
  };
}

// Retorna los rangos de macros
export async function getMacroRanges(): Promise<MacroRange[]> {
  const rows = await getParamsByCategory('MACRO_RANGE');
  return rows.map(row => ({
    key: row.key,
    label: row.label,
    min: row.value,
    max: row.max_value ?? 100,
  }));
}

// ─── Actualización de un parámetro ───

export async function updateClinicalParam(
  id: string,
  updates: DbClinicalParamUpdate
): Promise<DbClinicalParam> {
  const { data, error } = await supabase
    .from('clinical_params')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    value: Number(data.value),
    max_value: data.max_value !== null ? Number(data.max_value) : null,
  };
}

// ─── Restaurar valores por defecto ───
// Reescribe todos los registros de una categoría con los defaults hardcodeados
// Útil si la nutricionista quiere volver a los valores originales

export async function resetCategoryToDefaults(category: ParamCategory): Promise<void> {
  // Los defaults están en el SEED del SQL — aquí los repetimos como fallback
  const DEFAULTS: Record<ParamCategory, { key: string; value: number; max_value: number | null }[]> = {
    ACTIVITY_FACTOR: [
      { key: 'SEDENTARY', value: 1.2, max_value: null },
      { key: 'LIGHTLY_ACTIVE', value: 1.375, max_value: null },
      { key: 'MODERATELY_ACTIVE', value: 1.55, max_value: null },
      { key: 'VERY_ACTIVE', value: 1.725, max_value: null },
      { key: 'EXTREMELY_ACTIVE', value: 1.9, max_value: null },
    ],
    MIFFLIN_COEFFICIENT: [
      { key: 'WEIGHT_COEFFICIENT', value: 10, max_value: null },
      { key: 'HEIGHT_COEFFICIENT', value: 6.25, max_value: null },
      { key: 'AGE_COEFFICIENT', value: 5, max_value: null },
      { key: 'MALE_CONSTANT', value: 5, max_value: null },
      { key: 'FEMALE_CONSTANT', value: -161, max_value: null },
    ],
    MACRO_RANGE: [
      { key: 'CARBS_RANGE', value: 45, max_value: 65 },
      { key: 'FAT_RANGE', value: 0, max_value: 35 },
      { key: 'PROTEIN_RANGE', value: 25, max_value: 100 },
    ],
  };

  const defaults = DEFAULTS[category];
  for (const def of defaults) {
    const { error } = await supabase
      .from('clinical_params')
      .update({ value: def.value, max_value: def.max_value })
      .eq('category', category)
      .eq('key', def.key);

    if (error) throw error;
  }
}
```

---

## Hook

```typescript
// src/lib/hooks/useClinicalParams.ts
//
// Hook que carga los 3 tipos de parámetros clínicos.
// Los componentes que necesiten solo UNA categoría pueden desestructurar.
//
// Retorna:
// {
//   activityFactors: ActivityFactorParam[]   — para dropdown de /calculator
//   mifflinCoefficients: MifflinCoefficients — para calculateTMB en /calculator
//   macroRanges: MacroRange[]                — para indicadores en /formula
//   loading: boolean
//   error: string | null
//   updateParam: (id, updates) => Promise<void>
//   resetCategory: (category) => Promise<void>
//   refetch: () => Promise<void>
// }
//
// Fetch inicial carga las 3 categorías en paralelo con Promise.all.
// updateParam llama al servicio y luego refetch.
// resetCategory llama a resetCategoryToDefaults y luego refetch.
```

---

## Cambios en la lógica de cálculo

### mifflin.ts — Recibir coeficientes como parámetro

```typescript
// src/lib/utils/mifflin.ts

// ANTES (hardcoded):
// function calculateTMB(weight, height, age, sex) {
//   const base = (10 * weight) + (6.25 * height) - (5 * age);
//   return sex === 'M' ? base + 5 : base - 161;
// }

// DESPUÉS (configurable):
function calculateTMB(
  weight: number,
  height: number,
  age: number,
  sex: 'M' | 'F',
  coefficients: MifflinCoefficients
): number {
  const base =
    (coefficients.weightCoefficient * weight) +
    (coefficients.heightCoefficient * height) -
    (coefficients.ageCoefficient * age);

  return sex === 'M'
    ? base + coefficients.maleConstant
    : base + coefficients.femaleConstant;
}

// calculateTDEE no cambia — ya recibe activityFactor como parámetro
// calculateTargetCalories no cambia — ya recibe restriction como parámetro
```

**IMPORTANTE:** La firma de `calculateTMB` cambia. Todos los call sites deben actualizarse para pasar `coefficients`.

### activity-factors.ts — Convertir a fallback

```typescript
// src/lib/constants/activity-factors.ts

// ANTES: fuente de verdad
// DESPUÉS: solo fallback si la DB no responde

// Mantener el objeto como está, pero exportarlo como DEFAULT_ACTIVITY_FACTORS
// Los componentes lo usan solo si useClinicalParams.loading === true o error !== null
export const DEFAULT_ACTIVITY_FACTORS = { /* ... valores actuales ... */ };
```

---

## Cambios en los módulos existentes

### /calculator/page.tsx

```typescript
// 1. Importar hook
const { activityFactors, mifflinCoefficients, loading: paramsLoading } = useClinicalParams();

// 2. El dropdown de actividad física ahora lee de activityFactors (DB) en vez de ACTIVITY_FACTORS (constante)
//    Mientras paramsLoading === true, mostrar skeleton en el dropdown
//    Si hay error, usar DEFAULT_ACTIVITY_FACTORS como fallback

// 3. Al calcular TMB, pasar coefficients:
const tmb = calculateTMB(healthyWeight, height, age, sex, mifflinCoefficients);

// 4. Al guardar TmbCalculation, el activity_factor viene de activityFactors.find(f => f.key === selectedLevel).factor
//    Ya NO viene de la constante hardcodeada
```

### /formula/page.tsx

```typescript
// 1. Importar hook
const { macroRanges, loading: paramsLoading } = useClinicalParams();

// 2. Los indicadores visuales de distribución de macros (verde/amarillo/rojo)
//    ahora leen los rangos de macroRanges en vez de hardcoded 45-65, ≤35, ≥25
//    Ejemplo:
//    const carbsRange = macroRanges.find(r => r.key === 'CARBS_RANGE');
//    const isInRange = carbsPercent >= carbsRange.min && carbsPercent <= carbsRange.max;
```

---

## Módulo 5: Configuración (`/settings`)

### Sidebar — agregar quinto módulo

```
Pacientes        → /patients
Cálculo TMB      → /calculator
Fórmula          → /formula
Historial        → /reports
Configuración    → /settings        ← NUEVO
```

Icono sugerido: engranaje (gear/cog).

### Vista principal

La página se divide en 3 secciones con tarjetas colapsables o tabs:

#### Sección 1: Factores de actividad física (`ActivityFactorsForm`)

Tabla editable con 5 filas:

| Nivel | Descripción | Factor | Acciones |
|---|---|---|---|
| Sedentario | [input text editable] | [input number step=0.001] | — |
| Ligeramente activo | [input text editable] | [input number step=0.001] | — |
| ... | ... | ... | — |

- Los inputs de factor deben tener: step=0.001, min=1.0, max=3.0
- Las labels y descriptions son editables (para que la nutricionista personalice la redacción)
- Al perder foco o presionar Enter en un input → guardar automáticamente (auto-save con debounce 500ms)
- Feedback visual: checkmark verde cuando se guarda, borde rojo si hay error
- Botón "Restaurar valores por defecto" al final → confirmar con ConfirmDialog → `resetCategory('ACTIVITY_FACTOR')`

#### Sección 2: Coeficientes Mifflin-St Jeor (`MifflinCoefficientsForm`)

Formulario vertical con 5 campos:

- **Coeficiente peso** (default: 10) — input number, step=0.01, min=0.1, max=50
- **Coeficiente talla** (default: 6.25) — input number, step=0.01, min=0.1, max=50
- **Coeficiente edad** (default: 5) — input number, step=0.01, min=0.1, max=50
- **Constante masculina** (default: 5) — input number, step=1, min=-500, max=500
- **Constante femenina** (default: -161) — input number, step=1, min=-500, max=500

Mostrar una previsualización en vivo de la fórmula con los valores actuales:

```
Hombres: TMB = ({coefPeso} × peso) + ({coefTalla} × talla) − ({coefEdad} × edad) + {constMasc}
Mujeres: TMB = ({coefPeso} × peso) + ({coefTalla} × talla) − ({coefEdad} × edad) + ({constFem})
```

Con un ejemplo numérico debajo usando valores ficticios (ej: 70kg, 170cm, 30 años):
```
Ejemplo hombre: TMB = (10 × 70) + (6.25 × 170) − (5 × 30) + 5 = 1,617.5 kcal
```
Este ejemplo se recalcula en tiempo real cuando cambian los coeficientes.

Auto-save con debounce 500ms, mismo patrón que los factores de actividad.
Botón "Restaurar valores por defecto" → `resetCategory('MIFFLIN_COEFFICIENT')`

#### Sección 3: Rangos de macronutrientes (`MacroRangesForm`)

3 filas con doble input (min-max):

| Macronutriente | Mínimo (%) | Máximo (%) |
|---|---|---|
| Carbohidratos | [input: 45] | [input: 65] |
| Grasas | [input: 0] | [input: 35] |
| Proteínas | [input: 25] | [input: 100] |

- step=1, min=0, max=100
- Validar que min ≤ max (mostrar error inline si no)
- Validar que la suma de los mínimos no supere 100% (warning visual, no bloquear)
- Auto-save con debounce 500ms
- Botón "Restaurar valores por defecto" → `resetCategory('MACRO_RANGE')`

### Feedback visual general del módulo

- Cada campo tiene 3 estados visuales: normal (borde neutro), guardando (borde azul pulse), guardado (checkmark verde 2s), error (borde rojo + tooltip)
- Un banner informativo arriba de la página:
  > "Los cambios en esta configuración aplican inmediatamente a los nuevos cálculos. Los cálculos ya guardados conservan los valores con los que fueron calculados (snapshot)."

---

## Consideraciones de integridad

### Los snapshots previos NO cambian

Los `TmbCalculation` existentes guardan `activity_factor` como valor numérico concreto (ej: 1.55). Si la nutricionista cambia el factor de "Moderadamente activo" a 1.6, los cálculos viejos siguen diciendo 1.55 porque es un snapshot. Solo los cálculos NUEVOS usarán 1.6.

Esto ya funciona correctamente por diseño de la tabla `tmb_calculations` — no requiere cambios.

### Fallback si la DB falla

Si `useClinicalParams` tiene `error !== null`, los módulos `/calculator` y `/formula` deben funcionar usando los valores por defecto hardcodeados de `DEFAULT_ACTIVITY_FACTORS`, `DEFAULT_MIFFLIN_COEFFICIENTS` y `DEFAULT_MACRO_RANGES`. Mostrar un banner amarillo: "No se pudieron cargar los parámetros personalizados. Usando valores estándar."

---

## Restricciones

- NO crear API routes — todo client-side con Supabase SDK directo
- NO modificar tablas existentes (patients, tmb_calculations, formula_sessions)
- Los campos NUMERIC llegan como string desde Supabase — hacer `Number()` en el servicio
- El auto-save debe tener debounce para no bombardear Supabase con requests
- La previsualización de la fórmula Mifflin se calcula con useMemo, NO con un request
- Mantener la misma estética del resto de la app
- La firma de `calculateTMB()` cambia — actualizar TODOS los call sites

```
---
CAMBIOS QUIRÚRGICOS SOBRE CODEBASE EXISTENTE.
EL SQL VA PRIMERO AL SQL EDITOR DE SUPABASE, LUEGO EL CÓDIGO.
USA TASKS EN PARALELO DONDE SEA POSIBLE.
---
```