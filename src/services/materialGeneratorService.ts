/**
 * Material Generator Service
 * Connects frontend to /api/materials/* endpoints
 */

export type FormativeEvaluationType =
  | 'evaluation_exit_ticket'
  | 'evaluation_321'
  | 'evaluation_checklist'
  | 'evaluation_formative_rubric'
  | 'evaluation_traffic_light';

import type { ClassroomScientificNotebook } from '../types/scientificNotebook';

export interface MaterialRequest {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  indicators?: string[];
  skills?: string[];
  topic: string;
  additionalContext?: string;
  methodology?: string;
  designStyle?: string;
  duration?: string;
  studentCount?: number;
  questionCount?: number;
  difficulty?: string;
  type?: string;
  criteria?: string[];
  evaluationSubType?: FormativeEvaluationType;
}

export interface MaterialResult {
  ok: boolean;
  resourceId?: string;
  guide?: unknown;
  evaluation?: unknown;
  rubric?: unknown;
  slides?: unknown[];
  prompt?: string;
  context?: unknown;
  error?: string;
}

async function postJSON(url: string, body: MaterialRequest): Promise<MaterialResult> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function generateGuide(req: MaterialRequest, type: 'guia_estudiante' | 'guia_docente'): Promise<MaterialResult> {
  return postJSON(`/api/materials/guide?type=${type}`, { ...req, type });
}

export async function generateEvaluation(req: MaterialRequest): Promise<MaterialResult> {
  return postJSON('/api/materials/evaluation', req);
}

export async function generateFormativeEvaluation(req: MaterialRequest, subType: FormativeEvaluationType): Promise<MaterialResult> {
  return postJSON('/api/materials/evaluation/formative', { ...req, evaluationSubType: subType });
}

export async function generateRubric(req: MaterialRequest): Promise<MaterialResult> {
  return postJSON('/api/materials/rubric', req);
}

export async function generatePresentation(req: MaterialRequest): Promise<MaterialResult> {
  return postJSON('/api/materials/presentation', req);
}

export async function generateMaterial(req: MaterialRequest, type: string): Promise<MaterialResult> {
  return postJSON(`/api/materials/generate?type=${type}`, req);
}

export async function generateBitacoraCientifica(req: MaterialRequest): Promise<MaterialResult> {
  return postJSON('/api/materials/bitacora-cientifica', req);
}

/**
 * Legacy Bitacora Cientifica Response Format
 * The old format returned by the backend before schema upgrade
 */
interface LegacyBitacoraResponse {
  title: string;
  subtitle: string;
  objective: string;
  type: string;
  modelo: string;
  estructura: Array<{
    titulo: string;
    descripcion: string;
    campos: string[];
  }>;
  indicadores: string[];
  skills: string[];
  topic: string;
  additionalContext?: string;
  methodology?: string;
  premiumExtras: {
    fotografias: boolean;
    dibujos: boolean;
    audio: boolean;
    video: boolean;
    tablas: boolean;
    graficos: boolean;
    evidencias: boolean;
    exportPDF: boolean;
    exportWord: boolean;
    exportPowerPoint: boolean;
  };
  portfolio: {
    autoSave: boolean;
    associateClass: boolean;
    associateOA: boolean;
    associateTeacher: boolean;
    editable: boolean;
    exportable: string[];
  };
  safetyMeasures: string[];
  teacherNotes: string;
}

/**
 * Normalizes legacy bitacora response to ClassroomScientificNotebook format
 * Uses normalizeEducationLevel exclusively for education level detection
 */
export function normalizeScientificNotebookResponse(raw: unknown): ClassroomScientificNotebook | null {
  try {
    // If already in new format, validate and return
    const candidate = raw as Record<string, unknown> | null;
    if (candidate?.metadata && typeof candidate.metadata === 'object' && 'educationGroup' in (candidate.metadata as Record<string, unknown>)) {
      return raw as ClassroomScientificNotebook;
    }

    const legacy = raw as LegacyBitacoraResponse;
    
    if (!legacy || !legacy.type || legacy.type !== 'bitacora_cientifica') {
      return null;
    }

    // Extract level from the original request (stored in the response context)
    // The nivel is not directly in the response, but we can infer from modelo
    const modelo = legacy.modelo || '';
    let educationGroup: 'prebasica' | 'basica_1_6' | 'basica_7_8' | 'media' = 'basica_1_6';
    
    if (modelo === 'PREBÁSICA') {
      educationGroup = 'prebasica';
    } else if (modelo === '1° A 6° BÁSICO') {
      educationGroup = 'basica_1_6';
    } else if (modelo === '7° Y 8° BÁSICO') {
      educationGroup = 'basica_7_8';
    } else if (modelo === 'ENSEÑANZA MEDIA') {
      educationGroup = 'media';
    }

    // Build the normalized notebook
    const notebook = {
      metadata: {
        title: legacy.title || 'Bitácora Científica',
        subtitle: legacy.subtitle || '',
        level: '', // Will be filled by postProcess
        educationGroup,
        subject: legacy.subtitle?.split('—')[1]?.trim() || '',
        oaCode: legacy.estructura?.[0]?.campos?.[0] || '',
        oaText: legacy.objective || '',
        topic: legacy.topic || '',
        date: new Date().toLocaleDateString('es-CL'),
        teacherName: '',
        estimatedTime: 45,
      },
      intro: {
        motivatingQuestion: '¿Qué observamos hoy en nuestro experimento?',
        childFriendlyExplanation: 'Vamos a realizar un experimento científico y registrar nuestros hallazgos.',
        visualPrompt: 'Observa atentamente los materiales y el procedimiento.',
        priorKnowledgePrompt: 'Piensa en qué ya sabes sobre este tema.',
      },
      materials: legacy.estructura?.find((e) => e.titulo?.includes('Material'))?.campos?.map((c: string) => ({
        name: c,
        quantity: '1',
        icon: '🧪',
        safetyNote: 'Manipular con cuidado',
      })) || [
        { name: 'Materiales básicos', quantity: '1 set', icon: '🧪', safetyNote: 'Usar con supervisión' }
      ],
      procedure: legacy.estructura?.find((e) => e.titulo?.includes('Procedimiento'))?.campos?.map((c: string, i: number) => ({
        step: i + 1,
        instruction: c,
        teacherSupport: 'Guía al estudiante en este paso',
        studentAction: 'Realiza la acción descrita',
        visualCue: 'Muestra el paso',
        estimatedMinutes: 10,
      })) || [
        {
          step: 1,
          instruction: 'Prepara los materiales para el experimento',
          teacherSupport: 'Ayuda al estudiante a organizar los materiales',
          studentAction: 'Organiza los materiales en tu mesa',
          visualCue: 'Muestra los materiales',
          estimatedMinutes: 10,
        }
      ],
      observationRecords: [
        {
          date: new Date().toLocaleDateString('es-CL'),
          observation: 'Observaciones del experimento',
          change: 'Cambios observados',
          drawingPrompt: 'dibuja lo que observaste',
          climate: 'condiciones del aula',
          measurement: 'datos cualitativos',
          evidenceType: 'observación directa',
        }
      ],
      tables: [
        {
          id: 'observaciones_generales',
          title: 'Registro de Observaciones',
          headers: ['Fecha', 'Observación', 'Cambio', 'Clima', 'Medición'],
          rows: [['', '', '', '', '']],
          editable: true,
          studentFillable: true,
          columnTypes: ['fecha', 'texto', 'texto', 'texto', 'texto'],
        }
      ],
      drawingAreas: [
        {
          title: 'Espacio de Dibujo Principal',
          instruction: 'Dibuja lo que observaste en el experimento',
          size: 'large' as const,
          borderStyle: 'solid' as const,
        }
      ],
      questions: {
        before: '¿Qué crees que pasará en el experimento?',
        during: '¿Qué observas mientras realizas el experimento?',
        after: '¿Qué concluiste del experimento?',
        newQuestions: ['¿Qué pasaría si cambiamos...?', '¿Por qué ocurrió esto?']
      },
      hypothesis: {
        enabled: false,
        prompt: '',
        sentenceStarter: '',
        drawingOption: '',
      },
      conclusion: {
        prompt: '¿Qué aprendiste en este experimento?',
        sentenceStarter: 'Aprendí que...',
        teacherDictationAllowed: true,
        evidenceReference: 'Basado en mis observaciones',
      },
      dua: {
        pictograms: ['👂', '👀', '👃', '👄'],
        oralResponse: 'Cuenta a tu grupo lo que observaste hoy.',
        drawingResponse: 'Describe tu dibujo: ¿qué muestra? ¿por qué es importante?',
        sentenceStarters: ['Observé que...', 'Sentí que...', 'Mi dibujo muestra...'],
        reducedText: 'Observé cambios en el experimento.',
        challengeExtension: 'Investiga: ¿Cómo crees que esto afecta a otros seres vivos?',
      },
      assessment: {
        checklist: [
          'Observé cuidadosamente el experimento',
          'Dibujé lo que observé',
          'Compartí mis hallazgos con el grupo',
          'Respondí las preguntas sobre lo observado',
        ],
        selfAssessment: [
          '¿Seguí el procedimiento correctamente?',
          '¿Mi dibujo muestra claramente lo observado?',
          '¿Pude explicar mis hallazgos al grupo?',
        ],
        teacherFeedback: 'Buen trabajo observando y registrando el experimento.',
        evidenceCriteria: [
          'Observación completada',
          'Dibujo realizado',
          'Compartición grupal',
        ],
      },
      portfolio: {
        photos: [],
        audio: [],
        video: [],
        attachments: [],
        timeline: [],
      },
      exports: {
        pdf: true,
        word: true,
        print: true,
        ppt: false,
      },
    };

    return postProcessScientificNotebook(notebook);
  } catch (error) {
    console.error('Error normalizing scientific notebook:', error);
    return null;
  }
}

// Re-export the types needed
export type { ClassroomScientificNotebook } from '../types/scientificNotebook';

// Simple post-process function (can be expanded later)
function postProcessScientificNotebook(notebook: ClassroomScientificNotebook): ClassroomScientificNotebook {
  // Ensure drawing areas exist
  if (!notebook.drawingAreas || notebook.drawingAreas.length === 0) {
    notebook.drawingAreas = [
      {
        title: 'Espacio de Dibujo Principal',
        instruction: 'Dibuja lo que observaste en el experimento. Incluye colores, formas y cualquier detalle importante.',
        size: 'large',
        borderStyle: 'solid',
      },
    ];
  }

  // Ensure DUA content exists
  if (!notebook.dua.oralResponse || notebook.dua.oralResponse.trim().length === 0) {
    notebook.dua.oralResponse = 'Puedes contar a tu compañere lo que observaste usando tus propias palabras.';
  }

  if (!notebook.dua.drawingResponse || notebook.dua.drawingResponse.trim().length === 0) {
    notebook.dua.drawingResponse = 'Describe lo que dibujaste y por qué es importante.';
  }

  // Ensure hypothesis is appropriately enabled for level
  const level = notebook.metadata.educationGroup;
  if (level === 'prebasica') {
    notebook.hypothesis.enabled = false;
    notebook.hypothesis.prompt = 'Observaciones: ' + (notebook.procedure[0]?.instruction?.substring(0, 50) || '') + '...\n¿Qué crees que podría pasar si...?';
  } else if (level === 'basica_1_6') {
    notebook.hypothesis.enabled = true;
    if (!notebook.hypothesis.prompt) {
      notebook.hypothesis.prompt = 'Si ' + (notebook.metadata.oaText.split('.')[0] || '') + '... ¿qué deberíamos esperar?';
    }
  } else if (level === 'basica_7_8' || level === 'media') {
    notebook.hypothesis.enabled = true;
    if (!notebook.hypothesis.prompt) {
      notebook.hypothesis.prompt = 'Si ' + notebook.metadata.oaText.split('.')[0] + ', ¿cuál es el efecto esperado?';
    }
  }

  // Ensure assessment content exists
  if (notebook.assessment.checklist.length === 0) {
    notebook.assessment.checklist = [
      'Seguí el procedimiento correctamente',
      'Observé cuidadosamente lo que sucedió',
      'Dibujé con detalle lo observado',
      'Compartí mis hallazgos con el grupo',
      'Hice preguntas de seguimiento',
    ];
  }

  if (!notebook.assessment.teacherFeedback || notebook.assessment.teacherFeedback.trim().length === 0) {
    notebook.assessment.teacherFeedback = 'Buen trabajo completando el experimento científico. Revisa tu dibujo y compartelo con tus compañeres.'
  }

  // Set default estimated times if missing
  if (!notebook.metadata.estimatedTime || notebook.metadata.estimatedTime <= 0) {
    notebook.metadata.estimatedTime = 45;
  }

  // Set default export flags if missing
  notebook.exports.pdf = true;
  notebook.exports.print = true;

  return notebook;
}