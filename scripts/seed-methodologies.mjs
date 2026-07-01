#!/usr/bin/env node
/**
 * Seed methodologies into D1.
 * Idempotent: safe to run multiple times without duplicating data.
 *
 * Usage:
 *   node scripts/seed-methodologies.mjs          (local D1)
 *   node scripts/seed-methodologies.mjs --remote  (remote D1)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const isRemote = process.argv.includes('--remote');
const wranglerCmd = isRemote ? 'wrangler' : 'wrangler';
const dbFlag = isRemote ? 'remote' : 'local';

console.log(`\n🌱 Seeding methodologies to D1 (${isRemote ? 'REMOTE' : 'LOCAL'})...\n`);

// Read wrangler.toml to get database name
const wranglerToml = fs.readFileSync(path.join(process.cwd(), 'wrangler.toml'), 'utf-8');
const dbNameMatch = wranglerToml.match(/database_name\s*=\s*"([^"]+)"/);
const dbName = dbNameMatch ? dbNameMatch[1] : 'planificaia-db';

const methodologies = [
  {
    id: 'method-abp',
    name: 'Aprendizaje Basado en Proyectos',
    short_name: 'ABP',
    description: 'Los estudiantes investigan y crean un producto final en respuesta a una pregunta compleja o problema real, desarrollando competencias transversales.',
    when_to_use: 'Ideal para integrar múltiples OA, fomentar trabajo colaborativo y conectar el aprendizaje con la realidad chilena.',
    steps: [
      'Plantear pregunta desafiante vinculada al OA',
      'Formar equipos de 3-4 estudiantes',
      'Investigar y recopilar información',
      'Planificar y diseñar el producto',
      'Crear prototipo y recibir feedback',
      'Presentar producto final',
      'Reflexión metacognitiva'
    ],
    advantages: ['Desarrolla autonomía', 'Conecta con realidad local', 'Integra múltiples asignaturas', 'Fomenta colaboración'],
    risks: ['Requiere más tiempo', 'Puede ser caótico sin estructura', 'Difícil de evaluar individualmente'],
    dua_accommodations: ['Roles diferenciados por habilidad', 'Múltiples formatos de producto', 'Andamiaje visual con rúbricas', 'Tiempo flexible'],
    suggested_evaluations: ['Rúbrica de producto', 'Autoevaluación grupal', 'Evaluación de proceso', 'Presentación oral'],
    classroom_examples: [
      'Crear una guía turística de la región (Historia/Geografía)',
      'Diseñar huerto escolar sustentable (Ciencias)',
      'Producir podcast sobre patrimonio local (Lenguaje)'
    ],
    source_type: 'seed_pedagogico',
    source_url: 'https://www.curriculumnacional.cl'
  },
  {
    id: 'method-abpr',
    name: 'Aprendizaje Basado en Problemas',
    short_name: 'ABPr',
    description: 'Los estudiantes resuelven un problema abierto y significativo, construyendo conocimiento a través del análisis y la discusión.',
    when_to_use: 'Cuando se busca desarrollar pensamiento crítico, resolución de problemas y aplicación de conceptos en contextos reales.',
    steps: [
      'Presentar problema contextualizado',
      'Identificar lo que saben y necesitan saber',
      'Investigar y analizar información',
      'Proponer soluciones',
      'Evaluar alternativas',
      'Implementar y comunicar solución',
      'Reflexionar sobre el proceso'
    ],
    advantages: ['Desarrolla pensamiento crítico', 'Altamente motivador', 'Conecta teoría y práctica'],
    risks: ['Puede frustrar si el problema es muy difícil', 'Requiere guía constante del docente'],
    dua_accommodations: ['Problema con múltiples niveles de complejidad', 'Apoyos visuales', 'Trabajo en parejas', 'Tiempo extendido'],
    suggested_evaluations: ['Rúbrica de resolución', 'Diario de aprendizaje', 'Evaluación entre pares'],
    classroom_examples: [
      'Resolver problema de contaminación del río local (Ciencias)',
      'Diseñar presupuesto familiar (Matemática)',
      'Analizar conflicto histórico y proponer solución (Historia)'
    ],
    source_type: 'seed_pedagogico',
    source_url: 'https://www.curriculumnacional.cl'
  },
  {
    id: 'method-coop',
    name: 'Aprendizaje Cooperativo',
    short_name: 'Cooperativo',
    description: 'Estructura de trabajo grupal donde cada miembro tiene un rol específico y todos son responsables del aprendizaje del equipo.',
    when_to_use: 'Para fomentar habilidades sociales, inclusión y aprendizaje entre pares. Especialmente útil en cursos heterogéneos.',
    steps: [
      'Formar grupos heterogéneos de 4',
      'Asignar roles (líder, relator, secretario, controlador de tiempo)',
      'Presentar tarea con interdependencia positiva',
      'Monitorear y mediar',
      'Evaluar producto y proceso grupal',
      'Reflexión sobre trabajo en equipo'
    ],
    advantages: ['Incluye a todos', 'Desarrolla habilidades sociales', 'Aprendizaje entre pares'],
    risks: ['Algunos pueden depender de otros', 'Requiere enseñanza explícita de roles'],
    dua_accommodations: ['Roles adaptados a capacidades', 'Materiales multisensoriales', 'Rúbricas con criterios claros', 'Apoyo de monitor'],
    suggested_evaluations: ['Evaluación grupal e individual', 'Rúbrica de colaboración', 'Autoevaluación de rol'],
    classroom_examples: [
      'Rompecabezas de contenido (jigsaw) con OA de Historia',
      'Torneo de equipos en Matemática',
      'Investigación grupal con roles definidos en Ciencias'
    ],
    source_type: 'seed_pedagogico',
    source_url: 'https://www.curriculumnacional.cl'
  },
  {
    id: 'method-flipped',
    name: 'Aula Invertida',
    short_name: 'Flipped',
    description: 'Los estudiantes acceden al contenido teórico en casa (video, lectura) y el tiempo de clase se usa para práctica, discusión y resolución de dudas.',
    when_to_use: 'Cuando se necesita maximizar el tiempo de práctica en clase y los estudiantes tienen acceso a tecnología en casa.',
    steps: [
      'Crear o seleccionar material para estudiar en casa',
      'Enviar con guía de preguntas',
      'Verificar comprensión al inicio de clase',
      'Dedicar clase a práctica guiada y colaborativa',
      'Resolver dudas individualmente',
      'Cierre con síntesis'
    ],
    advantages: ['Más tiempo de práctica en clase', 'Ritmo individual para teoría', 'Docente como facilitador'],
    risks: ['Requiere acceso tecnológico en casa', 'Estudiantes pueden no prepararse'],
    dua_accommodations: ['Material en múltiples formatos', 'Subtítulos en videos', 'Guías impresas alternativas', 'Tiempo en clase para quienes no pudieron ver en casa'],
    suggested_evaluations: ['Quiz de preparación', 'Evaluación de práctica en clase', 'Portafolio'],
    classroom_examples: [
      'Ver video sobre fotosíntesis en casa, experimento en clase (Ciencias)',
      'Leer texto narrativo en casa, análisis literario en clase (Lenguaje)',
      'Ver tutorial de procedimiento en casa, ejercicios en clase (Matemática)'
    ],
    source_type: 'seed_pedagogico',
    source_url: 'https://www.curriculumnacional.cl'
  },
  {
    id: 'method-gamification',
    name: 'Gamificación',
    short_name: 'Gamificación',
    description: 'Uso de elementos de juego (puntos, niveles, desafíos, insignias) para motivar y comprometer a los estudiantes en el aprendizaje.',
    when_to_use: 'Para aumentar motivación, especialmente en contenidos que los estudiantes perciben como difíciles o aburridos.',
    steps: [
      'Definir objetivos de aprendizaje como misiones',
      'Crear sistema de puntos o insignias',
      'Diseñar niveles de dificultad progresiva',
      'Implementar desafíos y recompensas',
      'Monitorear progreso con tablero visible',
      'Celebrar logros y reflexionar'
    ],
    advantages: ['Alta motivación', 'Feedback inmediato', 'Progreso visible'],
    risks: ['Puede centrarse en puntos más que en aprendizaje', 'Competencia excesiva'],
    dua_accommodations: ['Múltiples caminos al éxito', 'Desafíos adaptados', 'Cooperación además de competencia', 'Recompensas no solo académicas'],
    suggested_evaluations: ['Rúbrica de logros', 'Autoevaluación de progreso', 'Evaluación de competencias'],
    classroom_examples: [
      'Escape room matemático con operaciones (Matemática)',
      'Misión de exploración de ecosistemas (Ciencias)',
      'Torneo de ortografía con insignias (Lenguaje)'
    ],
    source_type: 'seed_pedagogico',
    source_url: 'https://www.curriculumnacional.cl'
  },
  {
    id: 'method-dua',
    name: 'Diseño Universal para el Aprendizaje',
    short_name: 'DUA',
    description: 'Marco pedagógico que busca eliminar barreras al aprendizaje ofreciendo múltiples formas de representación, acción/expresión y motivación/compromiso.',
    when_to_use: 'Siempre. El DUA no es solo para estudiantes con NEE, es un marco de diseño inclusivo para toda la clase.',
    steps: [
      'Identificar barreras potenciales en la planificación',
      'Ofrecer múltiples formas de presentar contenido',
      'Ofrecer múltiples formas de acción y expresión',
      'Ofrecer múltiples formas de engagement',
      'Diseñar evaluaciones flexibles',
      'Reflexionar y ajustar'
    ],
    advantages: ['Incluye a todos', 'Reduce necesidad de adaptaciones individuales', 'Mejora aprendizaje general'],
    risks: ['Requiere planificación cuidadosa', 'Puede parecer abrumador al inicio'],
    dua_accommodations: ['Es el marco de acomodaciones mismo', 'Textos con audio', 'Opciones de respuesta variadas', 'Andamiaje gradual'],
    suggested_evaluations: ['Evaluación con múltiples formatos', 'Rúbricas con criterios flexibles', 'Autoevaluación'],
    classroom_examples: [
      'Texto con audio + visual + manipulativo (Lenguaje)',
      'Evaluación oral, escrita o práctica según preferencia (todas las asignaturas)',
      'Andamiaje con organizadores gráficos (todas las asignaturas)'
    ],
    source_type: 'seed_pedagogico',
    source_url: 'https://www.curriculumnacional.cl'
  },
  {
    id: 'method-inquiry',
    name: 'Aprendizaje por Indagación',
    short_name: 'Indagación',
    description: 'Los estudiantes construyen conocimiento a través de la observación, formulación de preguntas, investigación y conclusiones basadas en evidencia.',
    when_to_use: 'Ideal para Ciencias Naturales, pero aplicable a todas las asignaturas. Fomenta curiosidad y pensamiento científico.',
    steps: [
      'Observar fenómeno o situación',
      'Formular preguntas investigables',
      'Plantear hipótesis',
      'Diseñar y realizar investigación',
      'Recopilar y analizar datos',
      'Sacar conclusiones',
      'Comunicar resultados'
    ],
    advantages: ['Desarrolla pensamiento científico', 'Alto engagement', 'Aprendizaje profundo'],
    risks: ['Requiere tiempo', 'Puede ser difícil de guiar', 'Necesita materiales'],
    dua_accommodations: ['Preguntas con distintos niveles de complejidad', 'Apoyos visuales para proceso', 'Trabajo en equipos mixtos', 'Múltiples formas de comunicar'],
    suggested_evaluations: ['Informe de indagación', 'Rúbrica de proceso científico', 'Presentación de resultados'],
    classroom_examples: [
      'Investigar por qué algunas plantas crecen más que otras (Ciencias)',
      'Indagar sobre patrones numéricos en la naturaleza (Matemática)',
      'Investigar fuentes históricas sobre un evento (Historia)'
    ],
    source_type: 'seed_pedagogico',
    source_url: 'https://www.curriculumnacional.cl'
  },
  {
    id: 'method-stations',
    name: 'Estaciones de Aprendizaje',
    short_name: 'Estaciones',
    description: 'La clase se organiza en estaciones o centros de trabajo donde los estudiantes rotan realizando actividades diferentes pero complementarias.',
    when_to_use: 'Para atender diversidad de estilos de aprendizaje, trabajar contenidos múltiples simultáneamente y mantener engagement.',
    steps: [
      'Diseñar 4-6 estaciones con actividades variadas',
      'Preparar materiales en cada estación',
      'Explicar rotación y tiempos',
      'Estudiantes rotan cada 10-15 minutos',
      'Docente circula y apoya',
      'Cierre con síntesis grupal'
    ],
    advantages: ['Atiende diversidad', 'Movimiento físico', 'Múltiples actividades'],
    risks: ['Requiere mucha preparación', 'Gestión de tiempo compleja', 'Ruido'],
    dua_accommodations: ['Estaciones con distintos niveles', 'Apoyos visuales en cada estación', 'Tiempo flexible', 'Estación de apoyo docente'],
    suggested_evaluations: ['Checklist por estación', 'Producto de cada estación', 'Autoevaluación de recorrido'],
    classroom_examples: [
      'Estaciones de lectoescritura: lectura, escritura, juego fonológico (Lenguaje)',
      'Estaciones matemáticas: cálculo, geometría, resolución de problemas (Matemática)',
      'Estaciones de ciencias: observación, experimento, registro (Ciencias)'
    ],
    source_type: 'seed_pedagogico',
    source_url: 'https://www.curriculumnacional.cl'
  },
  {
    id: 'method-modeling',
    name: 'Modelado Gradual',
    short_name: 'Modelado',
    description: 'Secuencia didáctica "Yo hago, nosotros hacemos, ellos hacen" donde el docente modela, luego practica con los estudiantes y finalmente ellos aplican de forma autónoma.',
    when_to_use: 'Para enseñar procedimientos, habilidades o conceptos nuevos que requieren demostración explícita.',
    steps: [
      'Yo hago: docente modela pensando en voz alta',
      'Nosotros hacemos: práctica guiada con apoyo',
      'Ellos hacen juntos: práctica colaborativa',
      'Ellos hacen solos: práctica independiente',
      'Feedback y corrección',
      'Aplicación en nuevo contexto'
    ],
    advantages: ['Estructura clara', 'Andamiaje progresivo', 'Reduce ansiedad'],
    risks: ['Puede ser demasiado directivo', 'Menos espacio para descubrimiento'],
    dua_accommodations: ['Modelado con apoyos visuales', 'Pensamiento en voz alta explícito', 'Práctica con pares', 'Tiempo adicional'],
    suggested_evaluations: ['Observación de práctica', 'Checklist de logro', 'Evaluación de transferencia'],
    classroom_examples: [
      'Modelar resolución de problema matemático paso a paso (Matemática)',
      'Modelar escritura de párrafo con estructura clara (Lenguaje)',
      'Modelar uso de instrumento de medición (Ciencias)'
    ],
    source_type: 'seed_pedagogico',
    source_url: 'https://www.curriculumnacional.cl'
  },
  {
    id: 'method-service',
    name: 'Aprendizaje Servicio',
    short_name: 'A-S',
    description: 'Combina aprendizaje curricular con servicio a la comunidad, donde los estudiantes aplican conocimientos para resolver necesidades reales de su entorno.',
    when_to_use: 'Para conectar el aprendizaje con la comunidad, desarrollar ciudadanía y responsabilidad social.',
    steps: [
      'Identificar necesidad comunitaria',
      'Vincular con OA curriculares',
      'Planificar acción de servicio',
      'Implementar servicio',
      'Reflexionar sobre experiencia',
      'Evaluar aprendizaje y impacto',
      'Celebrar y compartir'
    ],
    advantages: ['Aprendizaje significativo', 'Desarrollo ciudadano', 'Vinculación comunidad'],
    risks: ['Requiere coordinación externa', 'Logística compleja', 'Tiempo'],
    dua_accommodations: ['Roles diversos según capacidad', 'Múltiples formas de participar', 'Apoyo de adultos', 'Flexibilidad en tareas'],
    suggested_evaluations: ['Portafolio de servicio', 'Reflexión escrita/oral', 'Evaluación de impacto', 'Rúbrica de competencias ciudadanas'],
    classroom_examples: [
      'Campaña de reciclaje escolar (Ciencias/Ciudadanía)',
      'Tutoría de lectura a estudiantes menores (Lenguaje)',
      'Encuesta comunitaria y análisis de datos (Matemática/Historia)'
    ],
    source_type: 'seed_pedagogico',
    source_url: 'https://www.curriculumnacional.cl'
  },
  {
    id: 'method-visible-thinking',
    name: 'Pensamiento Visible',
    short_name: 'PV',
    description: 'Rutinas de pensamiento que hacen visible el proceso cognitivo de los estudiantes, promoviendo comprensión profunda y metacognición.',
    when_to_use: 'Para desarrollar comprensión profunda, hacer visible el pensamiento y fomentar la reflexión metacognitiva.',
    steps: [
      'Seleccionar rutina de pensamiento adecuada',
      'Presentar estímulo (imagen, texto, objeto)',
      'Aplicar rutina individualmente',
      'Compartir en parejas o grupos',
      'Discusión plenaria',
      'Reflexión sobre el pensamiento'
    ],
    advantages: ['Hace visible el pensamiento', 'Desarrolla metacognición', 'Fácil de implementar'],
    risks: ['Requiere práctica para usar bien', 'Puede ser superficial sin seguimiento'],
    dua_accommodations: ['Rutinas con apoyos visuales', 'Opciones de respuesta variadas', 'Tiempo para pensar', 'Andamiaje con preguntas guía'],
    suggested_evaluations: ['Registro de rutinas', 'Portafolio de pensamiento', 'Autoevaluación metacognitiva'],
    classroom_examples: [
      'Veo-Pienso-Me pregunto con imagen histórica (Historia)',
      'Antes pensaba... Ahora pienso... después de experimento (Ciencias)',
      'Círculo de perspectiva con personaje literario (Lenguaje)'
    ],
    source_type: 'seed_pedagogico',
    source_url: 'https://www.curriculumnacional.cl'
  },
  {
    id: 'method-steam',
    name: 'STEAM',
    short_name: 'STEAM',
    description: 'Integración de Ciencia, Tecnología, Ingeniería, Arte y Matemática en proyectos interdisciplinarios que resuelven problemas reales.',
    when_to_use: 'Para integrar múltiples asignaturas, fomentar creatividad y resolver problemas complejos con enfoque interdisciplinario.',
    steps: [
      'Plantear desafío real que integre áreas STEAM',
      'Investigar desde múltiples disciplinas',
      'Diseñar solución creativa',
      'Prototipar y probar',
      'Iterar basado en feedback',
      'Presentar solución',
      'Reflexión interdisciplinaria'
    ],
    advantages: ['Integración curricular', 'Creatividad', 'Resolución de problemas reales'],
    risks: ['Complejo de planificar', 'Requiere colaboración docente', 'Recursos'],
    dua_accommodations: ['Múltiples roles en equipo', 'Herramientas accesibles', 'Proceso con andamiaje', 'Celebración de diversidad de soluciones'],
    suggested_evaluations: ['Rúbrica interdisciplinaria', 'Portafolio de diseño', 'Presentación de prototipo'],
    classroom_examples: [
      'Diseñar puente con materiales reciclados (Ciencias+Matemática+Arte)',
      'Crear app educativa simple (Tecnología+Lenguaje+Arte)',
      'Construir instrumento musical (Ciencias+Matemática+Arte)'
    ],
    source_type: 'seed_pedagogico',
    source_url: 'https://www.curriculumnacional.cl'
  },
  {
    id: 'method-guided_reading',
    name: 'Lectura Guiada',
    short_name: 'Lectura Guiada',
    description: 'El docente trabaja con grupos pequeños de estudiantes en textos apropiados a su nivel, enseñando estrategias de comprensión lectora de forma explícita.',
    when_to_use: 'Para desarrollar comprensión lectora, especialmente en niveles iniciales o con estudiantes que necesitan apoyo.',
    steps: [
      'Seleccionar texto nivel apropiado',
      'Formar grupos por nivel lector',
      'Introducir texto y activar conocimientos previos',
      'Lectura compartida con pausas estratégicas',
      'Enseñar estrategia de comprensión explícita',
      'Práctica guiada de estrategia',
      'Discusión y reflexión'
    ],
    advantages: ['Atención personalizada', 'Estrategias explícitas', 'Progreso visible'],
    risks: ['Requiere grupos pequeños', 'Necesita textos variados', 'Logística'],
    dua_accommodations: ['Textos con apoyos visuales', 'Audio simultáneo', 'Andamiaje con preguntas guía', 'Tiempo flexible'],
    suggested_evaluations: ['Registro anecdótico', 'Evaluación de estrategia', 'Progreso lector'],
    classroom_examples: [
      'Grupo con texto narrativo, enseñanza de inferencia (Lenguaje)',
      'Grupo con texto informativo, enseñanza de ideas principales (todas las asignaturas)',
      'Grupo con poema, enseñanza de lenguaje figurado (Lenguaje)'
    ],
    source_type: 'seed_pedagogico',
    source_url: 'https://www.curriculumnacional.cl'
  },
  {
    id: 'method-formative',
    name: 'Evaluación Formativa',
    short_name: 'Eval Formativa',
    description: 'Prácticas de evaluación continua que informan la enseñanza y el aprendizaje, proporcionando feedback oportuno para mejorar.',
    when_to_use: 'En todas las clases. La evaluación formativa no es un momento, es un proceso continuo de retroalimentación.',
    steps: [
      'Compartir criterios de éxito claros',
      'Recopilar evidencia de aprendizaje',
      'Proporcionar feedback específico y oportuno',
      'Ajustar enseñanza según evidencia',
      'Involucrar estudiantes en autoevaluación',
      'Cerrar brechas con actividades de refuerzo'
    ],
    advantages: ['Mejora aprendizaje inmediato', 'Feedback oportuno', 'Estudiantes activos en su aprendizaje'],
    risks: ['Requiere cambio de mentalidad', 'Tiempo para feedback', 'Puede ser abrumador'],
    dua_accommodations: ['Múltiples formas de demostrar aprendizaje', 'Feedback en formatos variados', 'Rúbricas accesibles', 'Autoevaluación guiada'],
    suggested_evaluations: ['Exit tickets', 'Preguntas de verificación', 'Rúbricas con criterios claros', 'Portafolio'],
    classroom_examples: [
      'Exit ticket con pregunta de comprensión (todas las asignaturas)',
      'Semáforo de comprensión (todas las asignaturas)',
      'Dos estrellas y un deseo para feedback entre pares (todas las asignaturas)'
    ],
    source_type: 'seed_pedagogico',
    source_url: 'https://www.curriculumnacional.cl'
  },
  {
    id: 'method-explicit',
    name: 'Clase Explícita Gradual',
    short_name: 'Yo-Nosotros-Ellos',
    description: 'Modelo de enseñanza explícita con tres fases: "Yo hago" (modelado docente), "Hacemos" (práctica guiada), "Hacen" (práctica independiente).',
    when_to_use: 'Para enseñar contenidos nuevos, procedimientos o habilidades que requieren demostración clara y práctica progresiva.',
    steps: [
      'YO HAGO: Docente modela pensando en voz alta',
      'NOSOTROS HACEMOS: Práctica guiada con preguntas',
      'ELLOS HACEN JUNTOS: Práctica en parejas',
      'ELLOS HACEN SOLOS: Práctica independiente',
      'FEEDBACK: Corrección y reforzamiento',
      'TRANSFERENCIA: Aplicación en nuevo contexto'
    ],
    advantages: ['Estructura clara y predecible', 'Andamiaje progresivo', 'Alto éxito estudiantil'],
    risks: ['Puede ser rígido', 'Menos espacio para exploración libre'],
    dua_accommodations: ['Modelado con múltiples representaciones', 'Andamiaje visual', 'Práctica con apoyo', 'Tiempo adicional'],
    suggested_evaluations: ['Checklist de logro por fase', 'Evaluación de transferencia', 'Observación directa'],
    classroom_examples: [
      'Yo resuelvo ecuación, resolvemos juntos, resuelven solos (Matemática)',
      'Yo escribo párrafo modelo, escribimos juntos, escriben solos (Lenguaje)',
      'Yo uso microscopio, usamos juntos, usan solos (Ciencias)'
    ],
    source_type: 'seed_pedagogico',
    source_url: 'https://www.curriculumnacional.cl'
  }
];

function buildInsert(m) {
  return `INSERT OR IGNORE INTO methodologies (
    id, name, short_name, description, when_to_use,
    steps_json, advantages_json, risks_json, dua_accommodations_json,
    suggested_evaluations_json, classroom_examples_json,
    source_type, source_url
  ) VALUES (
    '${m.id}',
    '${m.name.replace(/'/g, "''")}',
    '${(m.short_name || '').replace(/'/g, "''")}',
    '${m.description.replace(/'/g, "''")}',
    '${(m.when_to_use || '').replace(/'/g, "''")}',
    '${JSON.stringify(m.steps).replace(/'/g, "''")}',
    '${JSON.stringify(m.advantages).replace(/'/g, "''")}',
    '${JSON.stringify(m.risks).replace(/'/g, "''")}',
    '${JSON.stringify(m.dua_accommodations).replace(/'/g, "''")}',
    '${JSON.stringify(m.suggested_evaluations).replace(/'/g, "''")}',
    '${JSON.stringify(m.classroom_examples).replace(/'/g, "''")}',
    '${m.source_type}',
    '${(m.source_url || '').replace(/'/g, "''")}'
  );`;
}

const sql = methodologies.map(buildInsert).join('\n');

const tmpFile = path.join(process.cwd(), '.wrangler', 'tmp-seed-methodologies.sql');
fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
fs.writeFileSync(tmpFile, sql);

console.log(`📝 Generated ${methodologies.length} methodology inserts`);

try {
  const cmd = `${wranglerCmd} d1 execute ${dbName} --${dbFlag} --file="${tmpFile}"`;
  console.log(`\n⚡ Running: ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
  console.log(`\n✅ Successfully seeded ${methodologies.length} methodologies\n`);
} catch (err) {
  console.error('\n❌ Error seeding methodologies:', err.message);
  process.exit(1);
} finally {
  try { fs.unlinkSync(tmpFile); } catch {}
}
