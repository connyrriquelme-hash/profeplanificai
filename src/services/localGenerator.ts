import type { PlanFormData, RecursoFormData, EvalFormData } from '../types';
import { buildOAContext, buildCurriculumHeader } from '../utils/curriculum';

function hab(index: number): string {
  const h = ['localizar información', 'inferir', 'interpretar', 'evaluar', 'resolver', 'justificar'];
  return h[index % h.length];
}

function esParvularia(nivel: string): boolean {
  return nivel === 'Prekinder' || nivel === 'Kinder';
}

function oaHeader(nivel: string, asignatura: string, oaText: string): string {
  const ctx = buildOAContext(nivel, asignatura, oaText);
  if (!ctx) return '';
  return ctx + '\n\n---\n\n';
}

export function generatePlan(kind: 'plan' | 'secuencia', d: PlanFormData): string {
  const titulo = kind === 'plan' ? 'Planificación de clase' : 'Secuencia de unidad';

  const hdr = oaHeader(d.nivel, d.asignatura, d.oa);

  if (esParvularia(d.nivel)) {
    const ambito = d.asignatura;
    return hdr + [
      `# ${titulo} - Educación Parvularia`,
      '',
      `**Nivel:** ${d.nivel}`,
      `**Ámbito:** ${ambito}`,
      `**Duración:** ${d.duracion}`,
      `**Enfoque:** ${d.enfoque}`,
      '',
      '## Objetivo de Aprendizaje',
      d.oa || 'OA pendiente: especificar objetivo de aprendizaje de las BCEP.',
      '',
      '## Contexto del grupo',
      d.contexto || 'Grupo heterogéneo. Considerar diferentes ritmos de desarrollo.',
      '',
      '## Inicio (10-15 min)',
      '1. **Activación:** Canción o ronda de saludo para crear un ambiente acogedor.',
      '2. **Motivación:** Elemento sorpresa relacionado con el OA (títere, lámina, objeto).',
      '3. **Presentación:** Explicar en lenguaje simple qué haremos hoy y para qué.',
      '',
      '## Desarrollo (20-25 min)',
      '1. **Experiencia principal:** Actividad práctica y lúdica que aborda el OA.',
      '2. **Exploración:** Los niños y niñas manipulan, observan o experimentan con materiales concretos.',
      '3. **Mediación:** La educadora pregunta, andamia y guía según las respuestas del grupo.',
      '4. **Variación:** Actividad alternativa para quienes terminan antes o necesitan más apoyo.',
      '',
      '## Cierre (10 min)',
      '1. **Síntesis:** Conversación grupal sobre lo aprendido ("¿Qué hicimos? ¿Cómo lo hicimos? ¿Qué aprendimos?").',
      '2. **Evaluación:** Observación directa y registro de logros individuales.',
      '3. **Extensión:** Sugerencia para realizar en familia.',
      '',
      '## Evaluación formativa',
      '- **Indicadores:** Observables y pertinentes al OA.',
      '- **Instrumento:** Pauta de observación con escala: Logrado / En Proceso / No Observado.',
      '- **Registro:** Notas anecdóticas en cuaderno de campo.',
      '',
      '## DUA y apoyos concretos',
      '- Representación: Imágenes, objetos concretos, modelaje de la educadora.',
      '- Acción: Manipulación, expresión oral, gestual y gráfica.',
      '- Participación: Juego libre, trabajo en parejas, elección de materiales.',
      '',
      '## Recursos',
      '- Material concreto, láminas, cuentos, canciones, bloques, plastilina, elementos naturales.',
    ].join('\n');
  }

  return hdr + [
    `# ${titulo}`,
    '',
    `**Nivel:** ${d.nivel}`,
    `**Asignatura:** ${d.asignatura}`,
    `**Duración:** ${d.duracion}`,
    `**Enfoque:** ${d.enfoque}`,
    '',
    '## Objetivo de aprendizaje',
    d.oa || 'OA pendiente: pegar objetivo ministerial exacto.',
    '',
    '## Contexto y propósito',
    d.contexto || 'Curso heterogéneo. Ajustar con información real del curso.',
    '',
    '## Meta de la clase',
    'Al finalizar, las y los estudiantes podrán demostrar comprensión del objetivo mediante una producción breve, conversación guiada y resolución de una tarea aplicada.',
    '',
    '## Habilidades',
    '- Comprender instrucciones y explicar procedimientos.',
    '- Trabajar colaborativamente con roles.',
    '- Justificar respuestas con evidencia.',
    '- Monitorear el propio aprendizaje.',
    '',
    '## Inicio',
    '1. Activación de conocimientos previos con pregunta desafiante.',
    '2. Presentación del objetivo en lenguaje simple: "Hoy aprenderemos a...".',
    '3. Vocabulario clave con ejemplos visuales y una pregunta rápida.',
    '',
    '## Desarrollo',
    '1. Modelaje docente paso a paso.',
    '2. Práctica guiada en parejas: lector/a, relator/a, verificador/a.',
    '3. Desafío colaborativo: resolver una situación o analizar un texto breve.',
    '4. Pausa de metacognición: ¿qué estrategia funcionó?, ¿qué evidencia tengo?',
    '',
    '## Cierre',
    '- Síntesis colectiva en tres ideas.',
    '- Ticket de salida con 3 preguntas: una literal/procedimental, una inferencial/aplicada y una de autoevaluación.',
    '',
    '## Evaluación formativa',
    '- Lista de cotejo: comprende la consigna, participa, justifica, usa vocabulario, completa producto.',
    '- Retroalimentación: "lograste...", "tu próximo paso es...".',
    '',
    '## DUA y apoyos',
    '- Múltiples formas de representación: imagen, texto breve, audio oral del docente.',
    '- Múltiples formas de acción: responder oralmente, escribir, dibujar o seleccionar.',
    '- Múltiples formas de participación: roles, elección de desafío y refuerzo positivo.',
    '',
    '## Recursos',
    '- Pizarra, texto impreso o digital, hoja de trabajo, tarjetas de vocabulario.',
    '- Material concreto si aplica.',
    '',
    '## Adecuaciones',
    '- Para estudiantes que requieren apoyo: instrucciones paso a paso, banco de palabras, apoyo gráfico.',
    '- Para estudiantes que requieren desafío: preguntas de nivel inferencial y evaluativo adicionales.',
  ].join('\n');
}

export function generateRecurso(d: RecursoFormData): string {
  const hdr = oaHeader(d.nivel, d.asignatura, d.oa);

  if (esParvularia(d.nivel)) {
    return hdr + [
      `# ${d.tipo} - Educación Parvularia`,
      '',
      `**Nivel:** ${d.nivel}`,
      `**Ámbito:** ${d.asignatura}`,
      '',
      '## OA / Contenido',
      d.oa || 'Especificar OA de las BCEP.',
      '',
      '## Propósito pedagógico',
      'Recurso diseñado para promover aprendizajes significativos a través del juego, la exploración y la interacción con materiales concretos, respetando los distintos ritmos de desarrollo.',
      '',
      '## Material para la educadora',
      '- Preparar el ambiente con antelación.',
      '- Disponer materiales al alcance de los niños y niñas.',
      '- Organizar grupos pequeños (3-4 integrantes).',
      '',
      '## Experiencia de aprendizaje',
      '',
      '### 1. Momento inicial',
      '- Canción o juego de rutina.',
      '- Presentación del desafío con apoyo visual.',
      '',
      '### 2. Momento de exploración',
      '- Actividad principal con materiales concretos.',
      '- Circulación y mediación de la educadora.',
      '- Preguntas de andamiaje: "¿Qué pasó?", "¿Cómo lo hiciste?", "¿Qué más podemos probar?"',
      '',
      '### 3. Momento de cierre',
      '- Puesta en común con preguntas de metacognición.',
      '- Guardar y ordenar materiales.',
      '- Despedida con canción.',
      '',
      '## Apoyos DUA',
      '- **Representación:** Instrucciones orales + apoyo visual (lámina o dibujo).',
      '- **Acción:** Manipular, señalar, dibujar, modelar, representar con el cuerpo.',
      '- **Participación:** Elección de materiales, roles en el juego, trabajo en parejas.',
      '',
      '## Pauta de observación',
      '| Indicador | Logrado | En Proceso | No Observado |',
      '|-----------|---------|------------|--------------|',
      '| Participa activamente | | | |',
      '| Sigue instrucciones | | | |',
      '| Se expresa con claridad | | | |',
      '| Interactúa con pares | | | |',
      '',
      '## Necesidad considerada',
      d.necesidad || 'Ajustar según observación del grupo y las orientaciones de la educadora de párvulos.',
    ].join('\n');
  }

  if (d.tipo === 'Rúbrica') {
    return hdr + [
      `# ${d.tipo}`,
      '',
      `**Nivel:** ${d.nivel}`,
      `**Asignatura:** ${d.asignatura}`,
      '',
      '## OA / contenido',
      d.oa || 'Pega el OA exacto para mayor precisión.',
      '',
      '## Propósito',
      'Rúbrica analítica para evaluar desempeños y retroalimentar el aprendizaje.',
      '',
      '## Criterios de evaluación',
      '',
      '| Criterio | Logrado (3 pts) | Parcialmente (2 pts) | Por lograr (1 pt) | Puntaje |',
      '|----------|-----------------|----------------------|-------------------|---------|',
      '| Comprensión del contenido | Demuestra comprensión completa | Demuestra comprensión parcial | No demuestra comprensión | |',
      '| Aplicación de habilidades | Aplica correctamente | Aplica con apoyo | No aplica | |',
      '| Comunicación de resultados | Comunica con claridad | Comunica parcialmente | No comunica | |',
      '| Trabajo colaborativo | Colabora activamente | Colabora con apoyo | No colabora | |',
      '',
      '## Puntaje total',
      '- 10-12 pts: Desempeño destacado',
      '- 7-9 pts: Desempeño esperado',
      '- 4-6 pts: En proceso',
      '- 0-3 pts: Requiere apoyo',
    ].join('\n');
  }

  return hdr + [
    `# ${d.tipo}`,
    '',
    `**Nivel:** ${d.nivel}`,
    `**Asignatura:** ${d.asignatura}`,
    '',
    '## OA / contenido',
    d.oa || 'Pega el OA exacto para mayor precisión.',
    '',
    '## Propósito',
    'Recurso diseñado para apoyar el aprendizaje mediante instrucciones claras, modelaje y práctica gradual.',
    '',
    '## Material para estudiantes',
    '### 1. Antes de comenzar',
    '- Lee o escucha la instrucción.',
    '- Subraya palabras importantes.',
    '- Pregunta si no entiendes una palabra.',
    '',
    '### 2. Actividad principal',
    '- Trabaja con un/a compañero/a.',
    '- Resuelve el desafío usando evidencia del texto, problema o fuente.',
    '- Explica tu respuesta en una oración completa.',
    '',
    '### 3. Desafío extra',
    'Crea una pregunta nueva sobre el contenido y entrégala a otro equipo.',
    '',
    '## Apoyo DUA',
    '- Versión oral de instrucciones.',
    '- Opción de responder con dibujo, esquema o frase breve.',
    '- Banco de palabras clave.',
    '',
    '## Pauta rápida',
    '- 2 puntos: respuesta correcta y justificada.',
    '- 1 punto: respuesta parcial o sin evidencia.',
    '- 0 puntos: no responde o no se relaciona con la tarea.',
    '',
    '## Necesidad considerada',
    d.necesidad || 'Ajustar según diagnóstico del curso.',
  ].join('\n');
}

export function generatePrompts(d: RecursoFormData): string {
  return [
    '# Prompts para generadores IA gratuitos',
    '',
    '## Prompt para crear una guía',
    `Actúa como docente chileno/a experto/a en ${d.asignatura}. Crea una guía imprimible para ${d.nivel} sobre: ${d.oa}. Debe incluir objetivo, instrucciones simples, modelaje, práctica guiada, práctica independiente, ticket de salida, DUA y pauta. Contexto: ${d.necesidad}.`,
    '',
    '## Prompt para imagen educativa',
    `Crea una imagen educativa clara, colorida y apta para estudiantes de ${d.nivel}, sobre ${d.oa}. Estilo amigable, sin texto pequeño, con elementos visuales que apoyen comprensión, diversidad e inclusión.`,
    '',
    '## Prompt para presentación',
    `Crea una presentación de 6 diapositivas para enseñar ${d.oa} en ${d.nivel}. Incluye inicio motivador, explicación simple, ejemplo modelado, actividad colaborativa, práctica individual y cierre con ticket de salida.`,
    '',
    '## Prompt para video corto',
    `Diseña un guion de video de 60 segundos para explicar ${d.oa} a estudiantes de ${d.nivel}, con lenguaje chileno neutro, ejemplos cotidianos y una pregunta final.`,
  ].join('\n');
}

export function generateActividadAligned(
  item: { id: string; oa: string; habilidad: string; indicadores: string[]; conocimientos: string[]; actitudes: string[]; actividadesSugeridas: string[]; recursos: string[]; evaluacionesSugeridas: string[] },
  nivel: string,
  asignatura: string,
  eje: string,
): string {
  const inds = item.indicadores.slice(0, 4);
  const acts = item.actividadesSugeridas.slice(0, 3);
  const recs = item.recursos.slice(0, 4);
  return [
    `# Actividad alineada — ${asignatura}`,
    '',
    `**Nivel:** ${nivel} | **Eje:** ${eje} | **OA:** ${item.id}`,
    '',
    `## Objetivo de Aprendizaje`,
    item.oa,
    '',
    `## Habilidad a desarrollar`,
    item.habilidad,
    '',
    `## Indicadores de evaluación`,
    ...inds.map((ind, i) => `${i + 1}. ${ind}`),
    '',
    `## Inicio (10-15 min)`,
    '1. **Activación:** Pregunta o situación breve para conectar con experiencias previas.',
    '2. **Presentación del propósito:** "Hoy aprenderemos a ' + (item.habilidad.toLowerCase()) + ' para ' + (item.oa.length > 60 ? item.oa.substring(0, 60) + '…' : item.oa).toLowerCase() + '".',
    '3. **Vocabulario clave:** Presentar 3-4 palabras o conceptos centrales con apoyo visual.',
    '',
    `## Desarrollo (25-30 min)`,
    '1. **Modelaje:** El/la docente demuestra el proceso o estrategia paso a paso.',
    '2. **Práctica guiada:** Actividad en parejas o pequeños grupos con apoyo docente.',
    '3. **Trabajo individual:** Cada estudiante aplica lo aprendido de forma autónoma.',
    ...(acts.length > 0 ? ['', '### Actividades sugeridas', ...acts.map((a, i) => `- **Opción ${i + 1}:** ${a}`)] : ['', '### Actividades sugeridas', '- Actividad principal alineada al OA y eje curricular.']),
    '',
    '### Preguntas de mediación docente',
    '- ¿Qué observaste? ¿Qué información relevante encontraste?',
    '- ¿Cómo puedes justificar tu respuesta usando evidencia?',
    '- ¿Qué estrategia te funcionó? ¿Cuál podrías mejorar?',
    '- ¿Qué harías distinto la próxima vez?',
    '',
    `## Cierre (5-10 min)`,
    '1. **Síntesis colectiva:** Tres ideas clave de la clase.',
    '2. **Metacognición:** Ticket de salida con dos preguntas: ¿qué aprendí? ¿cómo lo aprendí?',
    '3. **Conexión:** Explicar brevemente cómo lo usado hoy se conecta con el próximo aprendizaje.',
    '',
    '## Diferenciación — Estudiantes descendidos',
    '- Instrucciones simplificadas paso a paso con apoyo gráfico.',
    '- Banco de palabras clave con definiciones e imágenes.',
    '- Trabajo en pareja con un compañero tutor.',
    '- Más tiempo para completar tareas o reducir número de ítems.',
    '- Preguntas de nivel literal antes que inferenciales.',
    '',
    '## Adaptación DUA',
    '- **Representación:** Información presentada en texto, imágenes y formato oral.',
    '- **Acción y expresión:** Opción de respuesta oral, escrita, dibujada o grabada.',
    '- **Participación:** Roles definidos, elección de tarea, refuerzo positivo frecuente.',
    '',
    '## Evidencia de aprendizaje',
    '- Producto escrito, representación visual o registro oral.',
    '- Observación directa con pauta de cotejo.',
    '- Autoevaluación del estudiante con carita o escala simple.',
    '',
    '## Evaluación formativa',
    inds.length > 0 ? `- Indicadores evaluados: ${inds.join('; ')}` : '- Indicadores: según OA seleccionado.',
    `- Instrumento: ${item.evaluacionesSugeridas[0] || 'Pauta de observación con escala: Logrado / En Proceso / Por Lograr'}.`,
    '- Retroalimentación descriptiva: "Lograste…", "Tu próximo paso es…".',
    '',
    '## Retroalimentación sugerida',
    '- **Logrado (L):** Reforzar con elogio específico y ofrecer un desafío de mayor complejidad.',
    '- **En Proceso (EP):** Preguntas de andamiaje y nueva oportunidad de práctica.',
    '- **Por Lograr (PL):** Revisar instrucción, reducir carga cognitiva, repetir con apoyo.',
    '',
    '## Recursos',
    ...(recs.length > 0 ? recs.map((r) => `- ${r}`) : ['- Material impreso o digital según la actividad.', '- Elementos concretos según el eje disciplinar.']),
    '',
    '---',
    '*Actividad generada automáticamente por PlanificaIA Chile a partir del OA seleccionado.*',
  ].join('\n');
}

export function generateEvalFromIndicadores(
  item: { id: string; oa: string; habilidad: string; indicadores: string[]; conocimientos: string[] },
  nivel: string,
  asignatura: string,
): string {
  const inds = item.indicadores.slice(0, 5);
  const preguntas = inds.map((ind, i) => {
    const hab = item.habilidad;
    return [
      `### Pregunta ${i + 1}`,
      `**Indicador evaluado:** ${ind}`,
      `**Habilidad medida:** ${hab}`,
      ``,
      `**Instrucción:** Lee la situación y responde según lo trabajado en clases.`,
      `**Pregunta o tarea:** Diseña una tarea breve que permita evaluar: "${ind}".`,
      `- ¿Qué evidencia esperas del estudiante?`,
      `- ¿Qué formato de respuesta usarás? (oral/escrita/selección)dibujo)`,
      ``,
      `**Respuesta esperada / Criterio de logro:**`,
      `- Nivel destacado: Responde con precisión, justifica y demuestra dominio del contenido.`,
      `- Nivel esperado: Responde correctamente, pero sin justificación completa.`,
      `- En proceso: Responde parcialmente, requiere apoyo.`,
      `- Por lograr: No responde o no se relaciona con el indicador.`,
      ``,
      `**Retroalimentación para esta pregunta:**`,
      `- Destacado: Desafío complementario para profundizar.`,
      `- Esperado: Pregunta de extensión para justificar.`,
      `- En proceso: Repasar concepto y ofrecer nueva oportunidad.`,
      `- Por lograr: Retroalimentación individual con modelaje.`,
    ].join('\n');
  }).join('\n\n');

  return [
    `# Evaluación desde indicadores — ${asignatura}`,
    '',
    `**Nivel:** ${nivel}`,
    `**Asignatura:** ${asignatura}`,
    `**OA:** ${item.id} — ${item.oa}`,
    `**Habilidad evaluada:** ${item.habilidad}`,
    '',
    '## Instrucciones generales',
    'Estimado/a estudiante: Lee atentamente cada situación o tarea. Responde de acuerdo a lo trabajado en clases. Puedes pedir apoyo si no entiendes una instrucción. Tienes el tiempo asignado por tu docente para completar esta evaluación.',
    '',
    '## Preguntas y tareas',
    '',
    preguntas,
    '',
    '## Pauta de corrección general',
    '',
    '| Indicador | Destacado (3 pts) | Esperado (2 pts) | En Proceso (1 pt) | Por Lograr (0 pts) |',
    '|-----------|-------------------|------------------|-------------------|--------------------|',
    ...inds.map((ind) => `| ${ind.substring(0, 50)}${ind.length > 50 ? '…' : ''} | □ Demuestra con claridad y justifica | □ Responde correctamente sin justificar | □ Responde parcialmente | □ No responde o fuera de foco |`),
    '',
    '## Niveles de logro',
    `- **Destacado:** ${inds.length * 3 * 0.85}-${inds.length * 3} pts — Demuestra dominio completo del OA.`,
    `- **Esperado:** ${Math.ceil(inds.length * 3 * 0.7)}-${Math.floor(inds.length * 3 * 0.84)} pts — Logra el OA con apoyo mínimo.`,
    `- **En Proceso:** ${Math.ceil(inds.length * 3 * 0.5)}-${Math.floor(inds.length * 3 * 0.69)} pts — Logra parcialmente, requiere reforzamiento.`,
    `- **Por Lograr:** 0-${Math.floor(inds.length * 3 * 0.49)} pts — No logra el OA, necesita intervención dirigida.`,
    '',
    '## Retroalimentación',
    '- **Destacado:** Reconoce el logro específico y propone un desafío de extensión (pregunta abierta, investigación breve, creación).', 
    '- **Esperado:** Refuerza lo correcto y guía con una pregunta para profundizar la justificación.',
    '- **En Proceso:** Identifica el error o vacío, modela la respuesta esperada y ofrece práctica similar.',
    '- **Por Lograr:** Revisa la comprensión de la instrucción, reduce la demanda cognitiva y programa reenseñanza con apoyo adicional.',
    '',
    '## Reforzamiento sugerido',
    '1. Revisar el OA con material visual y ejemplos concretos.',
    '2. Practicar con ítems similares de menor dificultad.',
    '3. Trabajo en pareja con compañero tutor.',
    '4. Aplicar ticket de salida de reforzamiento antes de la próxima evaluación sumativa.',
    '5. Comunicar avances a la familia con sugerencias de apoyo.',
  ].join('\n');
}

export function generateEvalAvanzado(params: {
  tipo: string;
  nivel: string;
  asignatura: string;
  oa: string;
  habilidad: string;
  indicadores: string[];
  dificultad: string;
  texto: string;
}): string {
  const { tipo, nivel, asignatura, oa, habilidad, indicadores, dificultad, texto } = params;
  const esParv = nivel === 'Prekinder' || nivel === 'Kinder';
  const esSIMCE = tipo.toLowerCase().includes('simce');
  const esRubrica = tipo.toLowerCase().includes('rubrica') || tipo.toLowerCase().includes('holistica');
  const esCotejo = tipo.toLowerCase().includes('cotejo');
  const esEscala = tipo.toLowerCase().includes('escala');
  const esTicket = tipo.toLowerCase().includes('ticket');
  const esAuto = tipo.toLowerCase().includes('autoevaluacion');
  const esCo = tipo.toLowerCase().includes('coevaluacion');
  const esDiagnostica = tipo.toLowerCase().includes('diagnostica');
  const esSumativa = tipo.toLowerCase().includes('sumativa');
  const inds = indicadores.slice(0, 6);

  if (esParv) {
    return [
      `# ${tipo} — Educación Parvularia`,
      '',
      `**Nivel:** ${nivel} | **Ámbito:** ${asignatura}`,
      `**OA:** ${oa}`,
      `**Habilidad:** ${habilidad}`,
      '',
      '## Indicadores de logro observables',
      ...inds.map((ind, i) => `${i + 1}. ${ind}`),
      '',
      '## Situación de evaluación',
      'Se evaluará durante una experiencia de aprendizaje lúdica y contextualizada, mediante observación directa y registro cualitativo.',
      '',
      '## Pauta de observación',
      '',
      '| Indicador | Logrado | En Proceso | No Observado | Observaciones |',
      '|-----------|---------|------------|--------------|---------------|',
      ...inds.map((ind) => `| ${ind} | □ | □ | □ | |`),
      '',
      '## Retroalimentación',
      '- **Logrado:** Reforzar con elogio específico y ofrecer nuevo desafío.',
      '- **En Proceso:** Acompañar con preguntas de andamiaje.',
      '- **No Observado:** Repetir la experiencia en otro momento o formato.',
    ].join('\n');
  }

  if (esSIMCE) {
    const preguntas = inds.map((ind, i) => {
      const habs = ['Localizar información', 'Inferir', 'Interpretar', 'Evaluar', 'Aplicar', 'Analizar'];
      const h = habs[i % habs.length];
      const distractores = [
        ['Respuesta que confunde causa y efecto', 'Respuesta correcta basada en evidencia textual', 'Respuesta que usa información parcial', 'Respuesta fuera de contexto'],
        ['Inferencia no respaldada por el texto', 'Inferencia correcta con evidencia explícita', 'Interpretación literal sin inferencia', 'Opinión personal sin base textual'],
        ['Identificación incorrecta del propósito', 'Interpretación correcta del lenguaje figurado', 'Comprensión superficial del texto', 'Respuesta basada en conocimiento previo no textual'],
        ['Conclusión sin evidencia suficiente', 'Evaluación correcta con justificación', 'Juicio parcial basado en un solo elemento', 'Descripción sin evaluación'],
      ];
      const dist = distractores[i % distractores.length];
      return [
        `### Pregunta ${i + 1}`,
        `**Indicador evaluado:** ${ind}`,
        `**Habilidad medida:** ${h}`,
        `**Dificultad:** ${dificultad}`,
        `**OA relacionado:** ${oa}`,
        '',
        `${i + 1}. ${texto ? `Considerando "${texto.substring(0, 80)}..."` : 'A partir de la siguiente situación:'} ¿cuál de las siguientes opciones ${i === 0 ? 'representa mejor' : i === 1 ? 'se puede inferir' : i === 2 ? 'interpreta correctamente' : 'evalúa adecuadamente'} lo planteado?`,
        `   A) ${dist[0]}`,
        `   B) ${dist[1]} ← *Respuesta correcta*`,
        `   C) ${dist[2]}`,
        `   D) ${dist[3]}`,
        '',
        `**Respuesta correcta:** B`,
        `**Explicación:** ${dist[1].toLowerCase()} porque se alinea directamente con el OA y la evidencia disponible.`,
        `**Puntaje sugerido:** 1 punto (correcta) / 0 puntos (incorrecta)`,
        '',
        `**Retroalimentación:**`,
        `- Si elegiste A: Revisa la diferencia entre causa y efecto. Vuelve al texto y busca evidencia directa.`,
        `- Si elegiste B: ¡Correcto! Has ${h.toLowerCase()} adecuadamente.`,
        `- Si elegiste C: Intenta buscar información más completa antes de responder.`,
        `- Si elegiste D: Asegúrate de basar tu respuesta en el texto, no solo en tu opinión.`,
      ].join('\n');
    }).join('\n\n');

    return [
      `# Evaluación tipo SIMCE`,
      '',
      `**Nivel:** ${nivel} | **Asignatura:** ${asignatura}`,
      `**OA evaluado:** ${oa}`,
      `**Habilidad principal:** ${habilidad}`,
      `**Dificultad:** ${dificultad}`,
      '',
      '## Instrucciones para el/la estudiante',
      'Lee atentamente cada pregunta y sus cuatro alternativas. Selecciona la opción que consideres correcta marcando con una X. Solo una alternativa es correcta. No se descuenta puntaje por respuestas incorrectas.',
      '',
      '## Preguntas',
      '',
      preguntas,
      '',
      '## Tabla de especificaciones',
      '',
      '| Pregunta | Indicador | Habilidad | Dificultad | OA | Puntaje |',
      '|----------|-----------|-----------|------------|-----|---------|',
      ...inds.map((ind, i) => {
        const habs = ['Localizar', 'Inferir', 'Interpretar', 'Evaluar', 'Aplicar', 'Analizar'];
        return `| ${i + 1} | ${ind.substring(0, 40)}… | ${habs[i % habs.length]} | ${dificultad} | ${oa.substring(0, 30)}… | 1 pt |`;
      }),
      '',
      '## Pauta de corrección',
      '| Pregunta | Respuesta correcta | Explicación |',
      '|----------|-------------------|-------------|',
      ...inds.map((_, i) => `| ${i + 1} | B | Ver explicación detallada en cada pregunta. |`),
      '',
      '## Análisis de resultados por habilidad',
      'Agrupa los resultados de los estudiantes por habilidad para identificar fortalezas y áreas de mejora. Sugerencia: usa una tabla como la siguiente:',
      '',
      '| Habilidad | N° preguntas | % de logro curso | Prioridad de reenseñanza |',
      '|-----------|-------------|------------------|--------------------------|',
      '| Localizar | 2 | % | Baja |',
      '| Inferir | 2 | % | Alta |',
      '| Interpretar | 1 | % | Media |',
      '| Evaluar | 1 | % | Alta |',
      '',
      '## Retroalimentación general',
      '- Revisa con el curso las preguntas con menor porcentaje de logro.',
      '- Modela la estrategia de respuesta para cada tipo de habilidad.',
      '- Ofrece práctica adicional focalizada en inferencia y evaluación.',
    ].join('\n');
  }

  if (esRubrica) {
    return [
      `# ${tipo}`,
      '',
      `**Nivel:** ${nivel} | **Asignatura:** ${asignatura}`,
      `**OA:** ${oa} | **Habilidad:** ${habilidad}`,
      '',
      '## Propósito',
      'Rúbrica analítica para evaluar desempeños y retroalimentar el aprendizaje de forma específica.',
      '',
      '## Criterios de evaluación',
      '',
      '| Criterio | Destacado (4 pts) | Esperado (3 pts) | En Proceso (2 pts) | Por Lograr (1 pt) |',
      '|----------|-------------------|------------------|-------------------|-------------------|',
      ...inds.map((ind) => `| ${ind.substring(0, 50)} | Demuestra con precisión y justifica | Responde correctamente sin justificar | Responde parcialmente | No responde o fuera de foco |`),
      '',
      '## Niveles de logro',
      `- **Destacado:** ${(inds.length * 4 * 0.85).toFixed(0)}-${inds.length * 4} pts`,
      `- **Esperado:** ${(inds.length * 4 * 0.7).toFixed(0)}-${(inds.length * 4 * 0.84).toFixed(0)} pts`,
      `- **En Proceso:** ${(inds.length * 4 * 0.5).toFixed(0)}-${(inds.length * 4 * 0.69).toFixed(0)} pts`,
      `- **Por Lograr:** 0-${(inds.length * 4 * 0.49).toFixed(0)} pts`,
      '',
      '## Retroalimentación por criterio',
      ...inds.map((ind) => [
        `**${ind.substring(0, 60)}:**`,
        '- Destacado: "Lograste… porque…" Propón un desafío de profundización.',
        '- Esperado: "Avanzaste en… Ahora intenta…"',
        '- En Proceso: "Partamos por…" Modela la respuesta esperada.',
        '- Por Lograr: Reduce la demanda y ofrece práctica guiada.',
      ].join('\n')),
    ].join('\n');
  }

  if (esCotejo || esEscala) {
    const esCotejoBool = esCotejo;
    const columnas = esCotejoBool ? 'Logrado | No Logrado' : 'Siempre | Casi Siempre | A veces | Rara vez';
    return [
      `# ${tipo}`,
      '',
      `**Nivel:** ${nivel} | **Asignatura:** ${asignatura}`,
      `**OA:** ${oa} | **Habilidad:** ${habilidad}`,
      '',
      '## Propósito',
      esCotejoBool ? 'Lista de cotejo para verificar logro de indicadores observables.' : 'Escala de apreciación para valorar frecuencia de desempeños.',
      '',
      `## Indicadores`,
      '',
      `| Indicador | ${columnas} | Observaciones |`,
      '|-----------|-------------|---------------|',
      ...inds.map((ind) => `| ${ind} | □ □ | |`),
      '',
      '## Pauta de aplicación',
      'Marca con una X según corresponda. Utiliza la columna de observaciones para registrar evidencia cualitativa.',
      '',
      esCotejoBool
        ? '**Logrado:** El estudiante demuestra el indicador de forma consistente.\n**No Logrado:** El estudiante no demuestra el indicador o lo hace de forma inconsistente.'
        : '**Siempre:** 4 pts | **Casi Siempre:** 3 pts | **A veces:** 2 pts | **Rara vez:** 1 pt',
    ].join('\n');
  }

  if (esTicket) {
    return [
      `# Ticket de salida`,
      '',
      `**Nivel:** ${nivel} | **Asignatura:** ${asignatura}`,
      `**OA:** ${oa} | **Habilidad:** ${habilidad}`,
      '',
      '**Instrucciones:** Responde brevemente las siguientes preguntas. Este ticket le ayudará a tu docente a saber qué aprendiste y qué necesitas reforzar.',
      '',
      ...inds.slice(0, 3).map((ind, i) => [
        `**${i + 1}.** ${ind}`,
        `- *Habilidad: ${habilidad}*`,
        `- *Respuesta esperada:* Aplica correctamente el OA.`,
        `- *Puntaje:* 1 punto.`,
        '',
        `**Retroalimentación:**`,
        `- Correcto: "¡Bien! Has ${habilidad.toLowerCase()} adecuadamente."`,
        `- Incorrecto: "Revisa nuevamente la información clave."`,
      ].join('\n')).join('\n'),
      '',
      '## Pregunta de metacognición',
      '¿Qué estrategia usaste para resolver la actividad? ¿Funcionó? ¿Qué harías distinto la próxima vez?',
      '',
      '## Pauta rápida',
      '- **3 puntos:** Logra todos los indicadores.',
      '- **2 puntos:** Logra parcialmente.',
      '- **1 punto o menos:** Requiere reforzamiento.',
    ].join('\n');
  }

  if (esAuto) {
    return [
      `# ${tipo}`,
      '',
      `**Nivel:** ${nivel} | **Asignatura:** ${asignatura}`,
      `**OA:** ${oa} | **Habilidad:** ${habilidad}`,
      '',
      '## Instrucciones',
      'Lee cada afirmación y marca con una X la opción que mejor represente tu desempeño. Sé honesto/a. Esta autoevaluación te ayudará a identificar tus fortalezas y áreas de mejora.',
      '',
      '## Autoevaluación',
      '',
      '| Indicador | Lo logré | En proceso | Necesito apoyo |',
      '|-----------|----------|------------|----------------|',
      ...inds.map((ind) => `| ${ind} | □ | □ | □ |`),
      '',
      '## Preguntas de reflexión',
      '1. ¿Qué fue lo más fácil? ¿Por qué?',
      '2. ¿Qué fue lo más difícil? ¿Cómo lo resolviste?',
      '3. ¿Qué estrategia te funcionó mejor?',
      '4. ¿Qué harías distinto la próxima vez?',
      '5. ¿Qué ayuda necesitas de tu docente?',
    ].join('\n');
  }

  if (esCo) {
    return [
      `# ${tipo}`,
      '',
      `**Nivel:** ${nivel} | **Asignatura:** ${asignatura}`,
      `**OA:** ${oa} | **Habilidad:** ${habilidad}`,
      '',
      '## Instrucciones',
      'Evalúa el desempeño de tu compañero/a de equipo durante el trabajo colaborativo. Marca con una X la opción que mejor represente su participación. Sé respetuoso/a y constructivo/a.',
      '',
      `**Nombre del/la compañero/a evaluado/a:** ____________________`,
      '',
      '## Coevaluación',
      '',
      '| Indicador | Siempre | Casi siempre | A veces | Rara vez |',
      '|-----------|---------|--------------|---------|----------|',
      ...inds.map((ind) => `| ${ind} | □ | □ | □ | □ |`),
      '',
      '## Comentarios',
      'Escribe algo positivo sobre el trabajo de tu compañero/a y una sugerencia para mejorar:',
      '',
      '**Algo positivo:** _______________________________________________',
      '',
      '**Sugerencia:** _________________________________________________',
    ].join('\n');
  }

  if (esDiagnostica) {
    return [
      `# ${tipo}`,
      '',
      `**Nivel:** ${nivel} | **Asignatura:** ${asignatura}`,
      `**OA de referencia:** ${oa}`,
      `**Habilidad:** ${habilidad}`,
      '',
      '## Propósito',
      'Evaluación diagnóstica para identificar conocimientos previos y nivel de desarrollo de la habilidad antes de iniciar la unidad.',
      '',
      '## Instrucciones',
      'Responde las siguientes preguntas según tus conocimientos actuales. No estudies para esta evaluación, solo queremos saber qué sabes hasta ahora.',
      '',
      ...inds.slice(0, 5).map((ind, i) => [
        `**${i + 1}.** ${ind}`,
        `  *Habilidad: ${habilidad} | Dificultad: ${dificultad}*`,
        `  *Puntaje sugerido: 1 punto*`,
        `  *Respuesta esperada:* Relacionada con el OA.`,
        `  *Retroalimentación:* Según nivel de logro.`,
      ].join('\n')).join('\n\n'),
      '',
      '## Niveles de diagnóstico',
      `- **Sobre el esperado:** ${(inds.length * 0.8).toFixed(0)}+ pts — Domina los prerrequisitos.`,
      `- **En el esperado:** ${(inds.length * 0.5).toFixed(0)}-${(inds.length * 0.79).toFixed(0)} pts — Tiene base suficiente.`,
      `- **Bajo el esperado:** 0-${(inds.length * 0.49).toFixed(0)} pts — Requiere nivelación antes de iniciar la unidad.`,
    ].join('\n');
  }

  if (esSumativa) {
    return [
      `# ${tipo}`,
      '',
      `**Nivel:** ${nivel} | **Asignatura:** ${asignatura}`,
      `**OA evaluado:** ${oa}`,
      `**Habilidad principal:** ${habilidad}`,
      `**Dificultad:** ${dificultad}`,
      '',
      '## Instrucciones',
      'Lee cada pregunta con atención. Responde de acuerdo a lo trabajado durante la unidad. Tienes el tiempo asignado para completar esta evaluación.',
      '',
      '## Ítems de evaluación',
      '',
      ...inds.map((ind, i) => [
        `### ${i + 1}. ${ind}`,
        `**Habilidad evaluada:** ${habilidad}`,
        `**Dificultad:** ${dificultad}`,
        `**Puntaje sugerido:** 2 puntos (1 respuesta correcta + 1 justificación)`,
        `**Respuesta esperada:** Aplica correctamente el OA y justifica con evidencia.`,
        '',
        `**Retroalimentación:**`,
        `- Correcto con justificación: Logro completo. ¡Sigue así!`,
        `- Correcto sin justificación: Bien, pero intenta explicar por qué.`,
        `- Incorrecto: Revisa el OA y vuelve a intentar.`,
      ].join('\n')).join('\n\n'),
      '',
      '## Pauta de corrección',
      '',
      '| Ítem | Respuesta esperada | Puntaje | Criterio |',
      '|------|-------------------|---------|----------|',
      ...inds.map((_, i) => `| ${i + 1} | Aplica el OA correctamente y justifica. | 2 pts | Ver rúbrica |`),
      '',
      '## Retroalimentación general',
      '- Revisa con el curso los ítems de menor logro.',
      '- Ofrece actividades de reforzamiento focalizadas.',
      '- Comunica resultados con énfasis en el progreso.',
    ].join('\n');
  }

  return [
    `# ${tipo}`,
    '',
    `**Nivel:** ${nivel} | **Asignatura:** ${asignatura}`,
    `**OA:** ${oa} | **Habilidad principal:** ${habilidad}`,
    `**Dificultad:** ${dificultad}`,
    '',
    '## Instrucciones',
    'Responde cada pregunta según lo trabajado en clases. Lee con atención antes de responder.',
    '',
    ...inds.map((ind, i) => [
      `### ${i + 1}. ${ind}`,
      `**Habilidad evaluada:** ${habilidad}`,
      `**Dificultad:** ${dificultad}`,
      `**Puntaje sugerido:** 1 punto`,
      `**Respuesta esperada:** Demuestra comprensión del OA aplicando ${habilidad.toLowerCase()}.`,
      '',
      `**Retroalimentación:**`,
      `- Correcto: Logro esperado. Refuerzo positivo.`,
      `- Incorrecto: Revisar OA y practicar con ejercicio similar.`,
    ].join('\n')).join('\n\n'),
    '',
    '## Pauta de corrección',
    '',
    '| Ítem | Respuesta esperada | Puntaje |',
    '|------|-------------------|---------|',
    ...inds.map((_, i) => `| ${i + 1} | Según rúbrica de evaluación | 1 pt |`),
    '',
    '## Retroalimentación sugerida',
    '- Revisar errores y planificar reenseñanza si es necesario.',
    '- Ofrece práctica adicional focalizada.',
  ].join('\n');
}

export function generateEval(d: EvalFormData): string {
  const esParv = esParvularia(d.nivel);
  const hdr = oaHeader(d.nivel, d.asignatura, d.oa);

  if (esParv) {
    const tipo = d.tipo;
    return hdr + [
      `# ${tipo} - Educación Parvularia`,
      '',
      `**Nivel:** ${d.nivel}`,
      `**Ámbito:** ${d.asignatura}`,
      '',
      '## OA / Habilidad',
      d.oa || 'Especificar OA de las BCEP.',
      '',
      '## Propósito de la evaluación',
      'Evaluación formativa basada en observación directa y registro cualitativo del desempeño de niños y niñas en situaciones de aprendizaje lúdicas y contextualizadas.',
      '',
      '## Indicadores de logro observables',
      '1. Participa activamente en la experiencia propuesta.',
      '2. Sigue instrucciones orales de uno o dos pasos.',
      '3. Se expresa verbalmente con claridad, usando vocabulario pertinente.',
      '4. Interactúa de manera positiva con sus pares.',
      '5. Manifiesta curiosidad e interés por la actividad.',
      '',
      '## Situación de evaluación',
      'Se evaluará durante una experiencia de aprendizaje grupal en un ambiente natural y lúdico. La educadora observará y registrará los desempeños sin interrumpir la actividad.',
      '',
      '## Pauta de observación',
      '',
      '| Indicador | Logrado | En Proceso | No Observado | Observaciones |',
      '|-----------|---------|------------|--------------|---------------',
      '| 1. Participación activa | □ | □ | □ | |',
      '| 2. Sigue instrucciones | □ | □ | □ | |',
      '| 3. Expresión verbal | □ | □ | □ | |',
      '| 4. Interacción social | □ | □ | □ | |',
      '| 5. Curiosidad e interés | □ | □ | □ | |',
      '',
      '## Registro anecdótico',
      '',
      '---',
      '**Nombre:** | **Fecha:**',
      '**Desempeño destacado:**',
      '**Oportunidad de mejora:**',
      '**Observaciones:**',
      '---',
      '',
      '## Retroalimentación',
      '- **Logrado:** Reforzar con elogio específico y ofrecer nuevo desafío.',
      '- **En Proceso:** Acompañar con mediación y preguntas de apoyo.',
      '- **No Observado:** Repetir la experiencia en otro momento o formato.',
    ].join('\n');
  }

  const n = Math.max(3, Math.min(40, d.nPreguntas || 10));
  let qs = '';
  for (let i = 1; i <= n; i++) {
    const h = hab(i);
    qs += [
      '',
      `${i}. (${h}) Lee la situación o texto base y responde. ¿Cuál alternativa demuestra mejor el aprendizaje esperado?`,
      '   A) Respuesta distractora plausible.',
      '   B) Respuesta correcta.',
      '   C) Respuesta incompleta.',
      '   D) Respuesta fuera de foco.',
      `   Habilidad: ${h}. Respuesta correcta: B. Retroalimentación: revisa la evidencia y justifica tu elección.`,
    ].join('\n');
  }
  return hdr + [
    `# ${d.tipo}`,
    '',
    `**Nivel:** ${d.nivel}`,
    `**Asignatura:** ${d.asignatura}`,
    `**Dificultad:** ${d.dificultad}`,
    '',
    '## OA / habilidad',
    d.oa || 'OA pendiente.',
    '',
    '## Texto base / tema',
    d.texto || 'Texto o situación breve creada por el/la docente según el contenido.',
    '',
    '## Instrucciones para estudiantes',
    'Lee con atención. Marca una alternativa por pregunta. Luego justifica dos respuestas usando evidencia.',
    '',
    '## Preguntas',
    qs,
    '',
    '## Pauta',
    '- 1 punto por alternativa correcta.',
    '- 2 puntos adicionales por justificación clara en preguntas seleccionadas.',
    '',
    '## Análisis docente',
    'Agrupa errores en: comprensión de vocabulario, interpretación de instrucciones, inferencia, cálculo/procedimiento o justificación.',
    '',
    '## Reenseñanza sugerida',
    '1. Modelar una pregunta difícil.',
    '2. Comparar distractores.',
    '3. Repetir práctica con apoyo visual.',
    '4. Aplicar ticket de salida de 3 ítems.',
  ].join('\n');
}

export function generateRecursoAvanzado(params: {
  modo: string;
  nivel: string;
  asignatura: string;
  eje: string;
  oa: string;
  habilidad: string;
  indicadores: string[];
  necesidad: string;
  dificultad: string;
}): string {
  const { modo, nivel, asignatura, eje, oa, habilidad, indicadores, necesidad, dificultad } = params;
  const inds = indicadores.slice(0, 5);
  const esParv = nivel === 'Prekinder' || nivel === 'Kinder';

  const modoLabel: Record<string, string> = {
    oa_seleccionado: 'OA seleccionado',
    indicadores: 'Indicadores seleccionados',
    habilidad: 'Habilidad específica',
    rezago: 'Estudiantes con rezago',
    simce: 'Evaluación tipo SIMCE',
    dua: 'Actividad DUA',
    reforzamiento: 'Reforzamiento',
    ampliacion: 'Ampliación para estudiantes avanzados',
  };

  const getActividadPrincipal = (): string[] => {
    switch (modo) {
      case 'rezago':
        return [
          '### Actividad principal (andamiada)',
          '1. **Lectura/presentación guiada:** El/la docente modela paso a paso con apoyo visual.',
          '2. **Práctica estructurada:** Ejercicios con apoyo de banco de palabras, imágenes o ejemplos.',
          '3. **Verificación frecuente:** Pausas cada 2-3 ítems para verificar comprensión.',
          '4. **Producción guiada:** El/la estudiante completa una tarea similar con apoyos.',
        ];
      case 'simce':
        return [
          '### Actividad principal — Ensayo SIMCE',
          `**Instrucciones:** Lee cada pregunta y selecciona la alternativa correcta (A-D). Justifica tu respuesta cuando se indique.`,
          `**Dificultad:** ${dificultad || 'Progresiva'}`,
          '',
          ...Array.from({ length: 5 }, (_, i) => [
            `${i + 1}. Pregunta tipo SIMCE sobre ${oa.substring(0, 60)}...`,
            '   A) Alternativa A',
            '   B) Alternativa B (correcta)',
            '   C) Alternativa C',
            '   D) Alternativa D',
            `   *Habilidad: ${habilidad} | Dificultad: ${dificultad || 'Media'}*`,
          ]).flat(),
        ];
      case 'dua':
        return [
          '### Actividad principal (DUA)',
          '1. **Representación múltiple:** El contenido se presenta en 3 formatos: texto breve, imagen/diagrama, y audio/lectura en voz alta.',
          '2. **Acción y expresión múltiple:** El/la estudiante elige cómo responder: escribir, dibujar, grabar audio, o seleccionar entre opciones.',
          '3. **Participación múltiple:** Actividad en 3 estaciones o niveles donde el estudiante elige su punto de partida.',
          '4. **Producto final:** Cada estudiante demuestra su aprendizaje en el formato que mejor se adecúe a sus fortalezas.',
        ];
      case 'reforzamiento':
        return [
          '### Actividad de reforzamiento',
          '1. **Repaso visual:** Infografía o mapa conceptual con los contenidos clave.',
          '2. **Práctica focalizada:** 3-5 ejercicios específicos sobre la habilidad no lograda.',
          '3. **Autocorrección guiada:** El estudiante revisa sus respuestas con una pauta simple.',
          '4. **Ticket de salida:** 2 preguntas para verificar logro después del reforzamiento.',
        ];
      case 'ampliacion':
        return [
          '### Actividad de ampliación — Desafío avanzado',
          '1. **Problema/complejidad mayor:** Situación que requiere aplicar el OA en un contexto nuevo o multidisciplinario.',
          '2. **Investigación breve:** El estudiante indaga, compara o contrasta información de dos fuentes.',
          '3. **Creación o producción:** Elabora un producto original (texto, infografía, presentación, modelo).',
          '4. **Autoevaluación y reflexión:** Analiza su propio proceso de aprendizaje y establece metas.',
        ];
      default:
        return [
          '### Actividad principal',
          '1. **Activación:** Pregunta o situación para conectar con conocimientos previos.',
          '2. **Modelaje:** El/la docente demuestra el proceso o estrategia.',
          '3. **Práctica guiada:** Trabajo en parejas o grupos pequeños.',
          '4. **Práctica independiente:** Cada estudiante aplica lo aprendido.',
        ];
    }
  };

  return [
    `# ${modoLabel[modo] || 'Recurso pedagógico'}`,
    '',
    `**Nivel:** ${nivel} | **Asignatura:** ${asignatura} | **Eje:** ${eje}`,
    `**Dificultad sugerida:** ${dificultad || 'Progresiva'}`,
    '',
    '## Datos curriculares',
    `**OA:** ${oa}`,
    `**Habilidad:** ${habilidad}`,
    ...(inds.length > 0 ? [`**Indicadores abordados:**`, ...inds.map((i, n) => `${n + 1}. ${i}`)] : []),
    '',
    '## Instrucciones para el/la docente',
    '1. Revisa el OA y los indicadores antes de comenzar.',
    '2. Prepara los materiales y apoyos visuales necesarios.',
    '3. Organiza el espacio según el tipo de actividad (individual, pares, grupos).',
    '4. Lee las instrucciones para estudiantes en voz alta y verifica comprensión.',
    '5. Circula y observa durante la actividad, tomando notas para la retroalimentación.',
    ...(esParv ? ['6. Adapta los tiempos según el ritmo del grupo.', '7. Incorpora momentos de movimiento y pausa activa.'] : []),
    '',
    '## Instrucciones para estudiantes',
    ...(esParv
      ? ['1. Escucha con atención las instrucciones.', '2. Observa los materiales y las imágenes.', '3. Trabaja con tu grupo o compañero.', '4. Pide ayuda si no entiendes.', '5. Comparte tus ideas y escucha a los demás.']
      : ['1. Lee o escucha las instrucciones completas antes de empezar.', '2. Identifica qué se te pide: ¿responder, crear, explicar, resolver?', '3. Usa los apoyos disponibles (banco de palabras, esquemas, ejemplos).', '4. Consulta con tu compañero/a antes de preguntar al docente.', '5. Revisa tu trabajo antes de entregarlo.']),
    '',
    ...getActividadPrincipal(),
    '',
    '## Actividad diferenciada',
    ...(modo === 'rezago'
      ? ['**Para estudiantes descendidos:** Misma actividad pero con: instrucciones paso a paso impresas, banco de palabras con imágenes, menos ítems por página, apoyo de compañero tutor.',
         '**Para el resto del curso:** Actividad completa sin modificaciones.',
         '**Para avanzados:** Preguntas de extensión al final de cada ejercicio.']
      : modo === 'ampliacion'
      ? ['**Para estudiantes avanzados:** Desafío auténtico, investigación complementaria, producción original.',
         '**Para el resto del curso:** Actividad estándar con apoyos según necesidad.',
         '**Para descendidos:** Mismos contenidos con andamiaje adicional, más tiempo, apoyos visuales.']
      : ['**Para estudiantes descendidos:** versión simplificada con apoyos visuales, banco de palabras, menos ítems.',
         '**Para estudiantes avanzados:** desafío adicional que profundiza el OA.',
         '**Para estudiantes con NEE:** adecuaciones según PIE, apoyo individualizado.']),
    '',
    '## Apoyo DUA',
    ...(modo === 'dua'
      ? ['**Representación:** Contenido en 3 formatos simultáneos (texto, imagen, oral).',
         '**Acción y expresión:** Opción de respuesta oral, escrita, dibujada, grabada o seleccionada.',
         '**Participación:** Estaciones de aprendizaje con elección, trabajo en equipo, roles flexibles.',
         '**Compromiso:** Conexión con intereses personales, retroalimentación frecuente, metas claras.']
      : ['**Representación:** Instrucciones orales + escritas, vocabulario clave destacado, organizador gráfico.',
         '**Acción y expresión:** Opción de respuesta en diferentes formatos.',
         '**Participación:** Roles definidos, trabajo colaborativo, elección de tarea.']),
    '',
    '## Preguntas de pensamiento',
    '1. **Literal:** ¿Qué información relevante encuentras en el texto / problema / actividad?',
    '2. **Inferencial:** ¿Qué puedes concluir a partir de la evidencia? ¿Por qué?',
    '3. **Crítico:** ¿Estás de acuerdo con...? ¿Qué cambiarías? ¿Por qué?',
    '4. **Metacognición:** ¿Qué estrategia te funcionó mejor? ¿Qué harías distinto la próxima vez?',
    ...(modo === 'ampliacion' ? ['5. **Creativo:** ¿Cómo aplicarías este aprendizaje a un problema real de tu comunidad?'] : []),
    '',
    '## Evidencia esperada',
    '- Producto escrito, gráfico, oral o digital que demuestre logro del OA.',
    '- Registro de observación docente con indicadores cotejados.',
    '- Autoevalución del estudiante usando escala simple o preguntas guía.',
    '',
    '## Pauta breve de revisión',
    '| Criterio | Logrado (3) | Parcial (2) | Por lograr (1) |',
    '|----------|-------------|-------------|----------------|',
    `| Comprensión del OA | Demuestra dominio completo | Demuestra comprensión parcial | No demuestra comprensión |`,
    `| Aplicación de ${habilidad.toLowerCase()} | Aplica correctamente | Aplica con apoyo | No aplica |`,
    '| Calidad del producto | Completo, organizado y claro | Parcialmente completo | Incompleto o desorganizado |',
    ...(modo === 'simce' ? ['| Uso de estrategias SIMCE | Responde y justifica correctamente | Responde sin justificar | No responde o fuera de foco |'] : []),
    '',
    '## Retroalimentación sugerida',
    '- **Logrado:** Reconoce el logro: "Lograste... porque..." Ofrece desafío de profundización.',
    '- **En Proceso:** Identifica el avance: "Avanzaste en..." Pregunta de andamiaje: "¿Qué pasaría si...?"',
    '- **Por Lograr:** Reduce la demanda: "Partamos por..." Modela la respuesta esperada y ofrece práctica similar.',
    '',
    '---',
    `*Recurso generado en modo ${modoLabel[modo] || 'personalizado'} por PlanificaIA Chile.*`,
  ].join('\n');
}
