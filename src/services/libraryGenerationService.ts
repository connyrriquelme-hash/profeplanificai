/*
  Generation service for the Creative Library wizard.
  In production, POST to /api/generate-resource (Cloudflare Pages Function).
  For development, falls back to the existing generarConIA or mock text.
*/

import { generarConIA } from './aiService';
import type { LearningObjective } from '../data/libraryMockData';
import type { SlideLesson, Slide } from '../types/slideLesson';

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
  displayedIndicators?: string[];
  displayedSkills?: string[];
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
    `## Cierre`,
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

function buildMockSlideResult(req: GenerateResourceRequest): SlideLesson {
  const ctx = req.subject.toLowerCase().includes('ciencia') ? 'ecosistemas chilenos'
    : req.subject.toLowerCase().includes('matematica') ? 'aula latinoamericana con material concreto'
    : req.subject.toLowerCase().includes('historia') ? 'patrimonio cultural chileno'
    : req.subject.toLowerCase().includes('lenguaje') ? 'biblioteca escolar chilena'
    : 'contexto escolar chileno';

  const slides: Slide[] = [
    { type: 'cover', title: req.topic || `Clase: ${req.objectiveCode}`, subtitle: `${req.level} — ${req.subject}`, speakerNotes: 'Presentar el objetivo de la clase y motivar a los estudiantes con una pregunta inicial.' },
    { type: 'activation', title: 'Activacion de conocimientos previos', bullets: ['Que sabes sobre este tema?', 'Donde lo has visto antes?', 'Comparte con tu companero'], activity: 'En grupos, los estudiantes escriben en post-its todo lo que saben sobre el tema y lo pegan en un papelografo compartido.', questions: ['Que sabemos sobre este tema?', 'Donde lo hemos visto en la vida diaria?', 'Por que es importante aprenderlo?'], speakerNotes: 'Dar 2 minutos para pensar individualmente antes de compartir en grupos.' },
    { type: 'explanation', title: 'Concepto clave de la clase', subtitle: 'Contenido fundamental alineado al OA', bullets: [`Definicion clara del concepto central`, `Conexion con ${ctx}`, `Representacion visual del concepto`], example: `Ejemplo concreto aplicado a la realidad chilena, utilizando material familiar para los estudiantes de ${req.level}.`, activity: 'Los estudiantes observan una representacion visual y toman notas guiadas en su cuaderno.', speakerNotes: 'Usar preguntas guiadas: "Que observan?", "Que creen que pasara?"' },
    { type: 'guided-practice', title: 'Practica guiada', subtitle: 'Aplicacion con apoyo del docente', activity: 'Los estudiantes resuelven un problema o analizan un caso en parejas con mediacion docente. El docente circula y retroalimenta constantemente.', instructions: 'Formar grupos de 2-3 estudiantes. Entregar guia de trabajo. Monitorear y preguntar: "Como llegaron a esa respuesta?", "Que pasaria si...?"', materials: ['Guia de trabajo impresa', 'Material concreto segun asignatura', 'Apoyo visual en pizarra o proyector'], speakerNotes: 'Circular constantemente. Preguntar "por que" y "como" en lugar de dar respuestas directas.' },
    { type: 'independent-practice', title: 'Trabajo individual', subtitle: 'Aplicacion autonoma', activity: 'Cada estudiante resuelve un ejercicio o crea un producto que demuestre su comprension del OA trabajado, con opciones de dificultad creciente.', successCriteria: ['Completa la actividad siguiendo las instrucciones', 'Aplica correctamente el concepto trabajado', 'Explica con sus palabras lo aprendido'], questions: ['Que aprendi hoy?', 'Que fue lo mas facil?', 'Que me costo mas?'], speakerNotes: 'Ofrecer apoyo diferenciado a estudiantes que lo necesiten.' },
    { type: 'formative-assessment', title: 'Evaluacion formativa', subtitle: 'Ticket de salida', activity: 'Ticket de salida: pregunta breve que cada estudiante responde antes de irse, permitiendo al docente verificar la comprension del OA.', questions: ['Explica con tus palabras el concepto principal de la clase', 'Dibuja o escribe un ejemplo de lo aprendido', 'Que dudas te quedan?'], successCriteria: ['Responde al menos 2 de las 3 preguntas', 'Demuestra comprension basica del OA trabajado'], speakerNotes: 'Revisar rapidamente los tickets para ajustar la proxima clase.' },
    { type: 'closure', title: 'Cierre y metacognicion', bullets: ['Sintesis oral de los aprendizajes clave', 'Conexion con la proxima clase', 'Reconocimiento del esfuerzo'], metacognition: 'Que estrategia usaste hoy que te ayudo a aprender mejor? Como puedes aplicarla en otras asignaturas?', exitTicket: 'Escribe en una palabra lo que te llevas de la clase de hoy.', speakerNotes: 'Dar tiempo para que 2-3 estudiantes compartan su respuesta. Cerrar con entusiasmo.' },
  ];
  return {
    title: req.topic || `Clase sobre ${req.objectiveCode}`,
    subtitle: 'Leccion individual generada con IA curricular',
    course: req.level,
    subject: req.subject,
    objectiveCode: req.objectiveCode,
    objectiveText: req.objectiveText,
    slides,
  };
}

function buildSlidePrompt(req: GenerateResourceRequest): string {
  const indicatorsList = req.displayedIndicators?.length
    ? `- Indicadores de evaluacion: ${req.displayedIndicators.join('; ')}`
    : req.indicator ? `- Indicador: ${req.indicator}` : '';
  const skillsList = req.displayedSkills?.length
    ? `- Habilidades: ${req.displayedSkills.join('; ')}`
    : req.skill ? `- Habilidad: ${req.skill}` : '';

  return [
    `Genera una leccion individual en formato JSON para una presentacion visual premium tipo Gamma IA.`,
    ``,
    `Contexto curricular chileno:`,
    `- Nivel: ${req.level}`,
    `- Asignatura: ${req.subject}`,
    `- OA: ${req.objectiveCode} - ${req.objectiveText}`,
    indicatorsList,
    skillsList,
    `- Tema: ${req.topic || 'No especificado'}`,
    req.additionalContext ? `- Contexto adicional: ${req.additionalContext}` : '',
    `- Estilo de diseno: ${req.designStyle}`,
    ``,
    `Instrucciones:`,
    `- Devuelve SOLO un objeto JSON valido, sin markdown, sin codigo de bloque, sin comentarios.`,
    `- El JSON debe tener esta estructura exacta:`,
    `{`,
    `  "title": "Titulo atractivo de la leccion",`,
    `  "subtitle": "Subtitulo pedagogico breve",`,
    `  "slides": [`,
    `    { "type": "cover", "title": "...", "subtitle": "...", "speakerNotes": "..." },`,
    `    { "type": "activation", "title": "...", "bullets": ["...", "..."], "questions": ["...", "..."], "activity": "...", "speakerNotes": "..." },`,
    `    { "type": "explanation", "title": "...", "subtitle": "...", "bullets": ["...", "..."], "example": "...", "activity": "...", "speakerNotes": "..." },`,
    `    { "type": "guided-practice", "title": "...", "activity": "...", "instructions": "...", "materials": ["..."], "speakerNotes": "..." },`,
    `    { "type": "independent-practice", "title": "...", "bullets": ["..."], "successCriteria": ["...", "..."], "questions": ["..."], "speakerNotes": "..." },`,
    `    { "type": "formative-assessment", "title": "...", "activity": "...", "questions": ["...", "..."], "successCriteria": ["..."], "speakerNotes": "..." },`,
    `    { "type": "closure", "title": "...", "bullets": ["..."], "metacognition": "...", "exitTicket": "...", "speakerNotes": "..." }`,
    `  ]`,
    `}`,
    ``,
    `Tipos de slide (usa exactamente 7 slides, uno por cada tipo en este orden):`,
    `1. "cover" - Portada premium con titulo atractivo y datos curriculares`,
    `2. "activation" - Activacion de conocimientos previos con preguntas provocadoras`,
    `3. "explanation" - Explicacion del concepto clave con ejemplo concreto chileno/latinoamericano`,
    `4. "guided-practice" - Practica guiada con instrucciones claras y materiales`,
    `5. "independent-practice" - Trabajo individual con criterios de exito visibles`,
    `6. "formative-assessment" - Evaluacion formativa con preguntas de ticket de salida`,
    `7. "closure" - Cierre con metacognicion y conexion a proxima clase`,
    ``,
    `Cada slide puede incluir (segun su tipo):`,
    `- "title" (requerido): titulo breve y atractivo de la diapositiva`,
    `- "subtitle": subtitulo pedagogico opcional`,
    `- "bullets": array de puntos clave (max 3 por slide, cada uno de max 10 palabras)`,
    `- "activity": descripcion de la actividad en 1-2 oraciones`,
    `- "example": ejemplo concreto aplicado a la realidad chilena o latinoamericana`,
    `- "instructions": instrucciones para el docente en 1-2 oraciones`,
    `- "materials": array de materiales necesarios`,
    `- "questions": array de preguntas de comprension (max 3)`,
    `- "successCriteria": array de criterios de exito (max 3)`,
    `- "metacognition": pregunta o reflexion metacognitiva`,
    `- "exitTicket": pregunta de ticket de salida`,
    `- "speakerNotes": notas breves para el docente (siempre incluir)`,
    ``,
    `REQUISITOS VISUALES PREMIUM (muy importante):`,
    `- Cada slide debe tener poco texto, estilo presentacion profesional`,
    `- Maximo 3 bullets por slide, cada bullet maximo 10 palabras`,
    `- Usar lenguaje visual: "muestra", "observa", "descubre", no solo "lee"`,
    `- Incluir al menos 1 ejemplo contextual chileno o latinoamericano`,
    `- Usar vocabulario apropiado para la edad del nivel indicado`,
    `- Incluir preguntas de comprension en slides de practica y evaluacion`,
    `- Las notas del docente (speakerNotes) deben ser practicas y breves`,
    ``,
    `DIAGRAMAS Y TABLAS (incluir en al menos 2 slides):`,
    `- "diagram": objeto con estructura para diagramas SmartArt`,
    `  - "type": "process" | "cycle" | "hierarchy" | "comparison"`,
    `  - "nodes": array de { "id": "string", "label": "string", "description": "string" }`,
    `  - "edges": array opcional de { "from": "id", "to": "id", "label": "string" }`,
    `- "table": objeto con estructura para tablas`,
    `  - "headers": array de strings`,
    `  - "rows": array de arrays de strings`,
    ``,
    `Ejemplo de slide con diagrama de proceso:`,
    `{ "type": "explanation", "title": "Proceso de fotosintesis", "diagram": { "type": "process", "nodes": [ { "id": "1", "label": "Luz solar", "description": "Energia luminosa" }, { "id": "2", "label": "Clorofila", "description": "Absorbe la luz" }, { "id": "3", "label": "Glucosa", "description": "Producto final" } ], "edges": [ { "from": "1", "to": "2" }, { "from": "2", "to": "3" } ] } }`,
    ``,
    `Ejemplo de slide con tabla comparativa:`,
    `{ "type": "explanation", "title": "Comparacion de ecosistemas", "table": { "headers": ["Caracteristica", "Bosque", "Desierto"], "rows": [["Clima", "Humedo y templado", "Seco y caluroso"], ["Flora", "Arboles abundantes", "Cactus y arbustos"], ["Fauna", "Mamiferos y aves", "Reptiles e insectos"]] } }`,
    ``,
    `Requisitos de contenido:`,
    `- Lenguaje claro, directo y alineado al curriculo chileno`,
    `- Actividades concretas y aplicables en el aula chilena real`,
    `- Cada diapositiva debe tener poco texto (max 30 palabras en bullets)`,
    `- Incluir adaptaciones DUA implicitas en las actividades`,
    `- Evaluacion formativa explicita en el slide correspondiente`,
    `- Vocabulario accesible para el nivel indicado`,
    `- Sin markdown ni asteriscos en los textos`,
    `- INCLUIR diagramas o tablas en al menos 2 slides para enriquecer el contenido visual`,
    `- CONTEXTO CHILENO/LATINOAMERICANO: usar ejemplos, animales, plantas, lugares o situaciones reconocibles para estudiantes chilenos`,
    ``,
    `Ejemplo de slide de activacion valido:`,
    `{ "type": "activation", "title": "Activacion de conocimientos", "bullets": ["Pregunta inicial sobre experiencias cotidianas", "Lluvia de ideas en grupos pequenos", "Vocabulario clave de la clase"], "questions": ["Que sabemos sobre este tema?", "Donde lo hemos visto en la vida diaria?"], "speakerNotes": "Dar 2 minutos para pensar individualmente antes de compartir en grupos." }`,
  ].filter(Boolean).join('\n');
}

export async function generateSlideLesson(req: GenerateResourceRequest): Promise<{ ok: boolean; slides?: SlideLesson; text?: string; error?: string }> {
  try {
    const result = await generarConIA({
      tipo: 'planificacion',
      nivel: req.level,
      asignatura: req.subject,
      oa: `${req.objectiveCode} - ${req.objectiveText}`,
      tema: req.topic,
      contexto: req.additionalContext,
      habilidad: req.skill,
      estilo: req.designStyle,
      incluirDUA: req.options.dua ? 'si' : 'no',
      promptExt: buildSlidePrompt(req),
    });

    if (result.ok && result.texto) {
      const parsed = parseSlideJson(result.texto);
      if (parsed) {
        parsed.course = req.level;
        parsed.subject = req.subject;
        parsed.objectiveCode = req.objectiveCode;
        parsed.objectiveText = req.objectiveText;
        return { ok: true, slides: parsed, text: result.texto };
      }
    }

    const mock = buildMockSlideResult(req);
    return { ok: true, slides: mock, text: JSON.stringify(mock, null, 2) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    const mock = buildMockSlideResult(req);
    return { ok: false, slides: mock, text: JSON.stringify(mock, null, 2), error: msg };
  }
}

const VALID_SLIDE_TYPES = ['cover', 'activation', 'explanation', 'guided-practice', 'independent-practice', 'formative-assessment', 'closure'];

function parseSlideJson(text: string): SlideLesson | null {
  try {
    const json = extractJson(text);
    if (!json) return null;
    const obj = JSON.parse(json);
    if (!obj.slides || !Array.isArray(obj.slides)) return null;
    if (!obj.title) return null;
    if (!obj.course || !obj.subject || !obj.objectiveCode || !obj.objectiveText) return null;

    // Validate each slide has required fields
    const validSlides = obj.slides.every((s: Record<string, unknown>) =>
      s.type && VALID_SLIDE_TYPES.includes(s.type as string) &&
      s.title && typeof s.title === 'string'
    );
    if (!validSlides) return null;

    return obj as SlideLesson;
  } catch {
    return null;
  }
}

function extractJson(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;
  const jsonBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlock) return jsonBlock[1].trim();
  const braceStart = trimmed.indexOf('{');
  const braceEnd = trimmed.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    return trimmed.substring(braceStart, braceEnd + 1);
  }
  return null;
}
