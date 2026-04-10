-- ============================================================
-- HIPPOS — Permisos para Supabase (anon / authenticated)
-- ============================================================
-- Error sin esto: "permission denied for schema hippos" (42501)
-- La clave publicable usa el rol `anon` (o `authenticated` si hay JWT).
-- Ejecutar en Supabase Dashboard → SQL Editor (una vez).
-- ============================================================

-- Uso del esquema (obligatorio para cualquier query)
GRANT USAGE ON SCHEMA hippos TO anon, authenticated, service_role;

-- Tipos ENUM del esquema (INSERT/SELECT sobre columnas tipadas)
GRANT USAGE ON TYPE hippos.patient_objective TO anon, authenticated, service_role;
GRANT USAGE ON TYPE hippos.activity_level TO anon, authenticated, service_role;
GRANT USAGE ON TYPE hippos.sex_type TO anon, authenticated, service_role;

-- Tablas y vistas existentes
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA hippos TO anon, authenticated, service_role;

-- Secuencias (por si en el futuro hay SERIAL/IDENTITY)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA hippos TO anon, authenticated, service_role;

-- Funciones (triggers como trigger_set_updated_at)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA hippos TO anon, authenticated, service_role;

-- Objetos nuevos que crees después en este esquema (opcional pero recomendado)
ALTER DEFAULT PRIVILEGES IN SCHEMA hippos GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA hippos GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA hippos GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
