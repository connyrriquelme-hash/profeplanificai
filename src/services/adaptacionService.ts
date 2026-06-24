import type { AdaptacionConfig, AdaptacionResult, CurriculumItem } from '../types';
import { generarConIA } from './aiService';

export function generarAdaptacionLocal(
  item: CurriculumItem,
  config: AdaptacionConfig,
  contenidoOriginal: string,
): AdaptacionResult {
  const { oa, habilidad, indicadores, curso, asignatura, eje } = item;
  const foco = config.focoApoyo;
  const formato = config.formato;
  const apoyo = config.nivelApoyo;
  const tiempoExtra = config.tiempoAdicional ? ' (con tiempo adicional)' : '';
  const evalAlt = config.evalAlternativa ? ' e instrumento de evaluación alternativo' : '';
  const simple = config.simplificacion;

  const nivelApoyo = apoyo === 'alto' ? 'intensivo'
    : apoyo === 'medio' ? 'moderado'
    : 'leve';

  const focoLabel: Record<string, string> = {
    lectura: 'Lectura', escritura: 'Escritura', comprensión: 'Comprensión',
    cálculo: 'Cálculo', atención: 'Atención', 'lenguaje oral': 'Lenguaje oral',
    motricidad: 'Motricidad', convivencia: 'Convivencia',
  };

  const formatoLabel: Record<string, string> = {
    visual: 'Visual (imágenes, diagramas, colores)',
    oral: 'Oral (audición, habla, podcast)',
    manipulativo: 'Manipulativo (tacto, movimiento, concreto)',
    digital: 'Digital (herramientas TIC, apps, simulaciones)',
    colaborativo: 'Colaborativo (pares, grupos, tutoría)',
  };

  const SH = '#';
  const BR = '---';

  return {
    estandar: [
      `${SH} Versión estándar — ${asignatura}`,
      '',
      `**Nivel:** ${curso} | **Asignatura:** ${asignatura} | **Eje:** ${eje}`,
      '',
      `## Objetivo de Aprendizaje`,
      oa,
      '',
      `## Habilidad`,
      habilidad,
      '',
      `## Indicadores`,
      ...indicadores.slice(0, 5).map((ind, i) => `${i + 1}. ${ind}`),
      '',
      `## Desarrollo de la actividad`,
      '1. **Activación:** Pregunta inicial para conectar con conocimientos previos.',
      '2. **Modelaje:** El/la docente demuestra la estrategia o procedimiento.',
      '3. **Práctica guiada:** Estudiantes trabajan en parejas con supervisión.',
      '4. **Práctica independiente:** Cada estudiante aplica lo aprendido.',
      '5. **Cierre:** Síntesis colectiva y ticket de salida.',
      '',
      `## Evaluación formativa`,
      '- Instrumento: Pauta de observación con escala L/EP/PL.',
      '- Criterio de logro: Demuestra comprensión del OA aplicando la habilidad.',
      '- Retroalimentación: Descriptiva según nivel de logro.',
      '',
      BR,
      '*Versión estándar para todos los estudiantes, alineada al OA ministerial.*',
    ].join('\n'),

    simplificada: (simple ? [
      `${SH} Versión simplificada — Apoyo ${nivelApoyo} en ${focoLabel[foco]}`,
      '',
      `**Nivel:** ${curso} | **Asignatura:** ${asignatura}`,
      `**Nivel de apoyo:** ${apoyo} | **Foco:** ${focoLabel[foco]}${tiempoExtra}`,
      '',
      `## Objetivo de Aprendizaje (versión simplificada)`,
      simplificarOA(oa),
      '',
      `## Indicadores priorizados`,
      ...indicadores.slice(0, 3).map((ind, i) => `${i + 1}. ${versionesSimplificada(ind)}`),
      '',
      `## Desarrollo andamiado`,
      '1. **Instrucción paso a paso:** Cada paso viene con imagen o pictograma.',
      '2. **Apoyo visual permanente:** Esquema o mapa conceptual visible durante toda la clase.',
      '3. **Banco de palabras clave:** Vocabulario esencial con definición simple e imagen.',
      '4. **Práctica guiada extendida:** Más ejemplos modelados, menos ítems.',
      '5. **Verificación frecuente:** Pausa cada 2 pasos para chequear comprensión.',
      '',
      `## Evaluación adaptada`,
      '- Ítems reducidos (2-3 en lugar de 5-6).',
      '- Respaldo oral si la escritura es una barrera.',
      '- Más tiempo para completar.',
      '- Criterio: Logrado con apoyo / En proceso / Requiere reenseñanza.',
      '',
      `## Apoyos específicos para ${focoLabel[foco]}`,
      getApoyoPorFoco(foco, 'simplificada'),
      '',
      BR,
      `*Versión adaptada con apoyo ${nivelApoyo} para estudiantes que requieren simplificación. Alineada al OA original.*`,
    ].join('\n') : `${SH} Versión simplificada\n\nNo se generó (opción desactivada).`),

    apoyoVisual: [
      `${SH} Versión con apoyo visual — Formato ${formatoLabel[formato]}`,
      '',
      `**Nivel:** ${curso} | **Asignatura:** ${asignatura}`,
      `**Formato predominante:** ${formatoLabel[formato]} | **Apoyo:** ${apoyo}`,
      '',
      `## OA`,
      oa,
      '',
      `## Estrategia visual / sensorial`,
      getFormatoEstrategia(formato, foco),
      '',
      `## Material visual sugerido`,
      ...getMaterialVisual(formato, foco, indicadores),
      '',
      `## Secuencia adaptada`,
      '1. **Presentación visual del objetivo:** Usar imagen/diagrama que represente el OA.',
      '2. **Organizador gráfico:** Plantilla visual para estructurar la respuesta.',
      '3. **Práctica con apoyos visuales:** Tarjetas, láminas, esquemas, colores.',
      '4. **Producción en formato elegido:** El estudiante responde usando su canal fuerte.',
      '',
      `## Evaluación en formato ${formato}`,
      getEvalFormato(formato, foco),
      '',
      BR,
      `*Versión con énfasis en formato ${formato} para estudiantes que se benefician de este canal.*`,
    ].join('\n'),

    colaborativo: [
      `${SH} Versión para trabajo colaborativo`,
      '',
      `**Nivel:** ${curso} | **Asignatura:** ${asignatura}`,
      `**Estructura:** Aprendizaje colaborativo con roles | **Foco:** ${focoLabel[foco]}`,
      '',
      `## OA`,
      oa,
      '',
      `## Organización de equipos`,
      '- Grupos de 3-4 estudiantes con roles rotativos.',
      '- Roles sugeridos: coordinador/a, relator/a, investigador/a, verificador/a.',
      '- Cada rol tiene una tarjeta con instrucciones específicas.',
      '',
      `## Desarrollo colaborativo`,
      '1. **Calentamiento en equipo:** Todos comparten lo que saben del tema (1 min c/u).',
      '2. **Tarea colaborativa:** Resuelven juntos un desafío alineado al OA.',
      '3. **Estructura de interdependencia:** Cada integrante tiene una parte de la información o una tarea específica.',
      '4. **Producción grupal:** Un producto común que integre el aporte de todos.',
      '5. **Presentación y retroalimentación entre pares:** Un equipo comparte, los otros dan retroalimentación con pauta.',
      '',
      `## Evaluación colaborativa`,
      '- Coevaluación: Cada integrante evalúa el aporte de sus pares.',
      '- Autoevaluación del trabajo en equipo.',
      '- Evaluación docente del producto grupal + observación de habilidades colaborativas.',
      '',
      `## Apoyos para la colaboración`,
      `- Foco en ${focoLabel[foco]}: Los roles y tareas se ajustan para fortalecer esta área.`,
      '- Tarjetas de apoyo con frases tipo: "¿Qué opinas?", "¿Podemos intentar…?", "¿Entendemos todos?"',
      '- Temporizador visible para cada fase.',
      '',
      BR,
      '*Versión colaborativa que desarrolla habilidades socioeducativas junto con el OA curricular.*',
    ].join('\n'),

    profundizacion: [
      `${SH} Versión de profundización — Estudiantes avanzados`,
      '',
      `**Nivel:** ${curso} | **Asignatura:** ${asignatura}`,
      `**Foco de profundización:** ${focoLabel[foco]} | **Formato:** ${formatoLabel[formato]}`,
      '',
      `## OA`,
      oa,
      '',
      `## Indicadores extendidos`,
      ...indicadores.slice(0, 3).map((ind, i) => `${i + 1}. ${ind} (nivel de profundización)`),
      '',
      `## Desafíos de profundización`,
      '1. **Análisis crítico:** ¿Qué pasaría si…? ¿Estás de acuerdo con…? ¿Qué evidencia contradice…?',
      '2. **Transferencia:** Aplica el OA a un contexto nuevo o problema real de la comunidad.',
      '3. **Creación:** Diseña un producto original (texto, infografía, modelo, presentación) que demuestre dominio.',
      '4. **Investigación breve:** Compara dos fuentes, identifica sesgos o evalúa argumentos.',
      '5. **Enseñanza entre pares:** Prepara una mini-lección para explicar el contenido a compañeros.',
      '',
      `## Evaluación de profundización`,
      '- Rúbrica con nivel "Destacado" que exige justificación, transferencia y metacognición.',
      '- Autoevaluación con preguntas de reflexión profunda.',
      '- Portafolio de evidencia con selección del mejor trabajo y justificación.',
      '',
      BR,
      '*Versión de profundización para estudiantes que ya lograron el OA y requieren desafío adicional.*',
    ].join('\n'),

    sugerenciasDocente: [
      `${SH} Sugerencias para el/la docente`,
      '',
      `**Contexto:** ${curso} · ${asignatura} | **OA:** ${oa}`,
      `**Apoyo:** ${nivelApoyo.toUpperCase()} | **Foco:** ${focoLabel[foco]} | **Formato:** ${formatoLabel[formato]}`,
      '',
      `## Antes de la clase`,
      `1. Prepara los materiales visuales y concretos con anticipación.`,
      `2. Organiza el espacio según el formato elegido (${formatoLabel[formato]}).`,
      `3. Identifica qué estudiantes se beneficiarán más de cada versión.`,
      `4. Fotocopia o imprime las versiones necesarias (estándar, simplificada, apoyo visual, colaborativa, profundización).`,
      '',
      `## Durante la clase`,
      `1. Explica el OA al curso completo usando la versión estándar.`,
      `2. Entrega a cada estudiante o grupo la versión que corresponde a su necesidad.`,
      `3. Circula priorizando a estudiantes con apoyo ${nivelApoyo}.`,
      `4. Usa las preguntas de andamiaje para cada nivel.`,
      `5. Toma notas breves para la retroalimentación posterior.`,
      '',
      `## Estrategias específicas para ${focoLabel[foco]}`,
      getApoyoPorFoco(foco, 'docente'),
      '',
      `## Adecuaciones de acceso`,
      tiempoExtra ? '- **Tiempo adicional:** Otorga hasta 50% más de tiempo para completar tareas.' : '',
      simple ? '- **Instrucciones simplificadas:** Versión con lenguaje claro, pasos numerados y pictogramas.' : '',
      evalAlt ? '- **Evaluación alternativa:** Ofrece opción de respuesta oral, grabación de audio, dibujo o selección múltiple en lugar de escritura extendida.' : '',
      `- **Formato ${formato}:** Asegura que los materiales estén en este formato.`,
      '',
      `## Agrupamiento sugerido`,
      apoyo === 'alto' ? '- Trabajo individual con apoyo directo del docente o asistente.'
        : apoyo === 'medio' ? '- Trabajo en pareja heterogénea con rol de tutor.'
        : '- Trabajo autónomo con supervisión esporádica.',
      '',
      `## Recursos complementarios`,
      ...getRecursosComplementarios(foco, formato),
      '',
      BR,
      '*Sugerencias basadas en principios DUA y adecuación curricular individualizada.*',
    ].join('\n'),

    criteriosLogro: [
      `${SH} Criterios de logro ajustados`,
      '',
      `**OA:** ${oa}`,
      `**Nivel de apoyo:** ${nivelApoyo.toUpperCase()} | **Foco:** ${focoLabel[foco]} | **Evaluación alternativa:** ${evalAlt ? 'Sí' : 'No'}`,
      '',
      '## Criterios generales',
      '',
      '| Nivel | Criterio | Evidencia esperada |',
      '|-------|----------|-------------------|',
      '| **Destacado** | Demuestra dominio completo del OA con justificación y transferencia | Resuelve, explica y aplica en contexto nuevo |',
      '| **Esperado** | Logra el OA con apoyo mínimo | Responde correctamente con ayuda ocasional |',
      '| **En proceso** | Logra parcialmente el OA | Responde con apoyo directo y preguntas guía |',
      '| **Por lograr** | No logra el OA sin apoyo intensivo | Requiere reenseñanza con estrategia diferente |',
      '',
      '## Criterios ajustados por foco',
      ...getCriteriosPorFoco(foco, indicadores),
      '',
      evalAlt ? '## Evaluación alternativa\nLa evaluación se realizará mediante: exposición oral, grabación de audio, producto visual o demostración práctica, según las fortalezas del estudiante.' : '',
      '',
      BR,
      '*Criterios alineados al OA ministerial y ajustados según el nivel de apoyo seleccionado.*',
    ].join('\n'),
  };
}

function simplificarOA(oa: string): string {
  if (oa.length < 60) return oa;
  return oa.replace(/,\s*(considerando|utilizando|mediante|a través de|con énfasis en).*/i, '.');
}

function versionesSimplificada(ind: string): string {
  if (ind.length < 80) return ind;
  return ind.substring(0, 77) + '…';
}

function getApoyoPorFoco(foco: string, contexto: string): string {
  const apoyos: Record<string, Record<string, string>> = {
    lectura: {
      simplificada: '- Textos breves (máximo 1 párrafo) con apoyo de imágenes.\n- Lectura en voz alta por el docente o audio.\n- Palabras clave destacadas en negrita.\n- Preguntas literales antes que inferenciales.',
      docente: '- Ofrece textos en formatos alternativos (audio, video con subtítulos).\n- Enseña estrategias de lectura: anticipación, lectura por fragmentos, relectura.\n- Usa organizadores gráficos antes de la lectura.',
    },
    escritura: {
      simplificada: '- Respuestas con apoyo de banco de palabras o completar oraciones.\n- Opción de dibujar + etiquetar en lugar de escribir.\n- Plantillas con estructura (inicio, desarrollo, cierre).\n- Menor extensión exigida (2-3 oraciones).',
      docente: '- Ofrece dictado al docente o grabación de voz como alternativa.\n- Usa rúbrica que valore contenido por sobre ortografía.\n- Proporciona modelos de respuesta.',
    },
    comprensión: {
      simplificada: '- Preguntas con apoyo visual y dos alternativas.\n- Instrucciones en lenguaje claro con pictogramas.\n- Verificación de comprensión cada 2 pasos.\n- Ejemplos resueltos antes de la práctica independiente.',
      docente: '- Usa preguntas de andamiaje: "¿Qué crees que significa?", "¿Cómo lo sabes?".\n- Enseña a identificar palabras clave en consignas.\n- Usa la técnica "Piensen en parejas, compartan".',
    },
    cálculo: {
      simplificada: '- Números pequeños y operaciones simples.\n- Material concreto (fichas, ábaco, bloques) disponible siempre.\n- Plantillas con pasos escritos y ejemplo resuelto.\n- Calculadora como apoyo cuando sea apropiado.',
      docente: '- Usa material concreto antes de lo simbólico.\n- Verbaliza el procedimiento mientras modela.\n- Ofrece práctica con apoyos visuales (recta numérica, tabla).',
    },
    atención: {
      simplificada: '- Tareas cortas y variadas (máximo 5 min por actividad).\n- Instrucciones de un solo paso.\n- Apoyo visual con checklists para marcar avance.\n- Ubicación cercana al docente.',
      docente: '- Alterna actividades de alta y baja demanda atencional.\n- Usa temporizador visible.\n- Refuerzo positivo frecuente por mantener atención.\n- Reduce estímulos visuales en el entorno.',
    },
    'lenguaje oral': {
      simplificada: '- Preguntas cerradas (sí/no, selección) antes que abiertas.\n- Tiempo de espera extendido para responder.\n- Apoyo con imágenes o palabras escritas.\n- Repetición y modelaje de respuestas.',
      docente: '- Acepta respuestas no verbales (señalar, asentir).\n- Ofrece tiempo de procesamiento.\n- Usa frases incompletas para que complete.\n- Modela la respuesta esperada.',
    },
    motricidad: {
      simplificada: '- Material adaptado: lápiz más grueso, hojas con más espacio.\n- Actividades con movimiento incorporado.\n- Opción de respuesta digital (teclado, touch).\n- Menor exigencia motriz fina.',
      docente: '- Incluye pausas activas con movimiento.\n- Ofrece alternativas para actividades motrices difíciles.\n- Evalúa contenido, no calidad motriz.',
    },
    convivencia: {
      simplificada: '- Trabajo individual o en pareja estable.\n- Roles fijos y predecibles.\n- Refuerzo positivo por conductas esperadas.\n- Apoyo visual con normas y rutinas.',
      docente: '- Enseña habilidades socioemocionales explícitamente.\n- Usa círculos de diálogo y resolución pacífica de conflictos.\n- Refuerzo positivo por cada logro social.',
    },
  };
  return apoyos[foco]?.[contexto] || '- Apoyo específico según evaluación del/la docente.\n- Ajustar según las necesidades individuales del estudiante.';
}

function getFormatoEstrategia(formato: string, foco: string): string {
  const map: Record<string, string> = {
    visual: `- **Organizadores gráficos:** Mapas conceptuales, esquemas, tablas, líneas de tiempo.\n- **Imágenes y diagramas:** Cada concepto clave acompañado de una imagen representativa.\n- **Colores:** Código de colores para categorías, pasos o niveles.\n- **Videos:** Breve video (2-3 min) que explique el contenido.\n- **Foco en ${foco}:** Los apoyos visuales se centran en reforzar esta área.`,
    oral: `- **Instrucciones orales grabadas:** El estudiante puede escuchar las indicaciones.\n- **Discusión guiada:** Preguntas orales con tiempo de espera.\n- **Grabación de respuestas:** Opción de responder en audio en lugar de escribir.\n- **Lectura en voz alta:** Textos leídos por el docente o mediante TTS.\n- **Foco en ${foco}:** Las actividades orales se alinean al OA y refuerzan esta área.`,
    manipulativo: `- **Material concreto:** Objetos, bloques, fichas, tarjetas móviles.\n- **Estaciones de aprendizaje:** Diferentes estaciones con actividades manipulativas.\n- **Movimiento:** Actividades que implican levantarse, moverse o cambiar de posición.\n- **Modelado con plastilina/arcilla:** Para representar conceptos.\n- **Foco en ${foco}:** Las experiencias táctiles y kinestésicas refuerzan esta área.`,
    digital: `- **Herramientas TIC:** Apps educativas, plataformas interactivas, simulaciones.\n- **Juegos digitales:** Actividades gamificadas con retroalimentación inmediata.\n- **Videos interactivos:** Con preguntas integradas.\n- **Producción digital:** Crear una presentación, video, infografía o documento.\n- **Foco en ${foco}:** Las herramientas digitales se seleccionan para fortalecer esta área.`,
    colaborativo: `- **Aprendizaje entre pares:** Estudiante tutor + estudiante tutorado.\n- **Trabajo en equipo con roles:** Cada integrante aporta desde su fortaleza.\n- **Discusión estructurada:** Protocolo de participación equitativa.\n- **Proyecto grupal:** Producto colectivo con evaluación individual y grupal.\n- **Foco en ${foco}:** La colaboración se organiza para que todos contribuyan al desarrollo de esta área.`,
  };
  return map[formato] || map.visual;
}

function getMaterialVisual(formato: string, foco: string, indicadores: string[]): string[] {
  const comunes = ['- Impresiones de láminas y organizadores gráficos.', '- Tarjetas de vocabulario con imagen y definición simple.'];
  switch (formato) {
    case 'visual': return [...comunes, '- Láminas de secuencias y pasos.', '- Código de colores para cada indicador.', '- Mapa conceptual impreso o digital.', '- Pictogramas para instrucciones.'];
    case 'oral': return ['- Archivos de audio o TTS para lectura de textos.', '- Auriculares para escuchar sin distracción.', '- Micrófono o grabadora para respuestas orales.', ...comunes];
    case 'manipulativo': return ['- Material concreto relacionado con el OA.', '- Tarjetas móviles para ordenar o clasificar.', '- Objetos cotidianos para ejemplificar.', '- Plastilina, bloques, fichas contables.', ...comunes];
    case 'digital': return ['- Dispositivo con acceso a app/herramienta digital.', '- Enlace a video explicativo o simulación.', '- Plantilla digital editable.', '- Quiz interactivo con retroalimentación inmediata.', ...comunes];
    case 'colaborativo': return [...comunes, '- Tarjetas de roles para cada integrante.', '- Pauta de coevaluación impresa.', '- Temporizador visible.', '- Poster o papelógrafo para producto grupal.'];
    default: return comunes;
  }
}

function getEvalFormato(formato: string, foco: string): string {
  const map: Record<string, string> = {
    visual: '- El/la estudiante crea un organizador gráfico, infografía o dibujo etiquetado.\n- Criterio: Representación correcta de conceptos y relaciones.',
    oral: '- El/la estudiante responde de forma oral o graba un audio.\n- Criterio: Claridad, precisión y uso de vocabulario específico.',
    manipulativo: '- El/la estudiante construye, ordena o demuestra con material concreto.\n- Criterio: Correcta manipulación y verbalización del proceso.',
    digital: '- El/la estudiante completa una actividad digital o crea un producto multimedia.\n- Criterio: Precisión y creatividad en el entorno digital.',
    colaborativo: '- Producción grupal con evaluación individual del aporte.\n- Criterio: Contribución al equipo + logro individual del OA.',
  };
  return map[formato] || map.visual;
}

function getRecursosComplementarios(foco: string, formato: string): string[] {
  const recursos: string[] = [];
  recursos.push('- Plataforma MINEDUC: Recursos para la inclusión educativa.');
  recursos.push('- Guías DUA del Centro de Innovación MINEDUC.');
  if (formato === 'digital') recursos.push('- Apps educativas gratuitas: Canva, Kahoot, Quizizz, Educaplay.');
  if (foco === 'lectura') recursos.push('- Biblioteca Escolar Digital MINEDUC.');
  if (foco === 'cálculo') recursos.push('- Material concreto digital: Polypad, Math Learning Center.');
  return recursos;
}

function getCriteriosPorFoco(foco: string, indicadores: string[]): string[] {
  const base = indicadores.slice(0, 3);
  const map: Record<string, string> = {
    lectura: '- Lee textos breves con apoyo visual y responde preguntas literales.',
    escritura: '- Escribe oraciones completas usando banco de palabras.',
    comprensión: '- Explica con sus palabras el contenido trabajado.',
    cálculo: '- Resuelve operaciones básicas con apoyo concreto.',
    atención: '- Completa tareas de 5 minutos con apoyo visual y checklist.',
    'lenguaje oral': '- Se expresa oralmente con frases completas y vocabulario adecuado.',
    motricidad: '- Realiza actividades motrices finas/gruesas con apoyo adaptado.',
    convivencia: '- Sigue normas y rutinas con apoyo visual y refuerzo positivo.',
  };
  return base.map((ind) => `- ${ind}`).concat([map[foco] || '- Logra el OA con apoyo específico.']);
}

export async function generarAdaptacionConIA(
  item: CurriculumItem,
  config: AdaptacionConfig,
  contenidoOriginal: string,
): Promise<{ ok: boolean; resultado?: AdaptacionResult; error?: string }> {
  const focoLabel: Record<string, string> = {
    lectura: 'Lectura', escritura: 'Escritura', comprensión: 'Comprensión',
    cálculo: 'Cálculo', atención: 'Atención', 'lenguaje oral': 'Lenguaje oral',
    motricidad: 'Motricidad', convivencia: 'Convivencia',
  };
  const formatoLabel: Record<string, string> = {
    visual: 'Visual', oral: 'Oral', manipulativo: 'Manipulativo',
    digital: 'Digital', colaborativo: 'Colaborativo',
  };
  const nivelLabel: Record<string, string> = { bajo: 'leve', medio: 'moderado', alto: 'intensivo' };

  const prompt = [
    `Eres un/una docente experto/a en DUA y adecuación curricular del sistema educativo chileno.`,
    `A partir del siguiente objetivo curricular, genera 7 versiones de adaptación pedagógica.`,
    '',
    `## Datos curriculares`,
    `Nivel: ${item.curso}`,
    `Asignatura: ${item.asignatura}`,
    `Eje: ${item.eje}`,
    `OA: ${item.oa}`,
    `Habilidad: ${item.habilidad}`,
    `Indicadores:`,
    ...item.indicadores.map(i => `- ${i}`),
    '',
    `## Configuración de adaptación`,
    `Nivel de apoyo: ${nivelLabel[config.nivelApoyo]} (${config.nivelApoyo})`,
    `Foco de apoyo: ${focoLabel[config.focoApoyo]}`,
    `Formato: ${formatoLabel[config.formato]}`,
    `Tiempo adicional: ${config.tiempoAdicional ? 'Sí' : 'No'}`,
    `Simplificación de instrucciones: ${config.simplificacion ? 'Sí' : 'No'}`,
    `Evaluación alternativa: ${config.evalAlternativa ? 'Sí' : 'No'}`,
    '',
    `## Contenido original`,
    contenidoOriginal || 'No disponible.',
    '',
    `## Instrucciones de generación`,
    `Genera las siguientes 7 secciones, cada una precedida por "### [nombre]" como encabezado Markdown nivel 3:`,
    '',
    `### Versión estándar`,
    `Versión base alineada al OA, sin adaptaciones.`,
    '',
    `### Versión simplificada`,
    `Lenguaje más simple, instrucciones paso a paso, vocabulario reducido, apoyos visuales indicados.`,
    '',
    `### Versión con apoyo visual`,
    `Actividades que usan imágenes, diagramas, organizadores gráficos, colores. Formato: ${formatoLabel[config.formato]}.`,
    '',
    `### Versión para trabajo colaborativo`,
    `Actividad estructurada con roles, trabajo en equipo, interdependencia positiva.`,
    '',
    `### Versión de profundización`,
    `Desafío para estudiantes avanzados: análisis crítico, transferencia, creación.`,
    '',
    `### Sugerencias para el docente`,
    `Recomendaciones concretas para implementar cada versión: agrupamiento, materiales, tiempo, estrategias.`,
    '',
    `### Criterios de logro ajustados`,
    `Tabla con 4 niveles (Destacado, Esperado, En Proceso, Por Lograr) ajustados al foco y nivel de apoyo.`,
    '',
    `Formato: Markdown. Usa **negritas** para énfasis. Mantén las 7 secciones claramente separadas.`,
    `Asegura que todas las versiones estén alineadas al OA original. No generes contenido desconectado del currículum.`,
  ].join('\n');

  try {
    const result = await generarConIA({
      tipo: 'recurso',
      nivel: item.curso,
      asignatura: item.asignatura,
      oa: item.oa,
      promptExt: prompt,
    });

    if (result.ok && result.texto) {
      const parsed = parseAdaptacionResult(result.texto, item, config);
      return { ok: true, resultado: parsed };
    }
    return { ok: false, error: 'No se pudo generar con IA.' };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error desconocido' };
  }
}

function parseAdaptacionResult(texto: string, item: CurriculumItem, config: AdaptacionConfig): AdaptacionResult {
  const local = generarAdaptacionLocal(item, config, '');
  const sections = texto.split(/###\s+/);
  const getSec = (name: string): string => {
    const sec = sections.find(s => s.toLowerCase().startsWith(name.toLowerCase()));
    if (sec) {
      return '## ' + sec.trim();
    }
    return (local as any)[name.toLowerCase().replace(/\s+/g, '')] || `## ${name}\n\n*No generado.*`;
  };
  return {
    estandar: getSec('Versión estándar'),
    simplificada: getSec('Versión simplificada'),
    apoyoVisual: getSec('Versión con apoyo visual'),
    colaborativo: getSec('Versión para trabajo colaborativo'),
    profundizacion: getSec('Versión de profundización'),
    sugerenciasDocente: getSec('Sugerencias para el docente'),
    criteriosLogro: getSec('Criterios de logro ajustados'),
  };
}
