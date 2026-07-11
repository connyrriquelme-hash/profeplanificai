import { BaseAgent, type BaseAgentConfig } from '../BaseAgent';
import { getAgentPrompt } from '../promptLoader';
import type { PedagogicalContext } from '../ContextEngine';

export interface PlanningPhase {
  tiempo_minutos: number;
  proposito: string;
  acciones_docente: string[];
  acciones_estudiantes: string[];
  recursos: string[];
  evidencia: string;
  preguntas_metacognitivas?: string[];
  errores_frecuentes?: string[];
  diferenciacion?: {
    apoyo: string[];
    estandar: string[];
    desafio: string[];
  };
  dua?: {
    representacion: string[];
    accion_expresion: string[];
    implicacion: string[];
  };
}

export interface PlanningOutput {
  metadata: {
    oa_codigo: string;
    oa_descripcion: string;
    nivel: string;
    asignatura: string;
    tema: string;
    duracion_total_minutos: number;
    taxonomia_bloom: string;
    generado_en: string;
    agente: string;
  };
  contextoCurricular: {
    objetivo_aprendizaje: string;
    indicadores: string[];
    habilidades: string[];
    habilidades_sugeridas?: string[];
    criterios_aprendizaje: string[];
    eje: string;
    unidad: string;
  };
  inicio: PlanningPhase;
  desarrollo: PlanningPhase;
  cierre: PlanningPhase;
  evaluacionFormativa: {
    estrategias: string[];
    evidencias_observables: string[];
    lista_cotejo: string[];
    opciones_respuesta: string[];
    retroalimentacion_docente: string[];
  };
  adaptacionesDUA: {
    apoyo: string[];
    estandar: string[];
    desafio: string[];
    representacion: string[];
    accion_expresion: string[];
    implicacion: string[];
    barreras_identificadas: string[];
    adecuaciones_por_perfil: Record<string, string[]>;
  };
  recursos: Array<{
    titulo: string;
    tipo: string;
    descripcion: string;
    url?: string;
  }>;
  erroresFrecuentes: string[];
  preguntasMetacognitivas: string[];
  extension: {
    tarea_domiciliaria?: string;
    profundizacion?: string;
    conexion_interdisciplinar?: string;
  };
  seguimientoDocente: {
    proximos_pasos: string[];
    alertas: string[];
    registro_sugerido: string[];
  };
}

function validatePhase(phase: any, phaseName: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (typeof phase.tiempo_minutos !== 'number' || phase.tiempo_minutos < 1) {
    errors.push(`${phaseName}: tiempo_minutos debe ser número >= 1`);
  }
  if (typeof phase.proposito !== 'string' || phase.proposito.length < 10) {
    errors.push(`${phaseName}: proposito debe ser string >= 10 chars`);
  }
  if (!Array.isArray(phase.acciones_docente) || phase.acciones_docente.length === 0) {
    errors.push(`${phaseName}: acciones_docente requerido (array no vacío)`);
  }
  if (!Array.isArray(phase.acciones_estudiantes) || phase.acciones_estudiantes.length === 0) {
    errors.push(`${phaseName}: acciones_estudiantes requerido (array no vacío)`);
  }
  if (!Array.isArray(phase.recursos) || phase.recursos.length === 0) {
    errors.push(`${phaseName}: recursos requerido (array no vacío)`);
  }
  if (typeof phase.evidencia !== 'string' || phase.evidencia.length < 10) {
    errors.push(`${phaseName}: evidencia requerido (string >= 10 chars)`);
  }
  
  return { valid: errors.length === 0, errors };
}

function validatePlanningOutput(content: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!content || typeof content !== 'object') {
    return { valid: false, errors: ['El contenido no es un objeto válido'] };
  }

  // Validate metadata
  const meta = content.metadata;
  if (!meta) errors.push('Falta metadata');
  else {
    if (!meta.oa_codigo) errors.push('metadata.oa_codigo requerido');
    if (!meta.oa_descripcion) errors.push('metadata.oa_descripcion requerido');
    if (!meta.nivel) errors.push('metadata.nivel requerido');
    if (!meta.asignatura) errors.push('metadata.asignatura requerido');
    if (!meta.tema) errors.push('metadata.tema requerido');
    if (typeof meta.duracion_total_minutos !== 'number') errors.push('metadata.duracion_total_minutos requerido (number)');
    if (!meta.taxonomia_bloom) errors.push('metadata.taxonomia_bloom requerido');
    if (!meta.generado_en) errors.push('metadata.generado_en requerido');
    if (!meta.agente) errors.push('metadata.agente requerido');
  }

  // Validate contextoCurricular
  const ctx = content.contextoCurricular;
  if (!ctx) errors.push('Falta contextoCurricular');
  else {
    if (!ctx.objetivo_aprendizaje) errors.push('contextoCurricular.objetivo_aprendizaje requerido');
    if (!Array.isArray(ctx.indicadores) || ctx.indicadores.length === 0) errors.push('contextoCurricular.indicadores requerido (array no vacío)');
    if (!Array.isArray(ctx.habilidades) || ctx.habilidades.length === 0) errors.push('contextoCurricular.habilidades requerido (array no vacío)');
    if (!Array.isArray(ctx.criterios_aprendizaje) || ctx.criterios_aprendizaje.length === 0) errors.push('contextoCurricular.criterios_aprendizaje requerido (array no vacío)');
    if (!ctx.eje) errors.push('contextoCurricular.eje requerido');
    if (!ctx.unidad) errors.push('contextoCurricular.unidad requerido');
  }

  // Validate phases
  for (const phaseName of ['inicio', 'desarrollo', 'cierre']) {
    const phase = content[phaseName];
    if (!phase) errors.push(`Falta fase: ${phaseName}`);
    else {
      const result = validatePhase(phase, phaseName);
      errors.push(...result.errors);
    }
  }

  // Validate evaluacionFormativa
  const evalF = content.evaluacionFormativa;
  if (!evalF) errors.push('Falta evaluacionFormativa');
  else {
    for (const field of ['estrategias', 'evidencias_observables', 'lista_cotejo', 'opciones_respuesta', 'retroalimentacion_docente']) {
      if (!Array.isArray(evalF[field]) || evalF[field].length === 0) {
        errors.push(`evaluacionFormativa.${field} requerido (array no vacío)`);
      }
    }
  }

  // Validate adaptacionesDUA
  const dua = content.adaptacionesDUA;
  if (!dua) errors.push('Falta adaptacionesDUA');
  else {
    for (const field of ['apoyo', 'estandar', 'desafio', 'representacion', 'accion_expresion', 'implicacion', 'barreras_identificadas']) {
      if (!Array.isArray(dua[field]) || dua[field].length === 0) {
        errors.push(`adaptacionesDUA.${field} requerido (array no vacío)`);
      }
    }
    if (typeof dua.adecuaciones_por_perfil !== 'object') {
      errors.push('adaptacionesDUA.adecuaciones_por_perfil requerido (object)');
    }
  }

  // Validate recursos
  if (!Array.isArray(content.recursos)) {
    errors.push('recursos debe ser array');
  }

  // Validate seguimientoDocente
  const seguimiento = content.seguimientoDocente;
  if (!seguimiento) errors.push('Falta seguimientoDocente');
  else {
    for (const field of ['proximos_pasos', 'registro_sugerido']) {
      if (!Array.isArray(seguimiento[field]) || seguimiento[field].length === 0) {
        errors.push(`seguimientoDocente.${field} requerido (array no vacío)`);
      }
    }
    if (!Array.isArray(seguimiento.alertas)) {
      errors.push('seguimientoDocente.alertas requerido (array)');
    }
  }

  return { valid: errors.length === 0, errors };
}

function postProcessPlanning(content: PlanningOutput): PlanningOutput {
  content.recursos = content.recursos || [];
  content.erroresFrecuentes = content.erroresFrecuentes || [];
  content.preguntasMetacognitivas = content.preguntasMetacognitivas || [];
  content.extension = content.extension || {};
  
  content.seguimientoDocente = content.seguimientoDocente || {
    proximos_pasos: [],
    alertas: [],
    registro_sugerido: []
  };

  if (content.metadata && content.inicio && content.desarrollo && content.cierre) {
    const total = content.inicio.tiempo_minutos + content.desarrollo.tiempo_minutos + content.cierre.tiempo_minutos;
    if (content.metadata.duracion_total_minutos !== total) {
      content.metadata.duracion_total_minutos = total;
    }
  }

  return content;
}

export class PlanningAgent extends BaseAgent<PlanningOutput> {
  constructor(env: any, config?: any) {
    const agentConfig: BaseAgentConfig = {
      env,
      systemPrompt: getAgentPrompt('planning_agent'),
      model: config?.model || '@cf/meta/llama-3.2-3b-instruct',
      temperature: config?.temperature ?? 0.3,
      maxTokens: config?.maxTokens ?? 6000,
      validators: [
        (content: PlanningOutput) => validatePlanningOutput(content)
      ],
      postProcessors: [
        (content: PlanningOutput) => Promise.resolve(postProcessPlanning(content))
      ]
    };
    super(agentConfig);
  }

  buildPrompt(context: any, params: any): string {
    const { pedagogicalContext, userParams } = params;
    
    const oa = pedagogicalContext.oa;
    const indicadores = pedagogicalContext.indicadores || [];
    const habilidades = pedagogicalContext.habilidades || [];
    const habilidadesSugeridas = pedagogicalContext.habilidades_sugeridas || [];
    const criterios = pedagogicalContext.criterios_aprendizaje || [];
    const contextoClase = pedagogicalContext.contexto_clase || {};
    const dua = pedagogicalContext.dua || {};
    const barreras = pedagogicalContext.barreras_aprendizaje || [];
    const adaptaciones = pedagogicalContext.adaptaciones_sugeridas || {};
    const recursos = pedagogicalContext.recursos || [];
    const nivel = pedagogicalContext.nivel || '';
    const asignatura = pedagogicalContext.asignatura || '';
    const tema = pedagogicalContext.tema || '';

    const isFirstGrade = /1[°º]\s*b[aá]sico/i.test(nivel);
    const isPreschool = /prekinder|kinder|parvularia/i.test(nivel);
    const isHighSchool = /media|1[1-4].*b[aá]sico/i.test(nivel);
    const isLowerBasic = /[1-4][°º]\s*b[aá]sico/i.test(nivel);

    let nivelGuidance = '';
    if (isPreschool || isFirstGrade) {
      nivelGuidance = `
NIVEL: ${nivel} (Prebásica / 1° Básico)
- Enfoque: juego, exploración, modelaje concreto, pictogramas, tarjetas visuales
- Inicio (10-15 min): activación con objetos, imágenes, canción, rutina breve
- Desarrollo (30-45 min): actividades manipulativas, elección entre 2-3 opciones, trabajo en pareja con roles simples
- Cierre (5-10 min): rutina lúdica, tarjeta de emoción, dibujo rápido, frase iniciadora
- Evaluación: observación, señalamiento, oralidad, dibujo - SIN escritura extensa
- DUA: frases iniciadoras en tarjetas, modelaje visual, 2-3 alternativas de respuesta, rutinas predecibles`;
    } else if (isLowerBasic) {
      nivelGuidance = `
NIVEL: ${nivel} (2°-4° Básico)
- Enfoque: guiado, organizadores gráficos, conversación con criterios, registro simple
- Inicio (10-15 min): activación con preguntas, conexión con experiencias previas
- Desarrollo (40-55 min): exploración guiada, producción con andamiaje, comparación con criterios
- Cierre (10-15 min): síntesis, verificación, ticket de salida
- Evaluación: rúbrica simple, lista de cotejo, opciones de respuesta variadas
- DUA: vocabulario clave visible, frases iniciadoras, organizadores gráficos, trabajo en roles`;
    } else if (!isHighSchool) {
      nivelGuidance = `
NIVEL: ${nivel} (5°-6° Básico)
- Enfoque: autónomo, análisis comparativo, argumentación con evidencia, producción propia
- Inicio (10 min): planteamiento de problema, hipótesis, conexión con contexto
- Desarrollo (50-60 min): investigación guiada, análisis de fuentes, producción argumentada
- Cierre (10-15 min): comunicación de hallazgos, metacognición, retroalimentación entre pares
- Evaluación: rúbrica analítica, autoevaluación, coevaluación
- DUA: múltiples fuentes, opciones de producto, criterios claros, elección de enfoque`;
    } else {
      nivelGuidance = `
NIVEL: ${nivel} (Educación Media)
- Enfoque: crítico, autónomo, vocabulario disciplinar, proyectos, conexión identidad/cultura
- Inicio (10 min): problematización, pregunta esencial, contexto real
- Desarrollo (55-65 min): indagación, análisis crítico, construcción de argumento, producción disciplinar
- Cierre (10-15 min): síntesis disciplinar, proyección, autoevaluación con criterios
- Evaluación: rúbrica disciplinar, portafolio, defensa oral, proyecto
- DUA: fuentes primarias, formatos diversos (ensayo, podcast, infografía), motivación intrínseca`;
    }

    const duracionTotal = contextoClase.duracion_minutos || 90;

    return `CONTEXTO PEDAGÓGICO COMPLETO:

=== OBJETIVO DE APRENDIZAJE ===
Código: ${oa.codigo}
Descripción: ${oa.descripcion}
Habilidades del OA: ${oa.habilidades_csv || 'No especificadas'}
Unidad: ${oa.unidad_titulo || 'No especificada'}
Eje: ${oa.eje || 'No especificado'}
Nivel Bloom: ${oa.bloom_level || 'No especificado'}

=== INDICADORES DE EVALUACIÓN ===
${indicadores.length > 0 ? indicadores.map((i: any, idx: number) => `${idx + 1}. ${i.indicator_text || i} [${i.bloom_level || i.observable_action || ''}]`).join('\n') : 'No hay indicadores seleccionados'}

=== HABILIDADES ===
Curriculares: ${habilidades.join(', ') || 'Ninguna'}
Sugeridas (si curriculares inválidas): ${habilidadesSugeridas.join(', ') || 'Ninguna'}

=== CRITERIOS DE APRENDIZAJE ===
${criterios.length > 0 ? criterios.map((c: string, idx: number) => `${idx + 1}. ${c}`).join('\n') : 'No hay criterios seleccionados'}

=== CONTEXTO DE CLASE ===
Nivel: ${nivel}
Curso: ${contextoClase.curso || 'No especificado'}
Asignatura: ${asignatura}
Tema: ${tema}
Estudiantes: ${contextoClase.cantidad_estudiantes || 'No especificado'}
NEE: ${contextoClase.estudiantes_nee || 0}
Tipos NEE: ${contextoClase.tipos_nee?.join(', ') || 'Ninguno'}
Recursos disponibles: ${contextoClase.recursos_disponibles?.join(', ') || 'Estándar'}
Duración: ${duracionTotal} minutos
Metodología sugerida: ${contextoClase.metodologia_sugerida || 'No especificada'}

=== DUA PREVIO (del motor pedagógico) ===
Nivel Apoyo: ${dua.nivel_apoyo?.join('; ') || 'No especificado'}
Nivel Estándar: ${dua.nivel_estandar?.join('; ') || 'No especificado'}
Nivel Desafío: ${dua.nivel_desafio?.join('; ') || 'No especificado'}
Representación: ${dua.representacion?.join('; ') || 'No especificado'}
Acción/Expresión: ${dua.accion_expresion?.join('; ') || 'No especificado'}
Implicación: ${dua.implicacion?.join('; ') || 'No especificado'}

=== BARRERAS DE APRENDIZAJE IDENTIFICADAS ===
${barreras.length > 0 ? barreras.map((b: string, idx: number) => `${idx + 1}. ${b}`).join('\n') : 'Ninguna identificada'}

=== ADAPTACIONES SUGERIDAS POR PERFIL ===
${Object.entries(adaptaciones).map(([perfil, ads]) => `${perfil}: ${Array.isArray(ads) ? ads.join('; ') : ads}`).join('\n') || 'Ninguna'}

=== RECURSOS DISPONIBLES ===
${recursos.length > 0 ? recursos.map((r: any, idx: number) => `${idx + 1}. ${r.titulo} (${r.tipo}): ${r.descripcion}`).join('\n') : 'Ninguno'}

${nivelGuidance}

=== INSTRUCCIONES DE GENERACIÓN ===
Genera una planificación completa en JSON con esta estructura exacta:

{
  "metadata": {
    "oa_codigo": "${oa.codigo}",
    "oa_descripcion": "${oa.descripcion}",
    "nivel": "${nivel}",
    "asignatura": "${asignatura}",
    "tema": "${tema}",
    "duracion_total_minutos": ${duracionTotal},
    "taxonomia_bloom": "${oa.bloom_level || 'Comprender y Analizar'}",
    "generado_en": "${new Date().toISOString()}",
    "agente": "PlanningAgent"
  },
  "contextoCurricular": {
    "objetivo_aprendizaje": "${oa.codigo}: ${oa.descripcion}",
    "indicadores": [${indicadores.map((i: any) => `"${i.indicator_text || i}"`).join(', ')}],
    "habilidades": [${habilidades.map((h: string) => `"${h}"`).join(', ')}],
    "habilidades_sugeridas": [${habilidadesSugeridas.map((h: string) => `"${h}"`).join(', ')}],
    "criterios_aprendizaje": [${criterios.map((c: string) => `"${c}"`).join(', ')}],
    "eje": "${oa.eje || 'No especificado'}",
    "unidad": "${oa.unidad_titulo || 'No especificada'}"
  },
  "inicio": {
    "tiempo_minutos": <number>,
    "proposito": "<string >= 10 chars>",
    "acciones_docente": ["<string>", "..."],
    "acciones_estudiantes": ["<string>", "..."],
    "recursos": ["<string>", "..."],
    "evidencia": "<string >= 10 chars>",
    "preguntas_metacognitivas": ["<string>", "..."],
    "errores_frecuentes": ["<string>", "..."],
    "diferenciacion": { "apoyo": [], "estandar": [], "desafio": [] },
    "dua": { "representacion": [], "accion_expresion": [], "implicacion": [] }
  },
  "desarrollo": { ... misma estructura ... },
  "cierre": { ... misma estructura ... },
  "evaluacionFormativa": {
    "estrategias": ["<string>", "..."],
    "evidencias_observables": ["<string>", "..."],
    "lista_cotejo": ["<string>", "..."],
    "opciones_respuesta": ["oral", "visual", "escrita breve", "corporal", "señalamiento"],
    "retroalimentacion_docente": ["<string>", "..."]
  },
  "adaptacionesDUA": {
    "apoyo": ["<actividad concreta 1>", "<actividad concreta 2>", "<actividad concreta 3>", "<actividad concreta 4: cierre>"],
    "estandar": ["<actividad concreta 1>", "<actividad concreta 2>", "<actividad concreta 3>"],
    "desafio": ["<actividad concreta 1>", "<actividad concreta 2>", "<actividad concreta 3>"],
    "representacion": ["<estrategia concreta 1>", "..."],
    "accion_expresion": ["<estrategia concreta 1>", "..."],
    "implicacion": ["<estrategia concreta 1>", "..."],
    "barreras_identificadas": [${barreras.map((b: string) => `"${b}"`).join(', ')}],
    "adecuaciones_por_perfil": ${JSON.stringify(adaptaciones, null, 2)}
  },
  "recursos": [${recursos.length > 0 ? recursos.map((r: any) => `{"titulo": "${r.titulo}", "tipo": "${r.tipo}", "descripcion": "${r.descripcion}"${r.url ? `, "url": "${r.url}"` : ''}}`).join(', ') : '{"titulo": "Pizarra/Proyector", "tipo": "aula", "descripcion": "Recurso base para presentación"}'}],
  "erroresFrecuentes": ["<error 1>", "<error 2>", "<error 3>"],
  "preguntasMetacognitivas": ["<pregunta 1>", "<pregunta 2>", "<pregunta 3>"],
  "extension": {
    "tarea_domiciliaria": "<string opcional>",
    "profundizacion": "<string opcional>",
    "conexion_interdisciplinar": "<string opcional>"
  },
  "seguimientoDocente": {
    "proximos_pasos": ["<paso 1>", "<paso 2>"],
    "alertas": ["<alerta 1>", "<alerta 2>"],
    "registro_sugerido": ["<registro 1>", "<registro 2>"]
  }
}

REGLAS CRÍTICAS:
1. NO inventes OA. Usa EXACTAMENTE: ${oa.codigo}: ${oa.descripcion}
2. NO inventes indicadores. Usa SOLO los proporcionados arriba.
3. Cada fase (inicio/desarrollo/cierre) DEBE tener: tiempo_minutos, proposito, acciones_docente, acciones_estudiantes, recursos, evidencia
4. adaptacionesDUA.apoyo/estandar/desafio: actividades CONCRETAS y DISTINTAS (no genéricas)
5. evaluacionFormativa: evidencias OBSERVABLES, lista_cotejo con CRITERIOS OBSERVABLES
6. recursos: mínimo 1, preferiblemente los del contexto + sugerencias
7. erroresFrecuentes: 3 errores reales del tema/OA
8. preguntasMetacognitivas: 3 preguntas para que el estudiante reflexione sobre su aprendizaje
9. seguimientoDocente: pasos concretos para próximas clases
10. JSON VÁLIDO ÚNICAMENTE - SIN markdown, SIN explicaciones`;
  }
}

export { validatePlanningOutput, postProcessPlanning };