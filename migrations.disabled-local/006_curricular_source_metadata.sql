-- Migration 006: Add source_type and source_name columns to curricular enrichment tables
-- Run once before seed_curricular_enrichment.sql

ALTER TABLE objective_indicators ADD COLUMN source_type TEXT NOT NULL DEFAULT 'official';
ALTER TABLE objective_indicators ADD COLUMN source_name TEXT NOT NULL DEFAULT 'Currículum Nacional — MINEDUC Chile';

ALTER TABLE textbook_references ADD COLUMN source_type TEXT NOT NULL DEFAULT 'official';
ALTER TABLE textbook_references ADD COLUMN source_name TEXT NOT NULL DEFAULT 'Currículum Nacional — MINEDUC Chile';

ALTER TABLE teacher_guide_references ADD COLUMN source_type TEXT NOT NULL DEFAULT 'official';
ALTER TABLE teacher_guide_references ADD COLUMN source_name TEXT NOT NULL DEFAULT 'Currículum Nacional — MINEDUC Chile';

ALTER TABLE curricular_resource_links ADD COLUMN source_type TEXT NOT NULL DEFAULT 'official';

ALTER TABLE lesson_sequence_recommendations ADD COLUMN source_type TEXT NOT NULL DEFAULT 'official';
ALTER TABLE lesson_sequence_recommendations ADD COLUMN source_name TEXT NOT NULL DEFAULT 'Análisis pedagógico curricular';
