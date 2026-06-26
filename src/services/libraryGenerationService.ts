/*
  Generation service for the Creative Library wizard.
  In production, POST to /api/generate-resource (Cloudflare Pages Function).
  For development, falls back to the existing generarConIA or mock text.
*/

import { generarConIA } from './aiService';
import type { LearningObjective } from '../data/libraryMockData';

export interface GenerateResourceRequest {
  resourceType: string;
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  indicator: string;
  skill: string;
  topic: string;
  additionalContext: string;
  designStyle: string;
  options: {
    lessonFramework: boolean;
    curriculumAlignment: boolean;
    learningObjectives: boolean;
    keyVocabulary: boolean;
    dua: boolean;
    rubric: boolean;
    simce: boolean;
    differentiation: boolean;
  };
}

function extractNivelBase(level: string): string {
  if (level.includes('TP')) return 'Técnico Profesional';
  if (level.includes('Medio')) return 'Media';
  if (level === 'Prekinder' || level === 'Kinder') return 'Prebásica';
  return 'Básica';
}

function buildMockResult(req: GenerateResourceRequest): string {
  const sections: string[] = [];

  sections.push(`# Recurso generado: ${req.resourceType === 'leccion' ? 'Lección individual' : req.resourceType === 'serie' ? 'Serie de lecciones' : 'Fichas de actividades'}`);
  sections.push('');

  sections.push('## Datos curriculares');
  sections.push(`- **Nivel:** ${req.level}`);
  sections.push(`- **Asignatura:** ${req.subject}`);
  sections.push(`- **OA:** ${req.objectiveCode} — ${req.objectiveText}`);
  if (req.indicator) sections.push(`- **Indicador:** ${req.indicator}`);
  if (req.skill) sections.push(`- **Habilidad:** ${req.skill}`);
  sections.push('');

  sections.push('## Objetivo de la clase');
  sections.push(`${req.topic ? `Que los y las estudiantes ${req.topic.toLowerCase()} relacionado con ${req.objectiveCode}.` : `Desarrollar habilidades de ${req.skill || 'aprendizaje'} a través de actividades alineadas con ${req.objectiveCode}.`}`);
  sections.push('');

  sections.push('## Inicio (10-15 min)');
  sections.push('- Activación de conocimientos previos mediante preguntas guiadas.');
  sections.push('- Presentación del objetivo de la clase en lenguaje claro y accesible.');
  sections.push('- Vocabulario clave: se introducen 3-5 palabras nuevas relacionadas con el tema.');
  sections.push('- Pregunta desafiante para despertar curiosidad.');
  sections.push('');

  sections.push('## Desarrollo (25-30 min)');
  sections.push('- **Modelaje docente:** Explicación guiada con ejemplo concreto.');
  sections.push('- **Práctica guiada:** Actividad en pares o grupos pequeños con retroalimentación constante.');
  sections.push('- **Trabajo individual:** Ejercicio de aplicación con distintos niveles de dificultad.');
  sections.push('- **Recursos:** Material concreto, guía de trabajo, apoyo visual.');
  sections.push('');

  sections.push('## Cierre (5-10 min)');
  sections.push('- Síntesis de aprendizajes a través de preguntas de metacognición.');
  sections.push('- Ticket de salida: pregunta breve sobre lo aprendido.');
  sections.push('- Conexión con la próxima clase.');
  sections.push('');

  if (req.options.differentiation) {
    sections.push('## Actividades diferenciadas');
    sections.push('- **Estudiantes que requieren apoyo:** Actividad simplificada con más mediación.');
    sections.push('- **Estudiantes en nivel esperado:** Actividad estándar con desafío adicional.');
    sections.push('- **Estudiantes avanzados:** Actividad de profundización o extensión.');
    sections.push('');
  }

  sections.push('## Evaluación');
  sections.push('- **Indicadores de logro:** Basados en el OA seleccionado.');
  sections.push('- **Instrumento:** Pauta de observación / Lista de cotejo.');
  sections.push('- **Retroalimentación:** Descriptiva y centrada en el proceso.');
  sections.push('');

  if (req.options.rubric) {
    sections.push('## Rúbrica');
    sections.push('| Criterio | Logrado (3) | Medianamente logrado (2) | Por lograr (1) |');
    sections.push('|----------|-------------|--------------------------|----------------|');
    sections.push('| Comprensión del OA | Aplica correctamente todos los conceptos | Aplica la mayoría con pequeños errores | Requiere apoyo constante |');
    sections.push('| Habilidad trabajada | Demuestra la habilidad de forma autónoma | Requiere mediación ocasional | Depende completamente del docente |');
    sections.push('| Participación | Colabora activamente y aporta ideas | Participa cuando se le solicita | Se mantiene al margen |');
    sections.push('');
  }

  if (req.options.dua) {
    sections.push('## Adecuaciones DUA');
    sections.push('- **Representación:** Material visual, auditivo y kinestésico.');
    sections.push('- **Acción y expresión:** Opciones para demostrar aprendizaje (oral, escrita, dibujo).');
    sections.push('- **Participación:** Variedad de agrupamientos y ritmos de trabajo.');
    sections.push('');
  }

  sections.push('## Materiales');
  sections.push('- Guía de trabajo (formato digital e impreso).');
  sections.push('- Presentación visual con imágenes y vocabulario.');
  sections.push('- Material concreto según la actividad.');
  sections.push('');

  if (req.options.simce && (req.level.includes('Básico') || req.level.includes('Medio'))) {
    sections.push('## Sugerencias SIMCE');
    sections.push('- Incluir al menos una pregunta cerrada (alternativas) que evalúe el OA trabajado.');
    sections.push('- Practicar estrategias de respuesta: descartar opciones, subrayar palabras clave.');
    sections.push('- Revisar ítems liberados del DEMRE relacionados con el nivel y asignatura.');
    sections.push('');
  }

  return sections.join('\n');
}

export async function generateResource(req: GenerateResourceRequest): Promise<{ ok: boolean; text?: string; error?: string }> {
  try {
    // Try using the existing IA engine first
    const nivelBase = extractNivelBase(req.level);
    const result = await generarConIA({
      tipo: req.resourceType === 'leccion' ? 'planificacion' : req.resourceType === 'fichas' ? 'recurso' : 'planificacion',
      nivel: req.level,
      asignatura: req.subject,
      oa: `${req.objectiveCode} — ${req.objectiveText}`,
      tema: req.topic,
      contexto: req.additionalContext,
      habilidad: req.skill,
      estilo: req.designStyle,
      incluirDUA: req.options.dua ? 'si' : 'no',
      promptExt: buildAdvancedPrompt(req),
    });

    if (result.ok && result.texto) {
      return { ok: true, text: result.texto };
    }

    // Fallback to mock
    return { ok: true, text: buildMockResult(req) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    return { ok: false, error: msg, text: buildMockResult(req) };
  }
}

function buildAdvancedPrompt(req: GenerateResourceRequest): string {
  const typeLabel = req.resourceType === 'leccion' ? 'Lección individual' : req.resourceType === 'serie' ? 'Serie de lecciones' : 'Fichas de actividades';
  const optionsActive = Object.entries(req.options)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(', ');

  return [
    `# Generación de recurso pedagógico - Biblioteca Creativa`,
    ``,
    `Eres un mentor pedagógico experto en el Currículum Nacional Chileno.`,
    `Genera un recurso completo de tipo "${typeLabel}" con la siguiente especificación:`,
    ``,
    `## Contexto curricular`,
    `- Nivel: ${req.level}`,
    `- Asignatura: ${req.subject}`,
    `- OA: ${req.objectiveCode} — ${req.objectiveText}`,
    req.indicator ? `- Indicador: ${req.indicator}` : '',
    req.skill ? `- Habilidad: ${req.skill}` : '',
    `- Tema: ${req.topic || 'No especificado'}`,
    req.additionalContext ? `- Contexto adicional: ${req.additionalContext}` : '',
    `- Estilo visual: ${req.designStyle}`,
    ``,
    `## Opciones activadas`,
    optionsActive || 'Ninguna',
    ``,
    `## Formato de salida`,
    `Genera el recurso en Markdown con las siguientes secciones:`,
    ``,
    `# Recurso generado`,
    `## Datos curriculares`,
    `## Objetivo de la clase`,
    `## Inicio`,
    `## Desarrollo`,
    `## Cierre`,,
    req.options.differentiation ? `## Actividades diferenciadas` : '',
    `## Evaluación`,
    req.options.rubric ? `## Rúbrica` : '',
    req.options.dua ? `## Adecuaciones DUA` : '',
    `## Materiales`,
    req.options.simce ? `## Sugerencias SIMCE` : '',
    ``,
    `Incluye vocabulario clave, ejemplos concretos y lenguaje claro para el aula chilena.`,
    `Usa formato Markdown limpio con ## para secciones, **negritas** para énfasis, y | tablas | cuando corresponda.`,
  ].filter(Boolean).join('\n');
}
