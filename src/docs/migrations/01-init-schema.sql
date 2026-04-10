-- ============================================================
-- HIPPOS MVP — Schema PostgreSQL para Supabase
-- ============================================================
-- Ejecutar en orden: schema → enums → tablas → índices → RLS
-- Compatible con Supabase Dashboard > SQL Editor
-- Todas las tablas viven en el schema "hippos"
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- SCHEMA
-- ────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS hippos;
SET search_path TO hippos;

-- ────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────

CREATE TYPE hippos.patient_objective AS ENUM (
  'WEIGHT_LOSS',
  'MAINTENANCE',
  'MUSCLE_GAIN',
  'PREGNANCY',
  'OTHER'
);

CREATE TYPE hippos.activity_level AS ENUM (
  'SEDENTARY',
  'LIGHTLY_ACTIVE',
  'MODERATELY_ACTIVE',
  'VERY_ACTIVE',
  'EXTREMELY_ACTIVE'
);

CREATE TYPE hippos.sex_type AS ENUM ('M', 'F');

-- ────────────────────────────────────────────────────────────
-- TABLA: patients
-- ────────────────────────────────────────────────────────────
-- Datos base del paciente. El peso y la talla se registran
-- aquí como valores "actuales" editables. Cada cálculo TMB
-- toma un snapshot inmutable de estos valores.
-- ────────────────────────────────────────────────────────────

CREATE TABLE hippos.patients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name  TEXT        NOT NULL,
  last_name   TEXT        NOT NULL,
  full_name   TEXT        NOT NULL GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  birth_date  DATE        NOT NULL,
  sex         sex_type    NOT NULL,
  weight      NUMERIC(5,1) NOT NULL CHECK (weight BETWEEN 20.0 AND 300.0),   -- kg
  height      NUMERIC(4,1) NOT NULL CHECK (height BETWEEN 80.0 AND 250.0),   -- cm
  pathologies TEXT[]      NOT NULL DEFAULT '{}',
  food_allergies TEXT[]   NOT NULL DEFAULT '{}',
  objective   patient_objective NOT NULL DEFAULT 'MAINTENANCE',
  activity_level activity_level  NOT NULL DEFAULT 'SEDENTARY',
  notes       TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE hippos.patients IS 'Pacientes registrados por el nutricionista';
COMMENT ON COLUMN hippos.patients.weight IS 'Peso actual en kg (20.0–300.0)';
COMMENT ON COLUMN hippos.patients.height IS 'Talla en cm (80.0–250.0)';
COMMENT ON COLUMN hippos.patients.full_name IS 'Columna generada: first_name || last_name';

-- ────────────────────────────────────────────────────────────
-- TABLA: tmb_calculations
-- ────────────────────────────────────────────────────────────
-- Snapshot inmutable del paciente al momento de la consulta
-- + evaluación de IMC + resultado energético.
-- Una vez creado NO se actualiza — se crea uno nuevo.
-- ────────────────────────────────────────────────────────────

CREATE TABLE hippos.tmb_calculations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID NOT NULL REFERENCES hippos.patients(id) ON DELETE CASCADE,

  -- Snapshot del paciente al calcular
  current_weight   NUMERIC(5,1) NOT NULL,  -- kg
  height           NUMERIC(4,1) NOT NULL,  -- cm
  age              INT          NOT NULL CHECK (age BETWEEN 0 AND 150),
  sex              sex_type     NOT NULL,
  activity_level   activity_level NOT NULL,
  activity_factor  NUMERIC(4,3) NOT NULL,  -- ej: 1.550
  objective        patient_objective NOT NULL,

  -- Evaluación IMC
  current_bmi      NUMERIC(4,1) NOT NULL,  -- peso_actual / (talla_m)²
  target_bmi       NUMERIC(3,1) NOT NULL CHECK (target_bmi BETWEEN 18.5 AND 24.9),
  healthy_weight   NUMERIC(5,1) NOT NULL,  -- target_bmi × (talla_m)²

  -- Resultados energéticos (Mifflin-St Jeor con healthy_weight)
  tmb              NUMERIC(6,1) NOT NULL,  -- kcal
  tdee             NUMERIC(6,1) NOT NULL,  -- tmb × activity_factor
  caloric_restriction NUMERIC(6,1) NOT NULL DEFAULT 0,  -- kcal a restar
  target_calories  NUMERIC(6,1) NOT NULL,  -- tdee − caloric_restriction

  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE hippos.tmb_calculations IS 'Cálculo TMB por consulta — snapshot inmutable del paciente';
COMMENT ON COLUMN hippos.tmb_calculations.tmb IS 'Mifflin-St Jeor calculado con healthy_weight, NO con current_weight';
COMMENT ON COLUMN hippos.tmb_calculations.target_calories IS 'Requerimiento final = TDEE − restricción calórica';

-- ────────────────────────────────────────────────────────────
-- TABLA: formula_sessions
-- ────────────────────────────────────────────────────────────
-- Plan dietario: asignación de intercambios + snapshot de
-- totales calculados. Los totales se guardan como snapshot
-- para preservar historial si los coeficientes cambian y
-- para evitar recomputar en reportes.
-- ────────────────────────────────────────────────────────────

CREATE TABLE hippos.formula_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID NOT NULL REFERENCES hippos.patients(id) ON DELETE CASCADE,
  tmb_calculation_id  UUID NOT NULL REFERENCES hippos.tmb_calculations(id) ON DELETE CASCADE,
  target_calories     NUMERIC(6,1) NOT NULL,  -- copiado del tmb_calculation al guardar

  -- Intercambios: JSONB array de { subgroupId, exchanges }
  -- Siempre 18 entradas (una por subgrupo), exchanges puede ser 0
  -- Ejemplo: [{"subgroupId":"I-1","exchanges":3},{"subgroupId":"I-2","exchanges":1.5},...]
  exchanges           JSONB NOT NULL DEFAULT '[]',

  -- Snapshot de totales calculados
  total_protein       NUMERIC(6,1) NOT NULL DEFAULT 0,   -- g
  total_fat           NUMERIC(6,1) NOT NULL DEFAULT 0,   -- g
  total_carbs         NUMERIC(6,1) NOT NULL DEFAULT 0,   -- g
  protein_kcal        NUMERIC(7,1) NOT NULL DEFAULT 0,   -- protein × 4
  fat_kcal            NUMERIC(7,1) NOT NULL DEFAULT 0,   -- fat × 9
  carbs_kcal          NUMERIC(7,1) NOT NULL DEFAULT 0,   -- carbs × 4
  total_kcal          NUMERIC(7,1) NOT NULL DEFAULT 0,   -- suma
  protein_percent     NUMERIC(4,1) NOT NULL DEFAULT 0,   -- %
  fat_percent         NUMERIC(4,1) NOT NULL DEFAULT 0,   -- %
  carbs_percent       NUMERIC(4,1) NOT NULL DEFAULT 0,   -- %
  adequacy_percent    NUMERIC(5,1) NOT NULL DEFAULT 0,   -- (total_kcal / target_calories) × 100

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE hippos.formula_sessions IS 'Plan dietario con intercambios y snapshot de macronutrientes';
COMMENT ON COLUMN hippos.formula_sessions.exchanges IS 'JSONB array: [{subgroupId, exchanges}] — 18 entradas, una por subgrupo';
COMMENT ON COLUMN hippos.formula_sessions.total_kcal IS 'Snapshot: protein_kcal + fat_kcal + carbs_kcal';
COMMENT ON COLUMN hippos.formula_sessions.adequacy_percent IS 'Snapshot: (total_kcal / target_calories) × 100';

-- ────────────────────────────────────────────────────────────
-- ÍNDICES
-- ────────────────────────────────────────────────────────────
-- Optimizados para los queries del módulo de reportes:
-- filtro por fecha, por paciente, y JOIN entre las 3 tablas.
-- ────────────────────────────────────────────────────────────

-- Pacientes: búsqueda por nombre
CREATE INDEX idx_patients_full_name ON hippos.patients (full_name);

-- TMB: lookup por paciente + orden cronológico
CREATE INDEX idx_tmb_patient_created ON hippos.tmb_calculations (patient_id, created_at DESC);

-- Fórmulas: lookup por paciente + rango de fechas (módulo reportes)
CREATE INDEX idx_formula_patient_created ON hippos.formula_sessions (patient_id, created_at DESC);

-- Fórmulas: lookup por cálculo TMB
CREATE INDEX idx_formula_tmb ON hippos.formula_sessions (tmb_calculation_id);

-- Fórmulas: filtro por fecha para reportes (sin paciente específico)
CREATE INDEX idx_formula_created ON hippos.formula_sessions (created_at DESC);

-- ────────────────────────────────────────────────────────────
-- TRIGGER: updated_at automático
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION hippos.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_patients_updated_at
  BEFORE UPDATE ON hippos.patients
  FOR EACH ROW EXECUTE FUNCTION hippos.trigger_set_updated_at();

CREATE TRIGGER set_formula_sessions_updated_at
  BEFORE UPDATE ON hippos.formula_sessions
  FOR EACH ROW EXECUTE FUNCTION hippos.trigger_set_updated_at();

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────
-- Habilitado pero con policy permisiva para el MVP.
-- Cuando se implemente auth multi-tenant, se restringe
-- por user_id / tenant_id.
-- ────────────────────────────────────────────────────────────

ALTER TABLE hippos.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE hippos.tmb_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hippos.formula_sessions ENABLE ROW LEVEL SECURITY;

-- Policies MVP: acceso total para usuarios autenticados
CREATE POLICY "patients_all_access" ON hippos.patients
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "tmb_calculations_all_access" ON hippos.tmb_calculations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "formula_sessions_all_access" ON hippos.formula_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- VISTA: report_view
-- ────────────────────────────────────────────────────────────
-- Vista desnormalizada para el módulo de reportes.
-- Hace el JOIN que antes se hacía en memoria con useMemo.
-- Reemplaza la hidratación client-side por un SELECT directo.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW hippos.report_view AS
SELECT
  fs.id                AS formula_id,
  fs.created_at        AS formula_date,
  fs.patient_id,
  p.full_name          AS patient_name,
  p.sex                AS patient_sex,
  tc.age               AS patient_age,
  tc.objective,
  tc.current_weight,
  tc.healthy_weight,
  tc.current_bmi,
  tc.target_bmi,
  tc.target_calories,
  fs.total_kcal,
  fs.adequacy_percent,
  fs.protein_percent,
  fs.fat_percent,
  fs.carbs_percent,
  fs.tmb_calculation_id,
  fs.exchanges
FROM hippos.formula_sessions fs
JOIN hippos.tmb_calculations tc ON tc.id = fs.tmb_calculation_id
JOIN hippos.patients p          ON p.id  = fs.patient_id
ORDER BY fs.created_at DESC;

COMMENT ON VIEW hippos.report_view IS 'Vista desnormalizada para el módulo Historial y Reportes — reemplaza el JOIN en memoria';