/**
 * Schema Registry — Contratos pedagógicos por tipo de producto.
 *
 * Cada schema valida la respuesta del LLM antes de devolverla al frontend.
 * Si el schema no existe para un agentType, el orchestrator pasa el JSON tal cual.
 */

import { z } from 'zod';
import { PlanificationSchema, validatePlanification, type ValidationResult } from './planificacion';
import { EvaluacionSchema, validateEvaluacion } from './evaluacion';

// ─── Tipo de validador genérico ───

export type SchemaValidator = (data: unknown) => ValidationResult;

// ─── Registry de schemas por agentType ───
// Las claves deben coincidir con los agentType de types.ts

export const SCHEMA_REGISTRY: Record<string, z.ZodSchema> = {
  planificacion: PlanificationSchema,
  evaluacion: EvaluacionSchema,
  // Próximamente:
  // rubrica: RubricaSchema,
  // guia_dua: GuiaDuaSchema,
  // guia_estudiante: GuiaEstudianteSchema,
  // guia_docente: GuiaDocenteSchema,
};

// ─── Registry de validadores con lógica de negocio ───

export const VALIDATOR_REGISTRY: Record<string, SchemaValidator> = {
  planificacion: validatePlanification,
  evaluacion: validateEvaluacion,
  // Próximamente:
  // rubrica: validateRubric,
};

// ─── Helper: obtener schema para un agentType ───

export function getSchemaForAgent(agentType: string): z.ZodSchema | null {
  return SCHEMA_REGISTRY[agentType] || null;
}

// ─── Helper: obtener validador para un agentType ───

export function getValidatorForAgent(agentType: string): SchemaValidator | null {
  return VALIDATOR_REGISTRY[agentType] || null;
}

// ─── Re-exportar schemas para uso externo ───

export { PlanificationSchema, validatePlanification } from './planificacion';
export type { Planification, PlanificationClass } from './planificacion';
export { EvaluacionSchema, validateEvaluacion } from './evaluacion';
export type { Evaluacion, Question, AlternativaQuestion, VFQuestion, DesarrolloQuestion, AnswerKey } from './evaluacion';
