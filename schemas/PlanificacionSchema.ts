import { z } from 'zod';

export const UNIT_MAX = 200;
export const CLASS_OBJECTIVE_MAX = 400;
export const CLASS_STAGE_MAX = 2000;
export const CLASS_DURATION_MAX = 50;
export const CLASS_MATERIAL_MAX = 500;
export const CLASS_ASSESSMENT_MAX = 500;
export const METHODOLOGY_MAX = 500;
export const DUA_ITEM_MAX = 1500;
export const EVALUATION_MAX = 500;

const MIN_CLASSES = 3;
const MAX_CLASSES = 5;
const MIN_MATERIALS = 1;
const MAX_MATERIALS = 15;
const MIN_DUA = 1;
const MAX_DUA = 10;

// Alineado 1:1 con la estructura JSON declarada en el prompt "planificacion"
// de functions/api/materials/generate.ts (buildMaterialPrompt) — "3-5 clases"
// ahí es el mismo límite que MIN_CLASSES/MAX_CLASSES acá. Si se cambia el
// prompt, este schema debe cambiar junto con él (mismo tipo de desajuste que
// causó el bug de los 4 layouts faltantes en PptDeckSchema).
export const PlanificacionClaseSchema = z.object({
  number: z.number().int().positive(),
  objective: z.string().min(1).max(CLASS_OBJECTIVE_MAX),
  opening: z.string().min(1).max(CLASS_STAGE_MAX),
  development: z.string().min(1).max(CLASS_STAGE_MAX),
  closure: z.string().min(1).max(CLASS_STAGE_MAX),
  duration: z.string().min(1).max(CLASS_DURATION_MAX),
  materials: z.array(z.string().min(1).max(CLASS_MATERIAL_MAX)).min(MIN_MATERIALS).max(MAX_MATERIALS),
  assessment: z.string().min(1).max(CLASS_ASSESSMENT_MAX),
});

export const PlanificacionSchema = z.object({
  unit: z.string().min(1).max(UNIT_MAX),
  classes: z.array(PlanificacionClaseSchema).min(MIN_CLASSES).max(MAX_CLASSES),
  methodology: z.string().min(1).max(METHODOLOGY_MAX),
  dua: z.array(z.string().min(1).max(DUA_ITEM_MAX)).min(MIN_DUA).max(MAX_DUA),
  evaluation: z.string().min(1).max(EVALUATION_MAX),
}).refine(
  (plan) => {
    const numbers = plan.classes.map((c) => c.number);
    return numbers.length === new Set(numbers).size;
  },
  { message: 'classes[].number no puede repetirse' },
);

export type PlanificacionClase = z.infer<typeof PlanificacionClaseSchema>;
export type Planificacion = z.infer<typeof PlanificacionSchema>;
