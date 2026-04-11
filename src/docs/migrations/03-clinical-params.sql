-- ============================================================
-- MIGRACIÓN: Parámetros clínicos configurables
-- Schema: hippos
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

SET search_path TO hippos;

-- ────────────────────────────────────────────────────────────
-- ENUM
-- ────────────────────────────────────────────────────────────

CREATE TYPE hippos.param_category AS ENUM (
  'ACTIVITY_FACTOR',
  'MIFFLIN_COEFFICIENT',
  'MACRO_RANGE'
);

-- ────────────────────────────────────────────────────────────
-- TABLA: clinical_params
-- ────────────────────────────────────────────────────────────

CREATE TABLE hippos.clinical_params (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    hippos.param_category NOT NULL,
  key         TEXT         NOT NULL,
  label       TEXT         NOT NULL,
  description TEXT         NOT NULL DEFAULT '',
  value       NUMERIC(8,4) NOT NULL,
  max_value   NUMERIC(8,4),
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT uq_clinical_params_category_key UNIQUE (category, key)
);

COMMENT ON TABLE hippos.clinical_params IS 'Parámetros clínicos configurables: factores de actividad, coeficientes Mifflin, rangos de macros';
COMMENT ON COLUMN hippos.clinical_params.value IS 'Valor principal: factor de actividad, coeficiente Mifflin, o mínimo de rango de macros';
COMMENT ON COLUMN hippos.clinical_params.max_value IS 'Solo para MACRO_RANGE: límite superior del porcentaje';
COMMENT ON COLUMN hippos.clinical_params.sort_order IS 'Orden de presentación en la UI';

-- ────────────────────────────────────────────────────────────
-- ÍNDICE
-- ────────────────────────────────────────────────────────────

CREATE INDEX idx_clinical_params_category ON hippos.clinical_params (category, sort_order);

-- ────────────────────────────────────────────────────────────
-- TRIGGER updated_at
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
-- SEED: valores por defecto
-- ────────────────────────────────────────────────────────────

INSERT INTO hippos.clinical_params (category, key, label, description, value, max_value, sort_order) VALUES
  ('ACTIVITY_FACTOR', 'SEDENTARY',         'Sedentario',            'Poco o nada de ejercicio',           1.2,   NULL, 1),
  ('ACTIVITY_FACTOR', 'LIGHTLY_ACTIVE',    'Ligeramente activo',    'Ejercicio 1-3 días/semana',          1.375, NULL, 2),
  ('ACTIVITY_FACTOR', 'MODERATELY_ACTIVE', 'Moderadamente activo',  'Ejercicio 3-5 días/semana',          1.55,  NULL, 3),
  ('ACTIVITY_FACTOR', 'VERY_ACTIVE',       'Muy activo',            'Ejercicio 6-7 días/semana',          1.725, NULL, 4),
  ('ACTIVITY_FACTOR', 'EXTREMELY_ACTIVE',  'Extremadamente activo', 'Atleta / trabajo físico intenso',    1.9,   NULL, 5);

INSERT INTO hippos.clinical_params (category, key, label, description, value, max_value, sort_order) VALUES
  ('MIFFLIN_COEFFICIENT', 'WEIGHT_COEFFICIENT', 'Coeficiente peso',    'Multiplica al peso en kg',                    10,    NULL, 1),
  ('MIFFLIN_COEFFICIENT', 'HEIGHT_COEFFICIENT', 'Coeficiente talla',   'Multiplica a la talla en cm',                 6.25,  NULL, 2),
  ('MIFFLIN_COEFFICIENT', 'AGE_COEFFICIENT',    'Coeficiente edad',    'Multiplica a la edad en años (se resta)',      5,    NULL, 3),
  ('MIFFLIN_COEFFICIENT', 'MALE_CONSTANT',      'Constante masculina', 'Se suma al resultado para hombres',            5,    NULL, 4),
  ('MIFFLIN_COEFFICIENT', 'FEMALE_CONSTANT',    'Constante femenina',  'Se suma al resultado para mujeres (negativo)', -161, NULL, 5);

INSERT INTO hippos.clinical_params (category, key, label, description, value, max_value, sort_order) VALUES
  ('MACRO_RANGE', 'CARBS_RANGE',   'Carbohidratos', 'Rango porcentual objetivo de carbohidratos', 45,  65,  1),
  ('MACRO_RANGE', 'FAT_RANGE',     'Grasas',        'Rango porcentual objetivo de grasas',          0,  35,  2),
  ('MACRO_RANGE', 'PROTEIN_RANGE', 'Proteínas',     'Rango porcentual objetivo de proteínas',      25, 100,  3);

-- Permisos para anon / authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON hippos.clinical_params TO anon, authenticated, service_role;
