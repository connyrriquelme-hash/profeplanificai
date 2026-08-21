-- ============================================================
-- MIGRACIÓN 018: Marca institucional — logo y color en documentos
-- Fecha: 2026-08-21
-- Propósito: Permitir que cada institución tenga un logo y un color
-- primario aplicados a los materiales generados (Fase 2 del roadmap
-- Canva/Chalkie del diagnóstico).
-- ============================================================

ALTER TABLE institutions ADD COLUMN logo_url TEXT;
ALTER TABLE institutions ADD COLUMN primary_color TEXT;
