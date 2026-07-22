-- ============================================================
-- HIPPOS — DRI formula support migration
-- ============================================================
-- Adds requirement_weight and formula_type columns to tmb_calculations
-- to support DRI (IOM 2005) formula alongside Mifflin-St Jeor.
-- ============================================================

-- Add new columns (nullable for backward compat)
ALTER TABLE hippos.tmb_calculations
  ADD COLUMN IF NOT EXISTS requirement_weight NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS formula_type TEXT DEFAULT 'mifflin';

-- Backfill: set requirement_weight = healthy_weight for existing records
UPDATE hippos.tmb_calculations
SET requirement_weight = healthy_weight
WHERE requirement_weight IS NULL;

-- Backfill: set formula_type = 'mifflin' for existing records
UPDATE hippos.tmb_calculations
SET formula_type = 'mifflin'
WHERE formula_type IS NULL;

COMMENT ON COLUMN hippos.tmb_calculations.requirement_weight IS 'Peso RQTO usado en la fórmula de requerimiento (kg). Para DRI puede diferir del peso actual.';
COMMENT ON COLUMN hippos.tmb_calculations.formula_type IS 'Fórmula usada: mifflin (Mifflin-St Jeor) o dri (DRI IOM 2005)';
