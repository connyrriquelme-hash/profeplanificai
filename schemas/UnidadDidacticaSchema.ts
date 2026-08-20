import { z } from 'zod';

export const TITULO_MAX = 120;
export const NIVEL_MAX = 40;
export const ASIGNATURA_MAX = 80;
export const OA_CODE_MAX = 30;
export const FASE_NOMBRE_MAX = 60;
export const FASE_DESCRIPCION_MAX = 300;
export const CLASE_TEMA_MAX = 100;
export const OBJETIVO_ESPECIFICO_MAX = 300;
// 500 (valor original) resultaba muy justo para "desarrollo": la regla 5 de
// UnidadDidacticaEngine.ts exige minimo 3 pasos concretos (modelado ->
// practica guiada -> practica independiente) aplicados al contenido
// especifico del OA, ademas de tiempoMinutos por etapa. PlanificacionEngine
// tuvo el mismo problema con su campo equivalente (opening/development/
// closure) y lo resolvio subiendo el limite a 2000 (ver
// PlanificacionEngine.ts:86-95) — acá se sube a 900, no a 2000, porque esta
// unidad permite hasta 12 clases (vs. 3-5 de Planificacion) con menos
// maxTokens por clase disponible.
export const ETAPA_DESCRIPCION_MAX = 900;
export const ETAPA_TIEMPO_MAX_MINUTOS = 180;

const MIN_OAS = 1;
const MAX_OAS = 8;
const MIN_FASES = 2;
const MAX_FASES = 8;
const MIN_CLASES = 2;
const MAX_CLASES = 12;

// Alineado 1:1 con MetodologiaActiva en
// src/components/UnidadesDidacticasView.tsx:12 — el payload que ya arma
// el frontend hoy usa exactamente estos 5 valores.
export const METODOLOGIAS_ACTIVAS = [
  'Tradicional',
  'ABP',
  'Gamificacion',
  'Aula Invertida',
  'Design Thinking',
] as const;

export const MetodologiaActivaSchema = z.enum(METODOLOGIAS_ACTIVAS);

// Misma estructura anidada que LessonStage / PedagogicalPlan.estructura_clase
// en functions/core/types.ts (inicio/desarrollo/cierre como objetos), pero en
// camelCase — consistente con el resto de este schema. El snake_case de
// LessonStage es un artefacto heredado, no la convención del proyecto. Si en
// el futuro se conecta una clase de la unidad a PptContentEngine/
// generateDeckContent, se traduce con un adaptador chico
// (tiempoMinutos -> tiempo_minutos) en ese punto de integración.
export const EtapaClaseSchema = z.object({
  tiempoMinutos: z.number().int().positive().max(ETAPA_TIEMPO_MAX_MINUTOS),
  descripcion: z.string().min(1).max(ETAPA_DESCRIPCION_MAX),
});

export const FaseMetodologicaSchema = z.object({
  nombre: z.string().min(1).max(FASE_NOMBRE_MAX),
  descripcion: z.string().min(1).max(FASE_DESCRIPCION_MAX),
  orden: z.number().int().nonnegative(),
});

export const ClaseUnidadSchema = z.object({
  numero: z.number().int().positive(),
  faseAsociada: z.string().min(1).max(FASE_NOMBRE_MAX),
  tema: z.string().min(1).max(CLASE_TEMA_MAX),
  objetivoEspecifico: z.string().min(1).max(OBJETIVO_ESPECIFICO_MAX),
  estructuraClase: z.object({
    inicio: EtapaClaseSchema,
    desarrollo: EtapaClaseSchema,
    cierre: EtapaClaseSchema,
  }),
});

export const UnidadDidacticaSchema = z.object({
  titulo: z.string().min(1).max(TITULO_MAX),
  nivel: z.string().min(1).max(NIVEL_MAX),
  asignatura: z.string().min(1).max(ASIGNATURA_MAX),
  metodologiaActiva: MetodologiaActivaSchema,
  objetivosAprendizaje: z.array(z.string().min(1).max(OA_CODE_MAX)).min(MIN_OAS).max(MAX_OAS),
  fases: z.array(FaseMetodologicaSchema).min(MIN_FASES).max(MAX_FASES),
  clases: z.array(ClaseUnidadSchema).min(MIN_CLASES).max(MAX_CLASES),
}).refine(
  (unidad) => {
    const nombresFases = new Set(unidad.fases.map((f) => f.nombre));
    return unidad.clases.every((c) => nombresFases.has(c.faseAsociada));
  },
  { message: 'Cada clases[].faseAsociada debe coincidir con un fases[].nombre existente' },
).refine(
  (unidad) => {
    const numeros = unidad.clases.map((c) => c.numero);
    return numeros.length === new Set(numeros).size;
  },
  { message: 'clases[].numero no puede repetirse' },
).refine(
  (unidad) => {
    const ordenes = unidad.fases.map((f) => f.orden);
    return ordenes.length === new Set(ordenes).size;
  },
  { message: 'fases[].orden no puede repetirse' },
);

export type MetodologiaActiva = z.infer<typeof MetodologiaActivaSchema>;
export type EtapaClase = z.infer<typeof EtapaClaseSchema>;
export type FaseMetodologica = z.infer<typeof FaseMetodologicaSchema>;
export type ClaseUnidad = z.infer<typeof ClaseUnidadSchema>;
export type UnidadDidactica = z.infer<typeof UnidadDidacticaSchema>;
