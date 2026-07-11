import { AIEngine } from '../core/AIEngine';
import { PedagogicalEngine } from '../core/PedagogicalEngine';
import type { AIEngineEnv, PedagogicalEngineEnv } from '../core/types';

interface GenerateProjectEnv extends PedagogicalEngineEnv, AIEngineEnv {}

interface GenerateProjectRequest {
  nivel?: string;
  asignatura?: string;
  tema?: string;
  objectiveId?: string;
  objectiveCode?: string;
  objectiveText?: string;
  indicators?: string[];
  skills?: string[];
  criteria?: string[];
  curricularSkills?: string[];
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function getEnvFlag(env: any, key: string, defaultValue: boolean): boolean {
  const val = env[key];
  if (val === undefined || val === null) return defaultValue;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val.toLowerCase() === 'true' || val === '1';
  return Boolean(val);
}

function buildPedagogicalContextFromPlan(plan: any): any {
  const habilidades = plan.habilidades 
    ? plan.habilidades.split(',').map((h: string) => h.trim()).filter(Boolean)
    : [];
  
  const indicadores = (plan.indicadores_seleccionados || []).map((ind: string, idx: number) => ({
    id: idx + 1,
    indicator_text: ind,
    observable_action: '',
    bloom_level: '',
    skill_tag: ''
  }));

  const criterios = plan.criterios_seleccionados || [];

  return {
    nivel: plan.curso,
    asignatura: plan.asignatura,
    tema: plan.tema,
    oa: {
      codigo: plan.objetivo_aprendizaje?.split(':')[0]?.trim() || '',
      descripcion: plan.objetivo_aprendizaje?.split(':').slice(1).join(':').trim() || plan.objetivo_aprendizaje || '',
      habilidades_csv: plan.habilidades || '',
      unidad_titulo: '',
      unidad_numero: 0,
      eje: '',
      eje_descripcion: '',
      bloom_level: plan.taxonomia_bloom_sugerida || ''
    },
    indicadores,
    habilidades,
    habilidades_sugeridas: [],
    criterios_aprendizaje: criterios,
    habilidades_curriculares: plan.habilidades_curriculares 
      ? plan.habilidades_curriculares.split(',').map((h: string) => h.trim()).filter(Boolean)
      : [],
    contexto_clase: {
      nivel: plan.curso,
      curso: plan.curso,
      asignatura: plan.asignatura,
      cantidad_estudiantes: 30,
      estudiantes_nee: 0,
      tipos_nee: [],
      recursos_disponibles: ['Pizarra', 'Proyector', 'Material didáctico'],
      duracion_minutos: 90,
      metodologia_sugerida: 'Activa/Colaborativa'
    },
    planificacion_existente: { tiene_planificacion: false },
    recursos: [],
    dua: {
      nivel_apoyo: [],
      nivel_estandar: [],
      nivel_desafio: [],
      representacion: [],
      accion_expresion: [],
      implicacion: []
    },
    evaluaciones_relacionadas: [],
    productos_previos: [],
    barreras_aprendizaje: [],
    adaptaciones_sugeridas: {}
  };
}

export async function onRequestPost(context: EventContext<GenerateProjectEnv>): Promise<Response> {
  try {
    const body = await context.request.json<GenerateProjectRequest>();
    const nivel = String(body.nivel || '').trim();
    const asignatura = String(body.asignatura || '').trim();
    const tema = String(body.tema || '').trim();

    if (!nivel || !asignatura || !tema) {
      return jsonResponse({ ok: false, error: 'nivel, asignatura y tema son obligatorios.' }, 400);
    }

    const selectedObjectiveCode = String(body.objectiveCode || '').trim();

    if (!selectedObjectiveCode) {
      return jsonResponse({ ok: false, error: 'Selecciona un objetivo de aprendizaje antes de generar' }, 400);
    }

    const curriculumContext = {
      objectiveId: String(body.objectiveId || '').trim(),
      objectiveCode: selectedObjectiveCode,
      objectiveText: String(body.objectiveText || '').trim(),
      indicators: Array.isArray(body.indicators) ? body.indicators.filter(Boolean) : [],
      skills: Array.isArray(body.skills) ? body.skills.filter(Boolean) : [],
      criteria: Array.isArray(body.criteria) ? body.criteria.filter(Boolean) : [],
      curricularSkills: Array.isArray(body.curricularSkills) ? body.curricularSkills.filter(Boolean) : [],
    };

    const plan = await PedagogicalEngine.buildPlan(context.env, nivel, asignatura, tema, curriculumContext);
    const duaGuide = await AIEngine.generateDuaGuide(context.env, plan);

    // DIAGNOSTIC LOGS
    const rawFlag = context.env.ENABLE_PREMIUM_PLANNING_AGENT;
    const usePremiumPlanning = getEnvFlag(context.env, 'ENABLE_PREMIUM_PLANNING_AGENT', false);
    console.log('[DIAG] ENABLE_PREMIUM_PLANNING_AGENT raw:', rawFlag, '| parsed:', usePremiumPlanning, '| type:', typeof rawFlag);
    
    let premiumPlanning = null;
    let usedPremiumPlanning = false;

    if (usePremiumPlanning) {
      console.log('[DIAG] Entering PlanningAgent block');
      try {
        const { PlanningAgent } = await import('../core/PlanningAgent');
        const { ContextEngine } = await import('../core/ContextEngine');
        
        const pedagogicalContext = buildPedagogicalContextFromPlan(plan);
        
        const planningAgent = new PlanningAgent(context.env);
        console.log('[DIAG] PlanningAgent instantiated, calling generate...');
        const result = await planningAgent.generate({}, {
          pedagogicalContext,
          userParams: { nivel, asignatura, tema }
        });
        console.log('[DIAG] PlanningAgent result:', {
          hasContent: !!result.content,
          validationPassed: result.validation?.passed,
          validationErrors: result.validation?.errors,
          agent: result.metadata?.agent
        });

        if (result.content && result.validation.passed) {
          premiumPlanning = result.content;
          usedPremiumPlanning = true;
          
          if (context.env.NODE_ENV === 'development' || context.env.DEBUG) {
            console.log('[PlanningAgent] Generación exitosa:', {
              agente: result.metadata.agent,
              calidad: result.metadata.quality_score,
              confianza: result.metadata.confidence
            });
          }
        } else if (context.env.NODE_ENV === 'development' || context.env.DEBUG) {
          console.warn('[PlanningAgent] Validación fallida, usando fallback:', result.validation.errors);
        }
      } catch (error) {
        if (context.env.NODE_ENV === 'development' || context.env.DEBUG) {
          console.warn('[PlanningAgent] Error, usando fallback:', error instanceof Error ? error.message : String(error));
        }
      }
    }

    const responseData: any = {
      ok: true,
      plan,
      duaGuide,
      data: {
        ...plan,
        ...duaGuide,
      },
    };

    if (usedPremiumPlanning && premiumPlanning) {
      responseData.premiumPlanning = premiumPlanning;
      responseData.usedPremiumPlanning = true;
    }

    return jsonResponse(responseData);
  } catch (error) {
    console.error('[generate-project] Error:', error);
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('No se encontró OA') || message.includes('No se encontró el OA seleccionado')) {
      return jsonResponse({ ok: false, error: 'No se encontró un objetivo de aprendizaje para los parámetros indicados.' }, 404);
    }

    if (message.includes('CORE_DB') || message.includes('AI no está configurado')) {
      return jsonResponse({ ok: false, error: 'Error de configuración del servidor.' }, 500);
    }

    return jsonResponse({ ok: false, error: 'No se pudo generar el proyecto pedagógico.' }, 500);
  }
}

export async function onRequest(): Promise<Response> {
  return jsonResponse({ ok: false, error: 'Método no permitido. Use POST.' }, 405);
}