# Hippos MVP — Migración SessionStorage → Supabase

```
ESTA ES UNA SESION LONG AUTONOMOUS RUNNING AGENTIC CODING SESSION, NO TIEMPO LIMITE.
CAMBIOS QUIRÚRGICOS — reemplazar la capa de datos, NO reescribir UI ni lógica de cálculo.
```

---

## Contexto

Hippos MVP funciona actualmente con SessionStorage como persistencia. Vamos a migrar a **Supabase (PostgreSQL)** para ir a producción. La base de datos ya está creada con el schema `hippos` y 3 tablas + 1 vista + RLS con policies permisivas.

**Lo que NO cambia:** UI, componentes, lógica de cálculo (Mifflin, IMC, macros), constantes (FOOD_GROUPS, ACTIVITY_FACTORS, OBJECTIVES), routing, layout.

**Lo que SÍ cambia:** La capa de datos pasa de leer/escribir SessionStorage a leer/escribir Supabase via `@supabase/supabase-js`.

---

## Variables de entorno (ya configuradas)

```env
NEXT_PUBLIC_SUPABASE_URL=<ya configurado>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<ya configurado>
```

---

## Instalación

```bash
bun add @supabase/supabase-js
```

---

## Arquitectura de archivos

### Archivos NUEVOS a crear

```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Cliente Supabase singleton
│   │   ├── types.ts                  # Tipos generados/manuales que mapean las tablas
│   │   ├── patients.ts               # CRUD de patients
│   │   ├── tmb-calculations.ts       # CRUD de tmb_calculations
│   │   ├── formula-sessions.ts       # CRUD de formula_sessions
│   │   └── reports.ts                # Queries para el módulo reportes (usa report_view)
│   └── hooks/
│       ├── usePatients.ts            # Hook React que reemplaza useSessionStorage para patients
│       ├── useTmbCalculations.ts     # Hook React para tmb_calculations
│       ├── useFormulaSessions.ts     # Hook React para formula_sessions
│       └── useReports.ts            # Hook React para reportes
```

### Archivos a MODIFICAR

```
src/
├── app/(dashboard)/
│   ├── patients/page.tsx            # Reemplazar useSessionStorage → usePatients
│   ├── calculator/page.tsx          # Reemplazar useSessionStorage → useTmbCalculations
│   ├── formula/page.tsx             # Reemplazar useSessionStorage → useFormulaSessions
│   └── reports/page.tsx             # Reemplazar useMemo+hidratación → useReports
```

### Archivos a ELIMINAR (después de migrar)

```
src/hooks/useSessionStorage.ts       # Ya no se necesita
src/lib/store.ts                     # Ya no se necesita (si existe)
```

---

## 1. Cliente Supabase

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  db: { schema: 'hippos' },
});
```

---

## 2. Tipos de base de datos

```typescript
// src/lib/supabase/types.ts
// Mapeo manual del schema hippos a TypeScript.
// Mantener sincronizado con hippos_schema.sql.
// IMPORTANTE: los nombres de columna en la DB son snake_case,
// pero los tipos en la app usan camelCase. La conversión se
// hace en las funciones de servicio, NO en los componentes.

export interface Database {
  hippos: {
    Tables: {
      patients: {
        Row: DbPatient;
        Insert: DbPatientInsert;
        Update: DbPatientUpdate;
      };
      tmb_calculations: {
        Row: DbTmbCalculation;
        Insert: DbTmbCalculationInsert;
        Update: never; // inmutable — no se actualiza
      };
      formula_sessions: {
        Row: DbFormulaSession;
        Insert: DbFormulaSessionInsert;
        Update: DbFormulaSessionUpdate;
      };
    };
    Views: {
      report_view: {
        Row: DbReportRow;
      };
    };
  };
}

// ─── patients ───

export interface DbPatient {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;           // generated column — read only
  birth_date: string;          // DATE → "YYYY-MM-DD"
  sex: 'M' | 'F';
  weight: number;
  height: number;
  pathologies: string[];
  food_allergies: string[];
  objective: 'WEIGHT_LOSS' | 'MAINTENANCE' | 'MUSCLE_GAIN' | 'PREGNANCY' | 'OTHER';
  activity_level: 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTREMELY_ACTIVE';
  notes: string;
  created_at: string;
  updated_at: string;
}

export type DbPatientInsert = Omit<DbPatient, 'id' | 'full_name' | 'created_at' | 'updated_at'>;
export type DbPatientUpdate = Partial<Omit<DbPatientInsert, 'birth_date'>>;

// ─── tmb_calculations ───

export interface DbTmbCalculation {
  id: string;
  patient_id: string;
  current_weight: number;
  height: number;
  age: number;
  sex: 'M' | 'F';
  activity_level: string;
  activity_factor: number;
  objective: string;
  current_bmi: number;
  target_bmi: number;
  healthy_weight: number;
  tmb: number;
  tdee: number;
  caloric_restriction: number;
  target_calories: number;
  created_at: string;
}

export type DbTmbCalculationInsert = Omit<DbTmbCalculation, 'id' | 'created_at'>;

// ─── formula_sessions ───

export interface DbFormulaSession {
  id: string;
  patient_id: string;
  tmb_calculation_id: string;
  target_calories: number;
  exchanges: { subgroupId: string; exchanges: number }[];  // JSONB
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  protein_kcal: number;
  fat_kcal: number;
  carbs_kcal: number;
  total_kcal: number;
  protein_percent: number;
  fat_percent: number;
  carbs_percent: number;
  adequacy_percent: number;
  created_at: string;
  updated_at: string;
}

export type DbFormulaSessionInsert = Omit<DbFormulaSession, 'id' | 'created_at' | 'updated_at'>;
export type DbFormulaSessionUpdate = Partial<Pick<DbFormulaSession,
  'exchanges' | 'total_protein' | 'total_fat' | 'total_carbs' |
  'protein_kcal' | 'fat_kcal' | 'carbs_kcal' | 'total_kcal' |
  'protein_percent' | 'fat_percent' | 'carbs_percent' | 'adequacy_percent'
>>;

// ─── report_view ───

export interface DbReportRow {
  formula_id: string;
  formula_date: string;
  patient_id: string;
  patient_name: string;
  patient_sex: 'M' | 'F';
  patient_age: number;
  objective: string;
  current_weight: number;
  healthy_weight: number;
  current_bmi: number;
  target_bmi: number;
  target_calories: number;
  total_kcal: number;
  adequacy_percent: number;
  protein_percent: number;
  fat_percent: number;
  carbs_percent: number;
  tmb_calculation_id: string;
  exchanges: { subgroupId: string; exchanges: number }[];
}
```

---

## 3. Funciones de servicio (CRUD)

Cada archivo de servicio exporta funciones async puras. NO son hooks.
Los componentes NO importan `supabase` directamente — siempre van a través de estos servicios o de los hooks.

### Convención snake_case ↔ camelCase

La base de datos usa `snake_case`. La app usa `camelCase`. La conversión se hace en la capa de servicio con funciones helper:

```typescript
// Patrón de conversión — incluir en cada archivo de servicio o en un util compartido

// DB → App: snake_case → camelCase
function toPatient(row: DbPatient): Patient {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name,
    birthDate: row.birth_date,
    age: calculateAge(row.birth_date),  // recomputar desde birth_date
    sex: row.sex,
    weight: Number(row.weight),
    height: Number(row.height),
    pathologies: row.pathologies,
    foodAllergies: row.food_allergies,
    objective: row.objective,
    activityLevel: row.activity_level,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// App → DB: camelCase → snake_case
function toDbPatient(patient: Omit<Patient, 'id' | 'fullName' | 'age' | 'createdAt' | 'updatedAt'>): DbPatientInsert {
  return {
    first_name: patient.firstName,
    last_name: patient.lastName,
    birth_date: patient.birthDate,
    sex: patient.sex,
    weight: patient.weight,
    height: patient.height,
    pathologies: patient.pathologies,
    food_allergies: patient.foodAllergies,
    objective: patient.objective,
    activity_level: patient.activityLevel,
    notes: patient.notes,
  };
}
```

**Aplicar el mismo patrón para TmbCalculation y FormulaSession.**

IMPORTANTE: Los campos `NUMERIC` de Postgres llegan como `string` en el cliente Supabase. Siempre hacer `Number(row.campo)` en la función de conversión para evitar bugs de concatenación de strings.

### 3.1 patients.ts

```typescript
// src/lib/supabase/patients.ts
import { supabase } from './client';

// Listar todos los pacientes, ordenados por nombre
export async function getPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('full_name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toPatient);
}

// Obtener un paciente por ID
export async function getPatientById(id: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw error;
  }
  return toPatient(data);
}

// Crear paciente — NO enviar id, full_name, created_at, updated_at (los genera la DB)
export async function createPatient(patient: DbPatientInsert): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .insert(patient)
    .select()
    .single();

  if (error) throw error;
  return toPatient(data);
}

// Actualizar paciente — partial update
// IMPORTANTE: NO enviar full_name (es generated column, Postgres la rechaza)
export async function updatePatient(id: string, updates: DbPatientUpdate): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toPatient(data);
}

// Eliminar paciente — CASCADE borra tmb_calculations y formula_sessions asociadas
export async function deletePatient(id: string): Promise<void> {
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Buscar pacientes por nombre (búsqueda parcial, case insensitive)
export async function searchPatients(query: string): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .ilike('full_name', `%${query}%`)
    .order('full_name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toPatient);
}
```

### 3.2 tmb-calculations.ts

```typescript
// src/lib/supabase/tmb-calculations.ts
import { supabase } from './client';

// Listar cálculos de un paciente, más reciente primero
export async function getTmbCalculations(patientId: string): Promise<TmbCalculation[]> {
  const { data, error } = await supabase
    .from('tmb_calculations')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toTmbCalculation);
}

// Obtener un cálculo por ID
export async function getTmbCalculationById(id: string): Promise<TmbCalculation | null> {
  const { data, error } = await supabase
    .from('tmb_calculations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return toTmbCalculation(data);
}

// Crear cálculo TMB — inmutable, no hay update
export async function createTmbCalculation(calc: DbTmbCalculationInsert): Promise<TmbCalculation> {
  const { data, error } = await supabase
    .from('tmb_calculations')
    .insert(calc)
    .select()
    .single();

  if (error) throw error;
  return toTmbCalculation(data);
}

// Eliminar cálculo TMB (CASCADE borra formula_sessions asociadas)
export async function deleteTmbCalculation(id: string): Promise<void> {
  const { error } = await supabase
    .from('tmb_calculations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
```

### 3.3 formula-sessions.ts

```typescript
// src/lib/supabase/formula-sessions.ts
import { supabase } from './client';

// Listar fórmulas de un cálculo TMB
export async function getFormulaSessions(tmbCalculationId: string): Promise<FormulaSession[]> {
  const { data, error } = await supabase
    .from('formula_sessions')
    .select('*')
    .eq('tmb_calculation_id', tmbCalculationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toFormulaSession);
}

// Obtener una fórmula por ID
export async function getFormulaSessionById(id: string): Promise<FormulaSession | null> {
  const { data, error } = await supabase
    .from('formula_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return toFormulaSession(data);
}

// Crear fórmula
// IMPORTANTE: los totals de macros se calculan en el frontend
// y se envían como snapshot plano (no como objeto anidado)
export async function createFormulaSession(session: DbFormulaSessionInsert): Promise<FormulaSession> {
  const { data, error } = await supabase
    .from('formula_sessions')
    .insert(session)
    .select()
    .single();

  if (error) throw error;
  return toFormulaSession(data);
}

// Actualizar fórmula (intercambios + totals recalculados)
export async function updateFormulaSession(id: string, updates: DbFormulaSessionUpdate): Promise<FormulaSession> {
  const { data, error } = await supabase
    .from('formula_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toFormulaSession(data);
}

// Duplicar fórmula — lee la existente, inserta copia nueva
export async function duplicateFormulaSession(id: string): Promise<FormulaSession> {
  const original = await getFormulaSessionById(id);
  if (!original) throw new Error('Formula session not found');

  // Convertir de vuelta a formato DB para insertar
  const insertData = toDbFormulaSession(original);
  return createFormulaSession(insertData);
}

// Eliminar fórmula
export async function deleteFormulaSession(id: string): Promise<void> {
  const { error } = await supabase
    .from('formula_sessions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
```

### 3.4 reports.ts

```typescript
// src/lib/supabase/reports.ts
import { supabase } from './client';

// Consultar la vista report_view con filtros
// Esta vista ya tiene el JOIN hecho en Postgres — reemplaza el useMemo+hidratación
export async function getReportData(filters: {
  startDate: string;
  endDate: string;
  patientId?: string | null;
  objective?: string | null;  // 'ALL' o null = sin filtro
}): Promise<ReportRow[]> {
  let query = supabase
    .from('report_view')
    .select('*')
    .gte('formula_date', filters.startDate)
    .lte('formula_date', filters.endDate + 'T23:59:59.999Z')
    .order('formula_date', { ascending: false });

  if (filters.patientId) {
    query = query.eq('patient_id', filters.patientId);
  }

  if (filters.objective && filters.objective !== 'ALL') {
    query = query.eq('objective', filters.objective);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toReportRow);
}
```

---

## 4. Hooks React

Cada hook encapsula: estado de loading, estado de error, data, y funciones mutadoras.
Los componentes consumen estos hooks en lugar de `useSessionStorage`.

### Patrón base de los hooks

```typescript
// Patrón que deben seguir TODOS los hooks de Supabase:

function useEntity() {
  const [data, setData] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch inicial
  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getEntities();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Mutaciones — cada una llama al servicio y luego hace refetch
  const create = useCallback(async (input: CreateInput) => {
    const created = await createEntity(input);
    setData(prev => [...prev, created]);
    return created;
  }, []);

  const update = useCallback(async (id: string, updates: UpdateInput) => {
    const updated = await updateEntity(id, updates);
    setData(prev => prev.map(item => item.id === id ? updated : item));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteEntity(id);
    setData(prev => prev.filter(item => item.id !== id));
  }, []);

  return { data, loading, error, create, update, remove, refetch: fetch };
}
```

### 4.1 usePatients.ts

```typescript
// Reemplaza: useSessionStorage<Patient[]>('hippos_patients', [])
// Retorna: { patients, loading, error, createPatient, updatePatient, deletePatient, searchPatients, refetch }
// El search filtra localmente si la query tiene <3 caracteres, usa ilike en Supabase si ≥3
```

### 4.2 useTmbCalculations.ts

```typescript
// Reemplaza: useSessionStorage<TmbCalculation[]>('hippos_tmb_calculations', [])
// Recibe: patientId como parámetro
// Retorna: { calculations, loading, error, createCalculation, deleteCalculation, refetch }
// useEffect re-fetcha cuando cambia patientId
```

### 4.3 useFormulaSessions.ts

```typescript
// Reemplaza: useSessionStorage<FormulaSession[]>('hippos_formula_sessions', [])
// Recibe: tmbCalculationId como parámetro
// Retorna: { sessions, loading, error, createSession, updateSession, duplicateSession, deleteSession, refetch }
// useEffect re-fetcha cuando cambia tmbCalculationId
```

### 4.4 useReports.ts

```typescript
// Reemplaza: el useMemo que hacía JOIN en memoria de las 3 colecciones
// Recibe: ReportFilters como parámetro
// Retorna: { rows, summary, loading, error, refetch }
// 
// El summary (ReportSummary) se calcula con useMemo SOBRE los rows ya filtrados por Postgres:
//   totalFormulas = rows.length
//   uniquePatients = new Set(rows.map(r => r.patientId)).size
//   averageAdequacy = sum / count
//   averageTargetCalories = sum / count
//   byObjective = agrupar y contar
//
// useEffect re-fetcha cuando cambian los filtros
```

---

## 5. Migración en los componentes

### Patrón de reemplazo

En cada page.tsx, el cambio es mecánico:

**ANTES (SessionStorage):**
```typescript
const [patients, setPatients] = useSessionStorage<Patient[]>('hippos_patients', []);

// crear
setPatients(prev => [...prev, newPatient]);

// actualizar
setPatients(prev => prev.map(p => p.id === id ? updated : p));

// eliminar
setPatients(prev => prev.filter(p => p.id !== id));
```

**DESPUÉS (Supabase):**
```typescript
const { patients, loading, error, createPatient, updatePatient, deletePatient } = usePatients();

// crear
await createPatient(newPatientData);

// actualizar
await updatePatient(id, updates);

// eliminar
await deletePatient(id);
```

### Manejo de estados async en la UI

Al pasar de síncrono (SessionStorage) a asíncrono (Supabase), cada página necesita:

1. **Loading state**: Mostrar skeleton/spinner mientras `loading === true`. NO renderizar tablas vacías durante carga.
2. **Error state**: Si `error !== null`, mostrar banner de error con mensaje + botón "Reintentar" que llama a `refetch()`.
3. **Optimistic updates**: Los hooks actualizan el estado local inmediatamente (setData) y en paralelo hacen la llamada a Supabase. Si la llamada falla, hacer rollback del estado local y mostrar error.
4. **Disable buttons durante mutaciones**: Cuando se está creando/actualizando/eliminando, deshabilitar el botón correspondiente para evitar doble submit. Usar un estado `isSaving` local por componente.

```typescript
// Ejemplo de patrón en un componente
const [isSaving, setIsSaving] = useState(false);

async function handleSave() {
  try {
    setIsSaving(true);
    await createPatient(formData);
    closeModal();
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Error al guardar');
  } finally {
    setIsSaving(false);
  }
}

<Button onClick={handleSave} disabled={isSaving}>
  {isSaving ? 'Guardando...' : 'Guardar paciente'}
</Button>
```

---

## 6. Cambios específicos por módulo

### /patients/page.tsx

- Reemplazar `useSessionStorage` → `usePatients()`
- Agregar skeleton de tabla durante loading
- La búsqueda por nombre: si query < 3 chars, filtrar localmente sobre `patients`. Si ≥ 3, llamar a `searchPatients(query)` con debounce de 300ms.
- Al eliminar: confirmar, llamar `deletePatient(id)`, mostrar toast de éxito o error.
- `fullName` ya NO se computa en el cliente — viene de la DB (generated column). Eliminar la computación manual.
- `id` ya NO se genera con `crypto.randomUUID()` — lo genera Postgres. NO enviarlo en el insert.

### /calculator/page.tsx

- Reemplazar `useSessionStorage` para TMB → `useTmbCalculations(patientId)`
- Para cargar pacientes en el dropdown: usar `usePatients()` (solo el array `patients`)
- Al seleccionar paciente: el hook refetcha automáticamente los cálculos de ese paciente
- Al guardar: llamar `createCalculation(data)`, redirigir a `/formula?tmbCalculationId=${result.id}`
- NO enviar `id` ni `created_at` — los genera Postgres

### /formula/page.tsx

- Reemplazar `useSessionStorage` para fórmulas → `useFormulaSessions(tmbCalculationId)`
- Para cargar el cálculo TMB: llamar `getTmbCalculationById(tmbCalculationId)` directamente (no necesita hook, es un fetch one-time)
- Para cargar paciente: llamar `getPatientById(patientId)` directamente
- Al guardar: aplanar los totals (MacroTotals) a campos planos de la DB:

```typescript
// ANTES: guardaba objeto anidado { totals: { protein, fat, carbs, ... } }
// AHORA: aplanar a columnas individuales

const insertData: DbFormulaSessionInsert = {
  patient_id: patientId,
  tmb_calculation_id: tmbCalculationId,
  target_calories: targetCalories,
  exchanges: exchangeEntries,            // JSONB — se serializa automáticamente
  total_protein: totals.protein,
  total_fat: totals.fat,
  total_carbs: totals.carbs,
  protein_kcal: totals.proteinKcal,
  fat_kcal: totals.fatKcal,
  carbs_kcal: totals.carbsKcal,
  total_kcal: totals.totalKcal,
  protein_percent: totals.proteinPercent,
  fat_percent: totals.fatPercent,
  carbs_percent: totals.carbsPercent,
  adequacy_percent: adequacyPercent,
};
```

- Duplicar plan: llamar `duplicateFormulaSession(id)`

### /reports/page.tsx

- **Reemplazar completamente** la hidratación en memoria (cargar 3 colecciones + JOIN con useMemo)
- Ahora: usar `useReports(filters)` que consulta la vista `report_view` directo
- El JOIN ya está hecho en Postgres — el hook solo recibe rows planos y calcula el summary
- Los filtros llaman a `getReportData(filters)` en cada cambio (con debounce de 300ms para el preset custom)
- NO guardar filtros en SessionStorage — estado local con useState es suficiente

---

## 7. Consideraciones de producción

### Manejo de errores de red

```typescript
// Wrapper recomendado para todas las llamadas a Supabase
async function supabaseCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Error) {
      // Error de red / timeout
      if (err.message.includes('Failed to fetch')) {
        throw new Error('Sin conexión. Verifica tu internet e intenta de nuevo.');
      }
      // RLS denied
      if (err.message.includes('permission denied') || err.message.includes('RLS')) {
        throw new Error('Sin permisos para esta operación.');
      }
      throw err;
    }
    throw new Error('Error desconocido');
  }
}
```

### Performance

- Las tablas tienen índices en `patient_id + created_at DESC` — las queries ya están optimizadas.
- La vista `report_view` hace el JOIN una vez en Postgres — es órdenes de magnitud más rápido que hidratar en el cliente.
- NO hacer `select('*')` si solo necesitas algunas columnas. En el módulo de reportes, la vista ya retorna solo lo necesario.
- Para el dropdown de pacientes en `/calculator`, hacer `select('id, full_name')` en vez de `select('*')`.

### Campos NUMERIC

Supabase retorna campos `NUMERIC` como `string` para preservar precisión. SIEMPRE convertir a `Number()` en las funciones `toEntity()`. Si no se hace, operaciones como `weight + 1` resultarán en `"75.01"` (concatenación) en vez de `76.0`.

---

## Checklist de migración

1. [ ] Instalar `@supabase/supabase-js`
2. [ ] Crear `src/lib/supabase/client.ts` con schema `hippos`
3. [ ] Crear `src/lib/supabase/types.ts` con todos los tipos DB
4. [ ] Crear los 4 archivos de servicio (patients, tmb-calculations, formula-sessions, reports)
5. [ ] Crear los 4 hooks (usePatients, useTmbCalculations, useFormulaSessions, useReports)
6. [ ] Migrar `/patients/page.tsx`
7. [ ] Migrar `/calculator/page.tsx`
8. [ ] Migrar `/formula/page.tsx`
9. [ ] Migrar `/reports/page.tsx`
10. [ ] Agregar loading states y error states a los 4 módulos
11. [ ] Eliminar `useSessionStorage.ts` y `store.ts`
12. [ ] Eliminar todas las referencias a SessionStorage keys (`hippos_patients`, etc.)
13. [ ] Probar CRUD completo en los 4 módulos contra Supabase
14. [ ] Verificar que campos NUMERIC no llegan como string a los componentes

```
---
CAMBIOS QUIRÚRGICOS. La UI no cambia — solo la capa de datos.
Respetar la separación: client.ts → types.ts → services → hooks → componentes.
Los componentes NUNCA importan supabase directamente.
USA TASKS EN PARALELO DONDE SEA POSIBLE.
---
```