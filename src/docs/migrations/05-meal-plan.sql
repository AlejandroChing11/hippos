-- ============================================================
-- MIGRACIÓN 05: Distribución por comidas, equivalencias y templates
-- Schema: hippos
-- Ejecutar en el SQL Editor de Supabase ANTES de desplegar código
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TABLA: meal_distributions
-- ────────────────────────────────────────────────────────────
-- Distribución de los intercambios de una FormulaSession
-- por momento del día. Una por FormulaSession.

CREATE TABLE IF NOT EXISTS hippos.meal_distributions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_session_id   UUID NOT NULL REFERENCES hippos.formula_sessions(id) ON DELETE CASCADE,
  patient_id           UUID NOT NULL REFERENCES hippos.patients(id) ON DELETE CASCADE,

  -- JSONB con la distribución completa
  -- Estructura: { [summaryGroupId]: { breakfast, morningSnack, lunch, afternoonSnack, dinner } }
  distribution         JSONB NOT NULL DEFAULT '{}',

  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_meal_dist_formula UNIQUE (formula_session_id)
);

COMMENT ON TABLE hippos.meal_distributions IS 'Distribución de intercambios agrupados por momento del día';

CREATE INDEX IF NOT EXISTS idx_meal_dist_formula ON hippos.meal_distributions (formula_session_id);
CREATE INDEX IF NOT EXISTS idx_meal_dist_patient ON hippos.meal_distributions (patient_id);

DROP TRIGGER IF EXISTS set_meal_distributions_updated_at ON hippos.meal_distributions;
CREATE TRIGGER set_meal_distributions_updated_at
  BEFORE UPDATE ON hippos.meal_distributions
  FOR EACH ROW EXECUTE FUNCTION hippos.trigger_set_updated_at();

ALTER TABLE hippos.meal_distributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "meal_distributions_all_access" ON hippos.meal_distributions;
CREATE POLICY "meal_distributions_all_access" ON hippos.meal_distributions
  FOR ALL USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- TABLA: food_equivalencies
-- ────────────────────────────────────────────────────────────
-- Catálogo de alimentos con su equivalencia a 1 porción
-- dentro de un grupo de intercambio.

CREATE TABLE IF NOT EXISTS hippos.food_equivalencies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_group   TEXT    NOT NULL,
  food_name       TEXT    NOT NULL,
  portion_desc    TEXT    NOT NULL,
  portion_grams   NUMERIC(6,1),
  notes           TEXT    NOT NULL DEFAULT '',
  sort_order      INT     NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE hippos.food_equivalencies IS 'Catálogo de alimentos equivalentes a 1 porción por grupo de intercambio';
COMMENT ON COLUMN hippos.food_equivalencies.summary_group IS 'Referencia al grupo del resumen de intercambios (EXCHANGE_SUMMARY_GROUPS)';

CREATE INDEX IF NOT EXISTS idx_food_equiv_group ON hippos.food_equivalencies (summary_group, sort_order);

DROP TRIGGER IF EXISTS set_food_equivalencies_updated_at ON hippos.food_equivalencies;
CREATE TRIGGER set_food_equivalencies_updated_at
  BEFORE UPDATE ON hippos.food_equivalencies
  FOR EACH ROW EXECUTE FUNCTION hippos.trigger_set_updated_at();

ALTER TABLE hippos.food_equivalencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "food_equivalencies_all_access" ON hippos.food_equivalencies;
CREATE POLICY "food_equivalencies_all_access" ON hippos.food_equivalencies
  FOR ALL USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- TABLA: plan_template_slides
-- ────────────────────────────────────────────────────────────
-- Slides educativos fijos que se incluyen en todos los planes.

CREATE TABLE IF NOT EXISTS hippos.plan_template_slides (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT    NOT NULL,
  category        TEXT    NOT NULL,
  content         JSONB   NOT NULL,
  sort_order      INT     NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE hippos.plan_template_slides IS 'Slides educativos/tips que se agregan automáticamente a los planes generados';

CREATE INDEX IF NOT EXISTS idx_template_slides_order ON hippos.plan_template_slides (sort_order);

DROP TRIGGER IF EXISTS set_plan_template_slides_updated_at ON hippos.plan_template_slides;
CREATE TRIGGER set_plan_template_slides_updated_at
  BEFORE UPDATE ON hippos.plan_template_slides
  FOR EACH ROW EXECUTE FUNCTION hippos.trigger_set_updated_at();

ALTER TABLE hippos.plan_template_slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plan_template_slides_all_access" ON hippos.plan_template_slides;
CREATE POLICY "plan_template_slides_all_access" ON hippos.plan_template_slides
  FOR ALL USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- TABLA: generated_plans
-- ────────────────────────────────────────────────────────────
-- Registro de cada plan generado.

CREATE TABLE IF NOT EXISTS hippos.generated_plans (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id           UUID NOT NULL REFERENCES hippos.patients(id) ON DELETE CASCADE,
  formula_session_id   UUID NOT NULL REFERENCES hippos.formula_sessions(id) ON DELETE CASCADE,
  meal_distribution_id UUID NOT NULL REFERENCES hippos.meal_distributions(id) ON DELETE CASCADE,
  plan_title           TEXT    NOT NULL,
  objective_text       TEXT    NOT NULL,
  duration_months      INT     NOT NULL DEFAULT 3,
  weight_loss_per_month NUMERIC(3,1) NOT NULL DEFAULT 2.0,
  weight_goals         JSONB   NOT NULL,
  template_slide_ids   UUID[]  NOT NULL DEFAULT '{}',
  generated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE hippos.generated_plans IS 'Registro de planes PPTX generados con metadata de configuración';

CREATE INDEX IF NOT EXISTS idx_generated_plans_patient ON hippos.generated_plans (patient_id, generated_at DESC);

ALTER TABLE hippos.generated_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "generated_plans_all_access" ON hippos.generated_plans;
CREATE POLICY "generated_plans_all_access" ON hippos.generated_plans
  FOR ALL USING (true) WITH CHECK (true);
