/**
 * generate-curriculum-sql.ts
 *
 * Genera migrations/0003_curriculum_masivo.sql con INSERT OR IGNORE
 * para niveles, asignaturas, unidades y objetivos_aprendizaje
 * desde 1° Básico hasta 4° Medio.
 *
 * Ejecución: npx tsx scripts/generate-curriculum-sql.ts
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface OA {
  codigo: string;
  descripcion: string;
  habilidades: string[];
}

interface Unidad {
  numero: number;
  titulo: string;
  oa: OA[];
}

interface TextoEscolar {
  titulo: string;
  url?: string;
  actividades?: string[];
  planificacion_detalle?: string;
}

interface Asignatura {
  nombre: string;
  unidades: Unidad[];
  textos?: (string | TextoEscolar)[];
}

interface Nivel {
  nombre: string;
  asignaturas: Asignatura[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/°/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sqlStr(s: string): string {
  return s.replace(/'/g, "''");
}

function nivelId(nombre: string): string {
  return slugify(nombre);
}

function asignaturaId(nombreAsignatura: string, nombreNivel: string): string {
  return `${slugify(nombreAsignatura)}-${slugify(nombreNivel)}`;
}

function unidadId(nombreAsignatura: string, nombreNivel: string, numero: number): string {
  return `${slugify(nombreAsignatura)}-${slugify(nombreNivel)}-u${numero}`;
}

function oaId(nombreAsignatura: string, nombreNivel: string, unidadNum: number, oaIndex: number): string {
  return `${slugify(nombreAsignatura)}-${slugify(nombreNivel)}-oa${unidadNum}-${oaIndex + 1}`;
}

function textoId(titulo: string, nombreNivel: string): string {
  return `${slugify(titulo)}-${slugify(nombreNivel)}`;
}

function isTextoCompleto(t: string | TextoEscolar): t is TextoEscolar {
  return typeof t === 'object' && t !== null && 'titulo' in t;
}

// ---------------------------------------------------------------------------
// Datos curriculares (1° Básico → 4° Medio)
// ---------------------------------------------------------------------------

const CURRICULUM: Nivel[] = [
  // ========================================================================
  // PREKÍNDER — Educación Parvularia
  // ========================================================================
  {
    nombre: 'Prekínder',
    asignaturas: [
      {
        nombre: 'Educación Parvularia',
        unidades: [
          {
            numero: 1,
            titulo: 'Pensamiento Matemático',
            oa: [
              { codigo: 'OA 1', descripcion: 'Explorar y reconocer figuras geométricas en el entorno.', habilidades: ['figuras', 'geometría', 'exploración', 'reconocimiento'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Juego Primero: Fichas de Experiencias Pedagógicas (Primer Nivel de Transición)',
            url: 'https://catalogotextos.mineduc.cl/catalogo-textos/privado/descargar/3259',
            actividades: [
              'Ficha 1 (Pág. 25): Exploración de figuras para trabajar nociones temporales como primero y después.',
              'Ficha 2 (Pág. 28): Juego "Veo Veo" sacando figuras de una bolsa para describir atributos como vértices y caras.',
              'Ficha 4 (Pág. 34): "El gato de las figuras geométricas" en tableros para afianzar conceptos de ubicación espacial.',
              'Ficha 14 (Pág. 64): "El cartero", resolución de problemas de distribución y conteo usando un buzón.',
              'Ficha 20 (Pág. 82): "¿Dónde hay más?" usando cuantificadores para comparar colecciones de botones.',
            ],
          },
        ],
      },
      {
        nombre: 'Identidad y Autonomía',
        unidades: [
          {
            numero: 1,
            titulo: 'Autoconocimiento y autogestión',
            oa: [
              { codigo: 'OA 1', descripcion: 'Comunicar a otras personas desafíos alcanzados, identificando acciones que aportaron a su logro y definiendo nuevas metas.', habilidades: ['comunicación', 'autoconocimiento', 'metas', 'logros'] },
              { codigo: 'OA 2', descripcion: 'Comunicar sus preferencias, opiniones, ideas, en diversas situaciones cotidianas y juegos.', habilidades: ['comunicación', 'preferencias', 'opiniones', 'participación'] },
              { codigo: 'OA 3', descripcion: 'Planificar proyectos y juegos, en función de sus ideas e intereses, proponiendo actividades, organizando los recursos, incorporando los ajustes necesarios e iniciándose en la apreciación de sus resultados.', habilidades: ['planificación', 'proyectos', 'organización', 'apreciación'] },
            ],
          },
        ],
      },
      {
        nombre: 'Convivencia y Ciudadanía',
        unidades: [
          {
            numero: 1,
            titulo: 'Normas y colaboración',
            oa: [
              { codigo: 'OA 1', descripcion: 'Respetar normas y acuerdos creados colaborativamente con pares y adultos, para el bienestar del grupo.', habilidades: ['respeto', 'normas', 'acuerdos', 'colaboración'] },
              { codigo: 'OA 2', descripcion: 'Participar en actividades o juegos colaborativos, planificando, acordando estrategias para un propósito en común y asumiendo progresivamente responsabilidad en ellos.', habilidades: ['participación', 'estrategias', 'propósito común', 'responsabilidad'] },
              { codigo: 'OA 3', descripcion: 'Comprender que algunas de sus acciones y decisiones con respecto al desarrollo de juegos y proyectos colectivos, influyen en sus pares.', habilidades: ['comprensión', 'acciones', 'decisiones', 'influencia'] },
            ],
          },
        ],
      },
      {
        nombre: 'Corporalidad y Movimiento',
        unidades: [
          {
            numero: 1,
            titulo: 'Habilidades motrices',
            oa: [
              { codigo: 'OA 1', descripcion: 'Resolver desafíos prácticos manteniendo control, equilibrio y coordinación al coordinar diversos movimientos, posturas y desplazamientos tales como: lanzar y recibir, desplazarse en planos inclinados, seguir ritmos en una variedad de juegos.', habilidades: ['control', 'equilibrio', 'coordinación', 'movimientos', 'desplazamientos'] },
              { codigo: 'OA 2', descripcion: 'Coordinar con precisión sus habilidades motrices finas en función de sus intereses de exploración y juego.', habilidades: ['coordinación', 'motricidad fina', 'precisión', 'exploración'] },
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // KÍNDER — Educación Parvularia
  // ========================================================================
  {
    nombre: 'Kínder',
    asignaturas: [
      {
        nombre: 'Educación Parvularia',
        unidades: [
          {
            numero: 1,
            titulo: 'Juego Primero',
            oa: [
              { codigo: 'OA 1', descripcion: 'Explorar y reconocer figuras geométricas en el entorno.', habilidades: ['figuras', 'geometría', 'exploración', 'reconocimiento'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Juego Primero: Fichas de Experiencias Pedagógicas (Primer Nivel de Transición)',
            url: 'https://catalogotextos.mineduc.cl/catalogo-textos/privado/descargar/3259',
            actividades: [
              'Ficha 1 (Pág. 25): Exploración de figuras para trabajar nociones temporales como primero y después.',
              'Ficha 2 (Pág. 28): Juego "Veo Veo" sacando figuras de una bolsa para describir atributos como vértices y caras.',
              'Ficha 4 (Pág. 34): "El gato de las figuras geométricas" en tableros para afianzar conceptos de ubicación espacial.',
              'Ficha 14 (Pág. 64): "El cartero", resolución de problemas de distribución y conteo usando un buzón.',
              'Ficha 20 (Pág. 82): "¿Dónde hay más?" usando cuantificadores para comparar colecciones de botones.',
            ],
          },
        ],
      },
      {
        nombre: 'Identidad y Autonomía',
        unidades: [
          {
            numero: 1,
            titulo: 'Autoconocimiento y autogestión',
            oa: [
              { codigo: 'OA 1', descripcion: 'Comunicar a otras personas desafíos alcanzados, identificando acciones que aportaron a su logro y definiendo nuevas metas.', habilidades: ['comunicación', 'autoconocimiento', 'metas', 'logros'] },
              { codigo: 'OA 2', descripcion: 'Comunicar sus preferencias, opiniones, ideas, en diversas situaciones cotidianas y juegos.', habilidades: ['comunicación', 'preferencias', 'opiniones', 'participación'] },
              { codigo: 'OA 3', descripcion: 'Planificar proyectos y juegos, en función de sus ideas e intereses, proponiendo actividades, organizando los recursos, incorporando los ajustes necesarios e iniciándose en la apreciación de sus resultados.', habilidades: ['planificación', 'proyectos', 'organización', 'apreciación'] },
            ],
          },
        ],
      },
      {
        nombre: 'Convivencia y Ciudadanía',
        unidades: [
          {
            numero: 1,
            titulo: 'Normas y colaboración',
            oa: [
              { codigo: 'OA 1', descripcion: 'Respetar normas y acuerdos creados colaborativamente con pares y adultos, para el bienestar del grupo.', habilidades: ['respeto', 'normas', 'acuerdos', 'colaboración'] },
              { codigo: 'OA 2', descripcion: 'Participar en actividades o juegos colaborativos, planificando, acordando estrategias para un propósito en común y asumiendo progresivamente responsabilidad en ellos.', habilidades: ['participación', 'estrategias', 'propósito común', 'responsabilidad'] },
              { codigo: 'OA 3', descripcion: 'Comprender que algunas de sus acciones y decisiones con respecto al desarrollo de juegos y proyectos colectivos, influyen en sus pares.', habilidades: ['comprensión', 'acciones', 'decisiones', 'influencia'] },
            ],
          },
        ],
      },
      {
        nombre: 'Corporalidad y Movimiento',
        unidades: [
          {
            numero: 1,
            titulo: 'Habilidades motrices',
            oa: [
              { codigo: 'OA 1', descripcion: 'Resolver desafíos prácticos manteniendo control, equilibrio y coordinación al coordinar diversos movimientos, posturas y desplazamientos tales como: lanzar y recibir, desplazarse en planos inclinados, seguir ritmos en una variedad de juegos.', habilidades: ['control', 'equilibrio', 'coordinación', 'movimientos', 'desplazamientos'] },
              { codigo: 'OA 2', descripcion: 'Coordinar con precisión sus habilidades motrices finas en función de sus intereses de exploración y juego.', habilidades: ['coordinación', 'motricidad fina', 'precisión', 'exploración'] },
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 1° BÁSICO — Primer Ciclo
  // ========================================================================
  {
    nombre: '1° Básico',
    asignaturas: [
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'Comprensión oral y escrita',
            oa: [
              { codigo: 'OA 1', descripcion: 'Expresarse oralmente con claridad usando vocabulario variado en situaciones cotidianas.', habilidades: ['expresión oral', 'vocabulario', 'comunicación', 'turnos'] },
              { codigo: 'OA 2', descripcion: 'Leer textos significativos que incluyan palabras con hiatos y diptongos.', habilidades: ['lectura', 'hiatos', 'diptongos', 'puntuación'] },
              { codigo: 'OA 3', descripcion: 'Identificar los sonidos que componen las palabras.', habilidades: ['fonemas', 'segmentación', 'sonidos', 'conciencia fonológica'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Leo Primero 1° Básico, Tomo 1',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lenguaje-y-Comunicacion-1-Basico/Leo-Primero-Tomo-1/',
            actividades: [
              'Inicio: Activación con Muro de Palabras y vocales con el cuerpo (Pág. 4).',
              'Desarrollo: Actividad "El Elástico" para segmentar fonemas (3-5 sonidos).',
              'Desarrollo: Muro de Palabras Interactivo y conteo de sonidos.',
              'Desarrollo: Juego "El Detective de Sonidos" con caja misteriosa.',
              'Cierre: Reflexión grupal, registro en Muro de Palabras y Cierre Ritual.',
            ],
            planificacion_detalle: 'Planificación 1° Básico, OA 3: Conciencia Fonológica, 40 min. Uso de elástico para segmentación, Muro de Palabras para vocabulario, y juego de detective de sonidos.',
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Números y geometría',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer y nombrar números hasta el 20, cuantificar colecciones.', habilidades: ['números', 'conteo', 'colecciones', 'material concreto'] },
              { codigo: 'OA 2', descripcion: 'Establecer relaciones de correspondencia, clasificación y seriación.', habilidades: ['clasificación', 'seriación', 'correspondencia', 'igualdad'] },
              { codigo: 'OA 3', descripcion: 'Reconocer figuras geométricas básicas en objetos del entorno.', habilidades: ['figuras geométricas', 'círculo', 'cuadrado', 'triángulo'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Sumo Primero 1° Básico, Tomos 1 y 2',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-1-Basico/',
            actividades: [
              'Inicio: Uso de material concreto (bloques) para conteo hasta 20.',
              'Desarrollo: Actividades de descomposición numérica con diagramas de partes y todo.',
              'Desarrollo: Ejercitación guiada de suma y resta con material recortable.',
              'Cierre: Registro de resultados en cuaderno de ejercicios y metacognición.',
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Observación de seres vivos',
            oa: [
              { codigo: 'OA 1', descripcion: 'Observar y describir características de seres vivos y materiales.', habilidades: ['observación', 'descripción', 'clasificación', 'comunicación'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Guía Digital del Docente Ciencias Naturales 1° Básico, Tomo 1 y 2',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Ciencias-Naturales-1-Basico/',
            actividades: [
              'Observación de los sentidos: Exploración guiada de cada sentido con material concreto.',
              'Cuidado del cuerpo: Actividades de higiene, alimentación y descanso.',
              'Clasificación de materiales: Uso de los sentidos para clasificar por textura, color y estado.',
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Mi identidad y entorno',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer su identidad personal dentro de la familia y la escuela.', habilidades: ['identidad', 'familia', 'escuela', 'normas'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Guía Digital del Docente Historia, Geografía y Ciencias Sociales 1° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Historia-Geografia-y-Ciencias-Sociales-1-Basico/',
            actividades: [
              'Unidad 1: Actividades de narración de historias personales y familiares.',
              'Unidad 1: Uso de líneas de tiempo sencillas para ordenar eventos cotidianos.',
              'Unidad 2: Reconocimiento de puntos cardinales en el entorno escolar.',
              'Unidad 2: Observación y descripción de paisajes locales y planos simples.',
            ],
          },
        ],
      },
      {
        nombre: 'Lengua Mapuche',
        unidades: [
          {
            numero: 1,
            titulo: 'Identidad y lengua mapuche',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer la importancia de la lengua mapuche en la identidad cultural del pueblo mapuche.', habilidades: ['identidad', 'cultura', 'lengua mapuche', 'comunidad'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Texto del Estudiante Lengua Mapuche 1° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-Mapuche-1-Basico/',
            actividades: [
              'Saludos y presentaciones en lengua mapuche.',
              'Vocabulario del entorno natural y familiar.',
              'Canciones y rimas tradicionales mapuche.',
            ],
          },
        ],
      },
      {
        nombre: 'Lengua Aymara',
        unidades: [
          {
            numero: 1,
            titulo: 'Identidad y lengua aymara',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer la importancia de la lengua aymara en la identidad cultural del pueblo aymara.', habilidades: ['identidad', 'cultura', 'lengua aymara', 'comunidad'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Texto del Estudiante Lengua Aymara 1° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-Aymara-1-Basico/',
            actividades: [
              'Saludos y presentaciones en lengua aymara.',
              'Vocabulario del entorno natural y familiar.',
              'Canciones y rimas tradicionales aymara.',
            ],
          },
        ],
      },
      {
        nombre: 'Lengua Quechua',
        unidades: [
          {
            numero: 1,
            titulo: 'Identidad y lengua quechua',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer la importancia de la lengua quechua en la identidad cultural del pueblo quechua.', habilidades: ['identidad', 'cultura', 'lengua quechua', 'comunidad'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Texto del Estudiante Lengua Quechua 1° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-Quechua-1-Basico/',
            actividades: [
              'Saludos y presentaciones en lengua quechua.',
              'Vocabulario del entorno natural y familiar.',
              'Canciones y rimas tradicionales quechua.',
            ],
          },
        ],
      },
      {
        nombre: 'Lengua Rapa Nui',
        unidades: [
          {
            numero: 1,
            titulo: 'Identidad y lengua rapa nui',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer la importancia de la lengua rapa nui en la identidad cultural del pueblo rapa nui.', habilidades: ['identidad', 'cultura', 'lengua rapa nui', 'comunidad'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Texto del Estudiante Lengua Rapa Nui 1° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-Rapa-Nui-1-Basico/',
            actividades: [
              'Saludos y presentaciones en lengua rapa nui.',
              'Vocabulario del entorno natural y familiar.',
              'Canciones y rimas tradicionales rapa nui.',
            ],
          },
        ],
      },
      {
        nombre: 'Lengua Indígena Intercultural',
        unidades: [
          {
            numero: 1,
            titulo: 'Interculturalidad y lenguas originarias',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer la diversidad de lenguas originarias de Chile y su valor en la identidad cultural del país.', habilidades: ['interculturalidad', 'diversidad', 'lenguas originarias', 'identidad'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Texto del Estudiante Lengua Indígena Intercultural 1° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-Indigena-Intercultural-1-Basico/',
            actividades: [
              'Reconocimiento de las principales lenguas originarias de Chile.',
              'Saludos y expresiones en diferentes lenguas indígenas.',
              'Actividades de convivencia intercultural y respeto a la diversidad.',
            ],
          },
        ],
      },
      {
        nombre: 'Inglés',
        unidades: [
          {
            numero: 1,
            titulo: 'Me and my family',
            oa: [
              { codigo: 'OA 1', descripcion: 'Presentarse y presentar a su familia usando vocabulario básico en inglés.', habilidades: ['presentación', 'familia', 'vocabulario', 'saludos'] },
            ],
          },
          {
            numero: 2,
            titulo: 'At school',
            oa: [
              { codigo: 'OA 2', descripcion: 'Identificar y nombrar elementos del aula y materiales escolares en inglés.', habilidades: ['aula', 'materiales', 'escuela', 'vocabulario'] },
            ],
          },
          {
            numero: 3,
            titulo: 'My body',
            oa: [
              { codigo: 'OA 3', descripcion: 'Nombrar y describir partes del cuerpo humano en inglés.', habilidades: ['cuerpo', 'partes', 'descripción', 'vocabulario'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Domestic animals and pets',
            oa: [
              { codigo: 'OA 4', descripcion: 'Identificar animales domésticos y mascotas, describiendo sus características en inglés.', habilidades: ['animales', 'mascotas', 'características', 'vocabulario'] },
            ],
          },
          {
            numero: 5,
            titulo: 'Food',
            oa: [
              { codigo: 'OA 5', descripcion: 'Nombrar alimentos y bebidas básicos, expresando preferencias en inglés.', habilidades: ['alimentos', 'bebidas', 'preferencias', 'vocabulario'] },
            ],
          },
          {
            numero: 6,
            titulo: 'My house',
            oa: [
              { codigo: 'OA 6', descripcion: 'Identificar y nombrar partes de la casa y muebles en inglés.', habilidades: ['casa', 'muebles', 'habitaciones', 'vocabulario'] },
            ],
          },
          {
            numero: 7,
            titulo: 'The weather',
            oa: [
              { codigo: 'OA 7', descripcion: 'Describir el clima y condiciones meteorológicas básicas en inglés.', habilidades: ['clima', 'tiempo', 'temperatura', 'vocabulario'] },
            ],
          },
          {
            numero: 8,
            titulo: 'Toys and games',
            oa: [
              { codigo: 'OA 8', descripcion: 'Nombrar juguetes y juegos, describiendo acciones y colores en inglés.', habilidades: ['juguetes', 'juegos', 'colores', 'acciones'] },
            ],
          },
        ],
        textos: [
          {
            titulo: "Student's book ENGLISH FIRST 1",
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-1-Basico/INGME26E1B_compressed.pdf',
            actividades: [
              'Make puppets: Creación de títeres para practicar vocabulario y presentaciones.',
              'Family tree: Construcción de árbol familiar para vocabulario de familiares.',
              "What's this/that practice: Práctica de demostrativos con objetos del entorno.",
              'Body game: Juego interactivo para identificar partes del cuerpo.',
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 2° BÁSICO — Primer Ciclo
  // ========================================================================
  {
    nombre: '2° Básico',
    asignaturas: [
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'Cuentos, poemas y fábulas',
            oa: [
              { codigo: 'OA 1', descripcion: 'Comprender textos literarios como fábulas y leyendas, extrayendo información y reconociendo personajes.', habilidades: ['comprensión', 'personajes', 'información', 'fábulas'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Textos informativos y curiosidades de la naturaleza',
            oa: [
              { codigo: 'OA 2', descripcion: 'Leer para aprender sobre animales y el entorno, extrayendo datos explícitos de artículos informativos.', habilidades: ['información explícita', 'artículos', 'animales', 'entorno'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Historias, leyendas y tradiciones',
            oa: [
              { codigo: 'OA 3', descripcion: 'Conocer e identificar modos de vida de pueblos originarios a través de leyendas y relatos tradicionales.', habilidades: ['leyendas', 'pueblos originarios', 'tradiciones', 'relatos'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Leo Primero 2° Básico (Tomos 1 y 2)',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lenguaje-y-Comunicacion-2-Basico/LYCME26E2B.pdf',
            actividades: [
              'Lectura de cuentos tradicionales, poemas y fábulas.',
              'Escritura de fichas informativas, cuentos y biografías.',
              'Creación de afiches y recetas.',
              'Juego de roles y declamación de poemas.',
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Números, adición y sustracción hasta 100',
            oa: [
              { codigo: 'OA 1', descripcion: 'Contar, leer, comparar y calcular adiciones y sustracciones de dos dígitos en forma vertical.', habilidades: ['números', 'comparación', 'suma', 'resta', 'vertical'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Longitud y Gráficos',
            oa: [
              { codigo: 'OA 2', descripcion: 'Medir longitudes en metros, centímetros y milímetros. Leer y construir pictogramas y gráficos de barras.', habilidades: ['medición', 'metros', 'centímetros', 'pictogramas', 'gráficos'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Igualdad, desigualdad y patrones',
            oa: [
              { codigo: 'OA 3', descripcion: 'Comprender la relación de igualdad y desigualdad usando balanzas, e identificar patrones numéricos y geométricos.', habilidades: ['igualdad', 'desigualdad', 'balanzas', 'patrones'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Multiplicación y Geometría',
            oa: [
              { codigo: 'OA 4', descripcion: 'Comprender la multiplicación como suma iterada (tablas del 2, 5 y 10) y describir figuras y cuerpos geométricos.', habilidades: ['multiplicación', 'tablas', 'figuras', 'cuerpos', 'aristas', 'vértices'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Sumo Primero 2° Básico (Tomos 1 y 2)',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-2-Basico/MATME26E2B.pdf',
            actividades: [
              'Uso de la balanza para comprender igualdades y desigualdades.',
              'Medición con regla y huincha (m, cm, mm).',
              'Construcción de figuras 2D y cuerpos 3D con material concreto.',
              'Juegos de cartas (Memorice) para practicar tablas de multiplicar.',
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Cuidemos nuestro cuerpo',
            oa: [
              { codigo: 'OA 1', descripcion: 'Describir la función de los órganos internos (corazón, pulmones, estómago) y estructuras (huesos y músculos), e identificar los efectos de la actividad física.', habilidades: ['órganos', 'cuerpo', 'actividad física', 'salud'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Animales en peligro',
            oa: [
              { codigo: 'OA 2', descripcion: 'Identificar y clasificar fauna nativa de Chile en peligro de extinción, comprender las causas de su amenaza y proponer acciones para su conservación.', habilidades: ['fauna', 'extinción', 'conservación', 'hábitat'] },
            ],
          },
          {
            numero: 3,
            titulo: 'El agua, fuente de vida',
            oa: [
              { codigo: 'OA 3', descripcion: 'Reconocer las características del agua, su importancia vital para los seres vivos, su ciclo en la naturaleza y proponer formas de cuidarla.', habilidades: ['agua', 'ciclo', 'cuidado', 'sequía'] },
            ],
          },
          {
            numero: 4,
            titulo: 'El tiempo atmosférico',
            oa: [
              { codigo: 'OA 4', descripcion: 'Describir y medir características del tiempo atmosférico (lluvia, viento, temperatura), relacionándolas con las estaciones del año.', habilidades: ['clima', 'temperatura', 'estaciones', 'lluvia'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Guía Digital del Docente Ciencias Naturales 2° Básico (Tomos 1 y 2)',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Ciencias-Naturales-2-Basico/GUIA_DOCENTE_CIENCIAS_2B.pdf',
            actividades: [
              'Exploración de la anatomía humana, ubicando corazón, pulmones y estómago mediante la creación de modelos artístico-científicos.',
              'Práctica de actividades de atención plena (mindfulness) y posturas de yoga para percibir los cambios del cuerpo (pulso, respiración) en reposo y en movimiento.',
              'Investigación no experimental (bibliográfica) sobre animales nativos de Chile y su estado de conservación (ej. en peligro de extinción).',
              'Desarrollo de proyectos interdisciplinares (ABP) para promover la actividad física o comunicar medidas de protección para la fauna local.',
              'Reflexión sobre problemáticas socioambientales contemporáneas (ej. contaminación de los océanos, sequías, microplásticos).',
              'Aplicación del ciclo de modelización científica (definir un problema, elegir representación, construir y poner a prueba).',
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 3,
            titulo: 'Chile, una sociedad mestiza y multicultural',
            oa: [
              { codigo: 'OA 3', descripcion: 'Conocer y distinguir los aportes de diversas culturas (pueblos originarios, conquistadores españoles y comunidades de inmigrantes) en la formación de la sociedad chilena.', habilidades: ['mestizaje', 'multicultural', 'inmigrantes', 'aportes'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Vivimos en comunidad',
            oa: [
              { codigo: 'OA 4', descripcion: 'Identificar y aplicar normas para la convivencia, el cuidado de los espacios públicos y del medio ambiente, valorando instituciones y medios de transporte/comunicación.', habilidades: ['normas', 'convivencia', 'comunidad', 'instituciones'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Guía Digital del Docente Historia, Geografía y Ciencias Sociales 2° Básico (Tomo 2)',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Historia-Geografia-y-Ciencias-Sociales-2-Basico/GUIA_DOCENTE_HISTORIA_2B_T2.pdf',
            actividades: [
              'Identificación de elementos de continuidad y cambio temporal mediante la secuenciación cronológica de hitos familiares o históricos.',
              'Investigación sobre el origen familiar o el legado de comunidades de inmigrantes para presentarlo de forma oral, visual o escrita.',
              'Análisis de fuentes visuales e iconográficas y creación de afiches o cómics (ej. campañas de cuidado del medioambiente).',
              'Participación en diálogos y debates guiados sobre la importancia de las normas, el patrimonio cultural y la diversidad.',
              'Elaboración e interpretación de encuestas y pictogramas en conjunto con Matemática, para conocer intereses de la comunidad escolar.',
              'Diseño de un proyecto final (Muestra multicultural) enfocado en reconocer los aportes de las diversas culturas que forman la sociedad chilena.',
            ],
          },
        ],
      },
      {
        nombre: 'Lengua y Cultura de los Pueblos Originarios Ancestrales - Aymara',
        unidades: [
          {
            numero: 1,
            titulo: 'Uywa wayñu (Fiesta del ganado)',
            oa: [
              { codigo: 'OA 1', descripcion: 'Conocer los espacios del territorio andino (araxpacha, akapacha, manqhapacha) y comprender la importancia cultural y retribución en la fiesta del ganado.', habilidades: ['territorio', 'araxpacha', 'akapacha', 'manqhapacha', 'fiesta del ganado'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Willka Kuti (Retorno del Sol)',
            oa: [
              { codigo: 'OA 2', descripcion: 'Comprender la ceremonia del retorno del sol, identificando los principios, valores andinos y las formas correctas de saludo en la comunidad.', habilidades: ['Willka Kuti', 'valores andinos', 'saludo', 'comunidad'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Pachamama (Madre naturaleza)',
            oa: [
              { codigo: 'OA 3', descripcion: 'Conocer las vivencias de los antepasados, el uso de plantas medicinales, la música y la alimentación andina destacando el valor de la quinua.', habilidades: ['Pachamama', 'plantas medicinales', 'música', 'alimentación', 'quinua'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Satapacha (Tiempo de siembra)',
            oa: [
              { codigo: 'OA 4', descripcion: 'Comprender el calendario agroganadero y el tiempo de siembra, identificando la historia de la comunidad y el respeto por los lugares de origen.', habilidades: ['Satapacha', 'calendario', 'siembra', 'historia'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Yatintiri Pankapa Aymara Marka 2° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-Aymara-2-Basico/AYMME26E2B_2.pdf',
            actividades: [
              'Reconocimiento de los espacios del territorio (araxpacha, akapacha, manqhapacha).',
              'Participación en ceremonias como la fiesta del ganado (uywa wayñu) y el corte de pelo (rutucha).',
              'Celebración del Retorno del Sol (Willka Kuti) y el tiempo de siembra (Satapacha).',
              'Elaboración de un diccionario ilustrado sobre los elementos de la naturaleza.',
            ],
          },
        ],
      },
      {
        nombre: 'Lengua y Cultura de los Pueblos Originarios Ancestrales - Quechua',
        unidades: [
          {
            numero: 1,
            titulo: 'Imataq Pachamama niyta munan? (¿Qué quiere decir la naturaleza?)',
            oa: [
              { codigo: 'OA 1', descripcion: 'Escuchar a la naturaleza, interpretar sus mensajes y comprender el sentido de ceremonias de agradecimiento como el sahumerio a la Pachamama.', habilidades: ['naturaleza', 'mensajes', 'ceremonias', 'Pachamama', 'sahumerio'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Imaynataq suyu maypi tiyani? (¿Cómo es el territorio en donde vivo?)',
            oa: [
              { codigo: 'OA 2', descripcion: 'Identificar las características del propio territorio, reconociendo a las familias, a los encargados y a las autoridades de la comunidad.', habilidades: ['territorio', 'familias', 'encargados', 'autoridades', 'comunidad'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Yawar masiykuwan aylluykuwan ima sumaq tiyanapi kawsanchiq',
            oa: [
              { codigo: 'OA 3', descripcion: 'Comprender los relatos de la comunidad, las relaciones de parentesco, el significado de la Chakana y los valores representados en la bandera Wiphala.', habilidades: ['relatos', 'parentesco', 'Chakana', 'Wiphala', 'valores'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Aylluypi kawsanamanta llank\'ay (El desarrollo de la cultura en mi comunidad)',
            oa: [
              { codigo: 'OA 4', descripcion: 'Aprender sobre la fiesta del Inti Raymi, los relatos tradicionales y las técnicas agrícolas en terrazas para el cuidado del entorno.', habilidades: ['Inti Raymi', 'relatos tradicionales', 'agricultura', 'entorno'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Yachaqaq Mayt\'u Qhishwa Llaqta 2° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-Quechua-2-Basico/QUEME26E2B_2.pdf',
            actividades: [
              'Escuchar y dibujar los distintos elementos y mensajes de la naturaleza.',
              'Reconocimiento del territorio, de la Chakana y del significado de la bandera andina Wiphala.',
              'Identificación de las autoridades, encargados de la comunidad y saberes ancestrales (amawta).',
              'Elaboración de un museo vivo de la cultura y herbario de plantas medicinales.',
            ],
          },
        ],
      },
      {
        nombre: 'Lengua y Cultura de los Pueblos Originarios Ancestrales - Rapa Nui',
        unidades: [
          {
            numero: 1,
            titulo: 'Haka ara o te \'ariki (El camino del rey)',
            oa: [
              { codigo: 'OA 1', descripcion: 'Conocer la leyenda de los exploradores y la llegada a \'Ana Kena, identificando la importancia del respeto por los lugares sagrados o Tapu.', habilidades: ['leyenda', 'exploradores', 'Ana Kena', 'Tapu', 'respeto'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Te hauha\'a tupuna Rapa Nui (El patrimonio ancestral Rapa Nui)',
            oa: [
              { codigo: 'OA 2', descripcion: 'Aprender sobre las tradiciones ancestrales de Rapa Nui, como la preparación del \'umu (curanto), relatos tradicionales, cantos y juegos.', habilidades: ['tradiciones', 'umu', 'curanto', 'cantos', 'juegos'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Te Rono-rono - te \'a\'ati tupuna - te manu o Rapa Nui',
            oa: [
              { codigo: 'OA 3', descripcion: 'Conocer el significado de la escritura rongo-rongo, las competencias físicas y deportivas tradicionales de la Tāpati y la importancia de las aves de la isla.', habilidades: ['rongo-rongo', 'Tāpati', 'aves', 'escritura', 'competencias'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Te natura - te aŋa tupuna - te ao o te raŋi – te tupa',
            oa: [
              { codigo: 'OA 4', descripcion: 'Comprender los mensajes de la naturaleza mediante la observación de las estaciones del año, las estrellas y los antiguos observatorios o Tupa.', habilidades: ['naturaleza', 'estaciones', 'estrellas', 'Tupa', 'observatorios'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Hau Rapa Nui 2° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-Rapa-Nui-2-Basico/RAPME26E2B_2.pdf',
            actividades: [
              'Exploración de la historia de la llegada del rey Hotu Matu\'a y los siete exploradores.',
              'Reconocimiento de la elaboración del curanto (\'Umu Ta\'o) y el tallado de figuras como el Mōai Kava-kava.',
              'Identificación de la flora y fauna local (Manu Tara) y deportes ancestrales de la Tāpati.',
              'Reconocimiento de las constelaciones (Mata Riki), estaciones del año y observatorios de piedra (Tupa).',
            ],
          },
        ],
      },
      {
        nombre: 'Lengua y Cultura de los Pueblos Originarios Ancestrales - Mapuche',
        unidades: [
          {
            numero: 1,
            titulo: 'Tayiñ mapuchegen ka tayiñ az felen (Nuestro ser mapuche y nuestras emociones)',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer emociones y comportamientos humanos a través de epew y piam, comprendiendo la importancia de los saludos y la alimentación.', habilidades: ['emociones', 'epew', 'piam', 'saludos', 'alimentación'] },
            ],
          },
          {
            numero: 2,
            titulo: '¡Wallontu mapu mew müley itxofill mogen! (¡Hay diversidad de vida en el universo!)',
            oa: [
              { codigo: 'OA 2', descripcion: 'Identificar los distintos territorios mapuche y sus características geográficas, junto a la vestimenta tradicional y la celebración del Wiñol Txipan Antü.', habilidades: ['territorios mapuche', 'geografía', 'vestimenta', 'Wiñol Txipantü'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Fillke wirin mapuche mapu mew (Las diversas escrituras del territorio mapuche)',
            oa: [
              { codigo: 'OA 3', descripcion: 'Conocer el idioma mapuzugun mediante saludos y descripciones de oficios, comprendiendo además el valor del trabajo en platería (rütxan).', habilidades: ['mapuzugun', 'saludos', 'oficios', 'platería', 'rütxan'] },
            ],
          },
          {
            numero: 4,
            titulo: '¡Tañi wallontu mapu ñi zugun zugu! (¡Los mensajes de mi entorno!)',
            oa: [
              { codigo: 'OA 4', descripcion: 'Comprender los mensajes que entregan los animales, las señales de la naturaleza, el significado de las banderas y los ciclos de recolección.', habilidades: ['animales', 'naturaleza', 'banderas', 'recolección', 'mensajes'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Küzawgeael chi chillka Pueblo Mapuche 2° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-Mapuche-2-Basico/MAPME26E2B_2.pdf',
            actividades: [
              'Identificación de emociones y comportamientos a través de relatos tradicionales (epew y piam).',
              'Reconocimiento de las identidades territoriales (Meli witxan mapu) y participación en el Wiñol Txipantü.',
              'Identificación de símbolos, vestimenta tradicional (küpam y txariwe) y el trabajo en platería (rütxafe).',
              'Comprensión de los mensajes de la naturaleza, las banderas ceremoniales y los ciclos de recolección de alimentos.',
            ],
          },
        ],
      },
      {
        nombre: 'Lengua y Cultura de los Pueblos Originarios Ancestrales - Interculturalidad',
        unidades: [
          {
            numero: 1,
            titulo: 'Territorio quechua y aymara',
            oa: [
              { codigo: 'OA 1', descripcion: 'Conocer las características del territorio aymara y quechua, sus ceremonias ancestrales vinculadas a la naturaleza y los tiempos andinos.', habilidades: ['territorio', 'aymara', 'quechua', 'ceremonias', 'naturaleza'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Territorio colla y lickanantay',
            oa: [
              { codigo: 'OA 2', descripcion: 'Conocer relatos tradicionales de la memoria lickanantay y la sabiduría del pueblo Colla sobre el bienestar, el cuidado y las ceremonias en armonía con la naturaleza.', habilidades: ['colla', 'lickanantay', 'relatos', 'armonía', 'naturaleza'] },
            ],
          },
          {
            numero: 3,
            titulo: '¿Qué nos contarán los pueblos Diaguita y Rapa Nui?',
            oa: [
              { codigo: 'OA 3', descripcion: 'Identificar el patrimonio y los lugares sagrados del pueblo Rapa Nui, junto con la cerámica del pueblo Diaguita y la importancia de los mensajes en piedras o petroglifos.', habilidades: ['diaguita', 'rapa nui', 'patrimonio', 'petroglifos', 'cerámica'] },
            ],
          },
          {
            numero: 4,
            titulo: '¿Qué nos enseñarán los pueblos Kawésqar, Yagán y Mapuche Williche?',
            oa: [
              { codigo: 'OA 4', descripcion: 'Conocer los sonidos, relatos y embarcaciones tradicionales de los pueblos australes, destacando la recolección, el tejido de canastos de junco y el uso de corrales de pesca.', habilidades: ['kawésqar', 'yagán', 'mapuche williche', 'embarcaciones', 'corrales de pesca'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Interculturalidad 2° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Interculturalidad-2-Basico/Interculturalidad_2B.pdf',
            actividades: [
              'Visitar y agradecer a un espacio natural, reconociendo el tiempo andino (Ch\'akiy, Qhasay, Para).',
              'Modelar en greda o plasticina cerámica diaguita y construir jardineras o herbarios de plantas medicinales.',
              'Crear afiches y participar en ferias de trueque de semillas para preservar el conocimiento ancestral.',
              'Elaborar un canasto recolector (yagán/kawésqar) y dibujar el funcionamiento de los corrales de pesca.',
            ],
          },
        ],
      },
      {
        nombre: 'Inglés',
        unidades: [
          {
            numero: 1,
            titulo: 'Wild animals',
            oa: [
              { codigo: 'OA 1', descripcion: 'Nombrar y describir animales salvajes favoritos, aprendiendo a formular preguntas sencillas.', habilidades: ['animales', 'salvajes', 'preguntas', 'vocabulario'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Sports and free time',
            oa: [
              { codigo: 'OA 2', descripcion: 'Describir actividades de tiempo libre, pasatiempos y deportes favoritos, expresando habilidades.', habilidades: ['deportes', 'tiempo libre', 'pasatiempos', 'habilidades'] },
            ],
          },
          {
            numero: 3,
            titulo: 'My clothes',
            oa: [
              { codigo: 'OA 3', descripcion: 'Identificar, nombrar y describir prendas de vestir, eligiendo la ropa adecuada según el clima.', habilidades: ['ropa', 'prendas', 'clima', 'vestimenta'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Jobs and professions',
            oa: [
              { codigo: 'OA 4', descripcion: 'Identificar diversas profesiones y sus herramientas de trabajo, asociándolas con elementos del entorno.', habilidades: ['profesiones', 'herramientas', 'trabajo', 'entorno'] },
            ],
          },
          {
            numero: 5,
            titulo: 'My classmates',
            oa: [
              { codigo: 'OA 5', descripcion: 'Describir las características físicas de los compañeros de clase y hablar sobre uno mismo reconociendo las diferencias.', habilidades: ['compañeros', 'características', 'diferencias', 'descripción'] },
            ],
          },
          {
            numero: 6,
            titulo: 'My city',
            oa: [
              { codigo: 'OA 6', descripcion: 'Hablar sobre lugares de la ciudad, describir ubicaciones favoritas y dar direcciones básicas.', habilidades: ['ciudad', 'lugares', 'ubicaciones', 'direcciones'] },
            ],
          },
          {
            numero: 7,
            titulo: 'Festivities',
            oa: [
              { codigo: 'OA 7', descripcion: 'Conversar sobre celebraciones, describir tradiciones y expresar las fechas en las que ocurren estas festividades.', habilidades: ['festividades', 'celebraciones', 'tradiciones', 'fechas'] },
            ],
          },
          {
            numero: 8,
            titulo: 'Musical instruments',
            oa: [
              { codigo: 'OA 8', descripcion: 'Reconocer instrumentos musicales, mencionar cómo tocarlos y hablar sobre los gustos musicales.', habilidades: ['instrumentos', 'música', 'gustos', 'tocar'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'English First 2° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-2-Basico/INTME26E2B_2.pdf',
            actividades: [
              'Juegos de vocabulario, cantos y ejercicios de escucha (listening) sobre animales, deportes, ropa y profesiones.',
              'Lectura y representación de cuentos clásicos e historias (e.g., Puss in Boots, The Shoemaker and the Elves).',
              'Actividades manuales, dibujos y recortables interactivos como creación de origami.',
              'Juegos de roles y entrevistas sencillas con compañeros practicando preguntas y respuestas básicas en inglés.',
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 3° BÁSICO — Primer Ciclo
  // ========================================================================
  {
    nombre: '3° Básico',
    asignaturas: [
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'Mis lugares, ideas y el universo (Lecciones 1-6)',
            oa: [
              { codigo: 'OA 1', descripcion: 'Leer y comprender narraciones y artículos informativos sobre la Tierra y el universo, extrayendo información explícita e implícita, y escribiendo textos breves.', habilidades: ['lectura', 'comprensión', 'información', 'universo', 'escritura'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Animales, amistad y trabajo en equipo (Lecciones 7-12)',
            oa: [
              { codigo: 'OA 2', descripcion: 'Comprender poemas, fábulas y cómics valorando la ayuda mutua, y desarrollar la escritura creativa expresando opiniones y emociones.', habilidades: ['poemas', 'fábulas', 'cómics', 'escritura creativa', 'emociones'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Historias sorprendentes y nuestro entorno (Lecciones 13-18)',
            oa: [
              { codigo: 'OA 3', descripcion: 'Escribir artículos informativos y cuentos utilizando correctamente signos de puntuación, e investigar sobre temas del entorno natural y social.', habilidades: ['artículos', 'cuentos', 'puntuación', 'investigación', 'entorno'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Aventuras, tradiciones y descubrimientos (Lecciones 19-24)',
            oa: [
              { codigo: 'OA 4', descripcion: 'Comprender textos orales y escritos sobre tradiciones, identificar el propósito del autor y participar en exposiciones orales expresando ideas con claridad.', habilidades: ['tradiciones', 'propósito del autor', 'exposiciones', 'oralidad'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Leo Primero 3° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lenguaje-y-Comunicacion-3-Basico/LYCME26E3B_compressed.pdf',
            actividades: [
              'Lectura comprensiva y fluida de textos literarios (cuentos, poemas, fábulas, cómics) y no literarios (artículos informativos, cartas, biografías).',
              'Escritura guiada y creativa de anécdotas, afiches, correos electrónicos e instrucciones, aplicando el proceso de escritura (planificar, escribir, revisar).',
              'Actividades sistemáticas de ampliación de vocabulario (palabras de uso frecuente) y reconocimiento de estructuras gramaticales (sustantivos, adjetivos, verbos).',
              'Expresión oral mediante la representación de diálogos, declamación de poemas y participación en conversaciones grupales.',
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Números hasta 1000, Adición, Sustracción y Patrones',
            oa: [
              { codigo: 'OA 1', descripcion: 'Leer, contar y representar números hasta 1000, resolver adiciones y sustracciones en forma vertical con reagrupamiento, y reconocer patrones numéricos en la tabla del 100.', habilidades: ['números', 'hasta 1000', 'suma', 'resta', 'vertical', 'reagrupamiento', 'patrones'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Tiempo, Multiplicación y División',
            oa: [
              { codigo: 'OA 2', descripcion: 'Leer la hora en relojes análogos y digitales calculando duraciones, construir y memorizar las tablas de multiplicar, y resolver problemas de división.', habilidades: ['tiempo', 'relojes', 'multiplicación', 'tablas', 'división'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Localización, Cuerpos Geométricos, Perímetro y Triángulos',
            oa: [
              { codigo: 'OA 3', descripcion: 'Describir localizaciones en una cuadrícula, identificar redes de cuerpos geométricos 3D, calcular el perímetro de rectángulos o cuadrados y clasificar triángulos según sus lados y ángulos.', habilidades: ['cuadrícula', 'cuerpos 3D', 'perímetro', 'triángulos', 'clasificación'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Datos, Fracciones y Masa',
            oa: [
              { codigo: 'OA 4', descripcion: 'Construir e interpretar gráficos de barras y juegos de azar, comparar fracciones de uso común, y utilizar instrumentos para medir la masa en kilogramos y gramos.', habilidades: ['gráficos', 'fracciones', 'masa', 'kilogramos', 'gramos'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Sumo Primero 3° Básico (Tomos 1 y 2)',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-3-Basico/Sumo_Primero_3_Basico.pdf',
            actividades: [
              'Resolución de adiciones y sustracciones en forma vertical con reagrupamiento para números de hasta 3 dígitos.',
              'Memorización de las tablas de multiplicar y aplicación del concepto de división como reparto equitativo y agrupamiento.',
              'Ubicación de objetos en cuadrículas mediante coordenadas y descripción de trayectorias con puntos cardinales.',
              'Construcción de redes para cuerpos geométricos (paralelepípedos, cubos, cilindros, conos) y cálculo de perímetros.',
              'Elaboración e interpretación de gráficos de barras con escalas y representación de fracciones de uso común (medios, tercios, cuartos).',
              'Estimación y medición de masa utilizando balanzas, gramos (g) y kilogramos (kg), y lectura del tiempo en horas y minutos.',
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'El sistema solar',
            oa: [
              { codigo: 'OA 1', descripcion: 'Identificar los componentes del sistema solar (Sol, planetas, satélites, cometas y asteroides) y explicar los movimientos de rotación y traslación de la Tierra junto con sus efectos.', habilidades: ['sistema solar', 'planetas', 'rotación', 'traslación', 'Tierra'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Descubriendo la luz y el sonido',
            oa: [
              { codigo: 'OA 2', descripcion: 'Explicar las características de la luz y del sonido, investigando a través de la experimentación cómo se propagan, reflejan y son absorbidos por distintos materiales.', habilidades: ['luz', 'sonido', 'propagación', 'reflexión', 'absorción'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Las plantas',
            oa: [
              { codigo: 'OA 3', descripcion: 'Comprender las estructuras y necesidades de las plantas, conocer la flora nativa de Chile, valorar su importancia para los seres vivos y proponer acciones para el manejo de residuos.', habilidades: ['plantas', 'flora nativa', 'residuos', 'reciclaje', '3R'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Alimentación saludable',
            oa: [
              { codigo: 'OA 4', descripcion: 'Clasificar los alimentos según su función (energéticos, constructores, reguladores) y composición nutricional, reconociendo las consecuencias de una mala dieta para aplicar hábitos saludables.', habilidades: ['alimentos', 'nutrición', 'hábitos saludables', 'dieta'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Ciencias Naturales 3° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Ciencias-Naturales-3-Basico/CIENCIAS_NATURALES_3B.pdf',
            actividades: [
              'Construir modelos del sistema solar y representar los movimientos de rotación y traslación de la Tierra usando esferas de plumavit y linternas.',
              'Realizar investigaciones experimentales para comprobar las propiedades de la luz (reflexión/descomposición) y del sonido (tono, intensidad y propagación).',
              'Elaborar un herbario local de plantas nativas, armar una compostera y crear un plan de acción basado en la regla de las 3R (reducir, reutilizar, reciclar).',
              'Analizar etiquetas de advertencia nutricional para distinguir alimentos saludables de los no saludables y diseñar afiches para promover un estilo de vida sano.',
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: '¿Cómo podemos conocer el planeta Tierra?',
            oa: [
              { codigo: 'OA 1', descripcion: 'Orientarse en el espacio utilizando cuadrículas y puntos cardinales, e identificar líneas imaginarias, continentes, océanos y las características de las diferentes zonas climáticas.', habilidades: ['cuadrículas', 'puntos cardinales', 'continentes', 'océanos', 'clima'] },
            ],
          },
          {
            numero: 2,
            titulo: '¿Cómo vivían los antiguos griegos y qué nos legaron?',
            oa: [
              { codigo: 'OA 2', descripcion: 'Comprender la influencia del entorno natural en la civilización griega, cómo se desarrollaba la vida en las polis y reconocer su legado en la democracia, el arte, la filosofía y el deporte.', habilidades: ['griegos', 'polis', 'democracia', 'arte', 'filosofía', 'deporte'] },
            ],
          },
          {
            numero: 3,
            titulo: '¿Cómo vivían los antiguos romanos y cuál es su legado?',
            oa: [
              { codigo: 'OA 3', descripcion: 'Describir el surgimiento de Roma, su organización en grupos sociales, la vida en la ciudad y reconocer aportes como el latín, el derecho romano y su avanzada ingeniería (acueductos y calzadas).', habilidades: ['romanos', 'latín', 'derecho', 'ingeniería', 'acueductos'] },
            ],
          },
          {
            numero: 4,
            titulo: '¿Cómo aportamos a la vida en comunidad?',
            oa: [
              { codigo: 'OA 4', descripcion: 'Reconocer actitudes fundamentales para la convivencia (respeto, tolerancia, empatía), comprender la importancia de los Derechos del Niño y la labor de las instituciones en la protección ciudadana.', habilidades: ['convivencia', 'respeto', 'tolerancia', 'Derechos del Niño', 'instituciones'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Historia, Geografía y Ciencias Sociales 3° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Historia-Geografia-y-Ciencias-Sociales-3-Basico/HISSA26E3B_compressed.pdf',
            actividades: [
              'Localizar lugares y objetos utilizando cuadrículas, líneas de referencia y puntos cardinales en planos y mapas.',
              'Investigar y comunicar información sobre el entorno geográfico, la vida cotidiana y el legado cultural de las civilizaciones griega y romana.',
              'Extraer información temporal y espacial mediante la construcción y lectura de líneas de tiempo y mapas históricos.',
              'Analizar situaciones cotidianas para promover actitudes ciudadanas, deberes, buena convivencia y respeto a los Derechos de los Niños.',
              'Identificar y valorar el rol de instituciones públicas y privadas que benefician a la comunidad (hospitales, bomberos, colegios, fundaciones, etc.).',
            ],
          },
        ],
      },
      {
        nombre: 'Inglés',
        unidades: [
          {
            numero: 1,
            titulo: 'Ready for school',
            oa: [
              { codigo: 'OA 1', descripcion: 'Identificar y nombrar útiles escolares, y describir la ubicación espacial de los objetos usando preposiciones.', habilidades: ['útiles', 'escolares', 'preposiciones', 'ubicación'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Busy morning!',
            oa: [
              { codigo: 'OA 2', descripcion: 'Hablar sobre rutinas diarias (levantarse, ducharse, desayunar, etc.) e indicar la hora en inglés.', habilidades: ['rutinas', 'mañana', 'hora', 'actividades'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Story world',
            oa: [
              { codigo: 'OA 3', descripcion: 'Describir física y psicológicamente a personajes de cuentos (pirata, bruja, princesa, etc.) a través de diálogos cortos.', habilidades: ['personajes', 'cuentos', 'descripción', 'diálogos'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Sports',
            oa: [
              { codigo: 'OA 4', descripcion: 'Nombrar deportes, expresar habilidades físicas usando can / can\'t y hablar de gustos y preferencias.', habilidades: ['deportes', 'habilidades', 'can', 'gustos'] },
            ],
          },
          {
            numero: 5,
            titulo: 'Nature park',
            oa: [
              { codigo: 'OA 5', descripcion: 'Describir animales salvajes y formular preguntas simples sobre sus características físicas y habilidades.', habilidades: ['animales', 'salvajes', 'características', 'preguntas'] },
            ],
          },
          {
            numero: 6,
            titulo: 'After school fun!',
            oa: [
              { codigo: 'OA 6', descripcion: 'Describir acciones en progreso (presente continuo) y nombrar e identificar las diferentes partes de la casa.', habilidades: ['presente continuo', 'acciones', 'casa', 'partes'] },
            ],
          },
          {
            numero: 7,
            titulo: 'Transport',
            oa: [
              { codigo: 'OA 7', descripcion: 'Conocer distintos medios de transporte, usar adjetivos para describirlos (lento, rápido, viejo, nuevo) y contar hasta cien.', habilidades: ['transporte', 'adjetivos', 'contar', 'velocidad'] },
            ],
          },
          {
            numero: 8,
            titulo: 'Summer fun',
            oa: [
              { codigo: 'OA 8', descripcion: 'Aprender vocabulario relacionado a actividades de verano (acampar, surfear, etc.) y formular preguntas para interactuar con pares.', habilidades: ['verano', 'actividades', 'vocabulario', 'interacción'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Get ready with English 3° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-3-Basico/ingles-1.pdf',
            actividades: [
              'Juegos de roles y entrevistas con compañeros para practicar vocabulario de útiles escolares y preposiciones de lugar (in, on, under, behind).',
              'Creación de horarios personales (timetables) para describir rutinas diarias y decir la hora del día.',
              'Expresión oral sobre deportes y habilidades utilizando correctamente can y can\'t, junto con preferencias (like).',
              'Lectura de historias cortas, cantos (chants) y descripción de personajes, animales salvajes, transporte y actividades de verano.',
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 4° BÁSICO — Primer Ciclo
  // ========================================================================
  {
    nombre: '4° Básico',
    asignaturas: [
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'Un viaje sorpresivo',
            oa: [
              { codigo: 'OA 1', descripcion: 'Desarrollar la comprensión de narraciones sobre viajes, incluyendo leyendas y cuentos, practicando la descripción escrita y la secuenciación de hechos.', habilidades: ['lectura', 'leyendas', 'cuentos', 'secuenciación'] },
            ],
          },
          {
            numero: 2,
            titulo: '¡Qué animales más curiosos!',
            oa: [
              { codigo: 'OA 2', descripcion: 'Explorar textos informativos sobre fauna, redactar noticias periodísticas y fortalecer el uso de tildes en palabras agudas, graves y esdrújulas.', habilidades: ['informativo', 'noticias', 'ortografía', 'tildes'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Aventuras salvajes',
            oa: [
              { codigo: 'OA 3', descripcion: 'Reflexionar sobre hábitats mediante la lectura de fábulas y artículos, practicando el uso de adjetivos calificativos y la escritura creativa.', habilidades: ['fábulas', 'adjetivos', 'escritura creativa'] },
            ],
          },
          {
            numero: 4,
            titulo: 'El universo canta',
            oa: [
              { codigo: 'OA 4', descripcion: 'Analizar el lenguaje poético y figurado, la personificación y la metáfora a través de la lectura y creación de poemas y retahílas.', habilidades: ['poemas', 'metáfora', 'personificación'] },
            ],
          },
          {
            numero: 5,
            titulo: 'Sueños cumplidos',
            oa: [
              { codigo: 'OA 5', descripcion: 'Fomentar la reflexión sobre las actitudes personales mediante fábulas, reforzando la redacción con el uso de sinónimos para enriquecer el vocabulario.', habilidades: ['fábulas', 'sinónimos', 'vocabulario'] },
            ],
          },
          {
            numero: 6,
            titulo: 'Historias misteriosas',
            oa: [
              { codigo: 'OA 6', descripcion: 'Explorar textos con elementos fantásticos, investigar sobre figuras históricas mediante biografías y utilizar correctamente conectores temporales.', habilidades: ['biografías', 'conectores', 'temporales'] },
            ],
          },
          {
            numero: 7,
            titulo: 'Historias de la tierra',
            oa: [
              { codigo: 'OA 7', descripcion: 'Comprender la visión de mundo del pueblo Mapuche y otros pueblos mediante leyendas, trabajando la concordancia entre sujeto y verbo.', habilidades: ['leyendas', 'mapuche', 'concordancia'] },
            ],
          },
          {
            numero: 8,
            titulo: 'Animales extraordinarios',
            oa: [
              { codigo: 'OA 8', descripcion: 'Profundizar en la lectura informativa y el uso de adverbios (modo, tiempo, lugar), culminando con la escritura de artículos informativos y recetas.', habilidades: ['adverbios', 'informativo', 'recetas'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Leo Primero 4° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lenguaje-y-Comunicacion-4-Basico/HISSM26E4B_compressed.pdf',
            actividades: [
              'Escucha activa y comprensión de leyendas, cuentos y artículos informativos.',
              'Uso de estrategias de comprensión lectora: secuenciar, predecir, inferir y formular preguntas.',
              'Producción de textos escritos: descripciones, noticias, cartas, cuentos, artículos informativos y fábulas.',
              'Aplicación de reglas ortográficas (acentuación agudas/graves/esdrújulas, combinaciones mb/nv) y gramaticales (verbos, pronombres, adverbios).',
              'Expresión oral: declamación de poemas, dramatización de diálogos y entrevistas a personajes.',
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Unidad 1: Números, operaciones y longitud',
            oa: [
              { codigo: 'OA 1', descripcion: 'Leer, escribir, comparar y ordenar números hasta 10.000, incluyendo el redondeo y la estimación de cantidades.', habilidades: ['números', 'redondeo', 'estimación', 'orden'] },
              { codigo: 'OA 2', descripcion: 'Resolver adiciones y sustracciones con reagrupamiento.', habilidades: ['adición', 'sustracción', 'reagrupamiento'] },
              { codigo: 'OA 3', descripcion: 'Medir y calcular longitudes (cm, m, km).', habilidades: ['medición', 'longitud', 'unidades'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Unidad 2: Multiplicación, división, medición y geometría',
            oa: [
              { codigo: 'OA 4', descripcion: 'Aplicar el algoritmo estándar de la multiplicación y división (con y sin resto).', habilidades: ['multiplicación', 'división', 'algoritmo'] },
              { codigo: 'OA 5', descripcion: 'Medir tiempo, calcular áreas de figuras (cm², m²) y medir ángulos con transportador.', habilidades: ['tiempo', 'área', 'ángulos'] },
              { codigo: 'OA 6', descripcion: 'Identificar patrones en tablas.', habilidades: ['patrones', 'tablas', 'regularidades'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Unidad 3: Fracciones, decimales, volumen y datos',
            oa: [
              { codigo: 'OA 7', descripcion: 'Representar, comparar y operar con fracciones de igual denominador y números decimales (hasta los décimos).', habilidades: ['fracciones', 'decimales', 'comparación'] },
              { codigo: 'OA 8', descripcion: 'Medir volumen (L, dL, mL, cm³) e identificar ejes de simetría.', habilidades: ['volumen', 'simetría', 'unidades'] },
              { codigo: 'OA 9', descripcion: 'Leer e interpretar diagramas de puntos.', habilidades: ['datos', 'encuestas', 'diagramas'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Unidad 4: Fracciones, ecuaciones, transformaciones isométricas y azar',
            oa: [
              { codigo: 'OA 10', descripcion: 'Operar con fracciones de igual denominador.', habilidades: ['fracciones', 'suma', 'resta'] },
              { codigo: 'OA 11', descripcion: 'Resolver ecuaciones e inecuaciones simples de un paso usando balanzas.', habilidades: ['ecuaciones', 'inecuaciones', 'balanzas'] },
              { codigo: 'OA 12', descripcion: 'Aplicar transformaciones isométricas (traslación, reflexión, rotación) y analizar probabilidades en experimentos aleatorios.', habilidades: ['transformaciones', 'isometría', 'azar', 'probabilidad'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Sumo Primero 4° Básico (Tomo 1 y 2)',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-4-Basico/Sumo_Primero_4B_T1_T2.pdf',
            actividades: [
              'Leer, escribir, comparar y ordenar números hasta 10.000, incluyendo el redondeo y la estimación de cantidades.',
              'Resolver adiciones y sustracciones con reagrupamiento, y aplicar el algoritmo estándar de la multiplicación y división (con y sin resto).',
              'Medir y calcular longitudes (cm, m, km), tiempo (horas, minutos, segundos), área de rectángulos y cuadrados (cm², m², km²) y volumen (L, dL, mL, cm³).',
              'Representar, comparar y operar (adición y sustracción) con fracciones de igual denominador y números decimales (hasta los décimos).',
              'Resolver ecuaciones e inecuaciones simples de un paso usando balanzas, e identificar patrones en tablas.',
              'Aplicar transformaciones isométricas (traslación, reflexión y rotación), medir ángulos con transportador e identificar las vistas de figuras 3D.',
              'Leer e interpretar diagramas de puntos y resultados de experimentos aleatorios (juegos de azar).',
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'La Tierra en movimiento',
            oa: [
              { codigo: 'OA 1', descripcion: 'Describir las capas internas de la Tierra y explicar los fenómenos naturales provocados por el movimiento de las placas tectónicas.', habilidades: ['capas', 'tierra', 'placas', 'tectónicas'] },
            ],
          },
          {
            numero: 2,
            titulo: 'La materia y las fuerzas',
            oa: [
              { codigo: 'OA 2', descripcion: 'Demostrar que la materia tiene masa y volumen, comparar los estados sólido, líquido y gaseoso, e identificar los efectos de las fuerzas.', habilidades: ['materia', 'masa', 'volumen', 'fuerzas'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Sistema locomotor y sistema nervioso',
            oa: [
              { codigo: 'OA 3', descripcion: 'Explicar el movimiento del cuerpo a través del sistema locomotor y comprender cómo el sistema nervioso reacciona a estímulos.', habilidades: ['locomotor', 'nervioso', 'huesos', 'músculos'] },
            ],
          },
          {
            numero: 4,
            titulo: '¿Cómo son los ecosistemas?',
            oa: [
              { codigo: 'OA 4', descripcion: 'Reconocer componentes bióticos y abióticos de diversos ecosistemas, describir adaptaciones e identificar cadenas alimentarias.', habilidades: ['ecosistemas', 'bióticos', 'abióticos', 'cadenas'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Ciencias Naturales 4° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Ciencias-Naturales-4-Basico/INGSA26E4B.pdf',
            actividades: [
              'Construir modelos para describir e identificar las capas de la Tierra (corteza, manto, núcleo) y explicar el movimiento de las placas tectónicas (sismos, tsunamis, volcanes).',
              'Medir la masa y el volumen de la materia, e investigar experimentalmente las características de los estados sólido, líquido y gaseoso (compresión y fluidez).',
              'Reconocer y demostrar los efectos de las fuerzas sobre la forma y el movimiento de los objetos mediante la experimentación.',
              'Identificar estructuras del sistema locomotor (huesos, músculos, articulaciones) y del sistema nervioso, explicando su función en el movimiento y en la respuesta a estímulos.',
              'Explorar ecosistemas chilenos, diferenciando factores bióticos y abióticos, y analizando las adaptaciones de plantas y animales junto con las cadenas alimentarias.',
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Paisajes y recursos naturales de América',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer la diversidad de paisajes (fríos, templados, áridos, tropicales, costeros y montañosos) y la distribución de recursos naturales en América.', habilidades: ['paisajes', 'recursos', 'desarrollo sostenible'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Las grandes civilizaciones americanas: mayas, aztecas e incas',
            oa: [
              { codigo: 'OA 2', descripcion: 'Describir y comparar las civilizaciones Maya, Azteca e Inca, analizando sus organizaciones políticas, sociales, económicas, logros tecnológicos y legados culturales.', habilidades: ['maya', 'azteca', 'inca', 'civilizaciones'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Legado y presente de las civilizaciones y los pueblos originarios de América',
            oa: [
              { codigo: 'OA 3', descripcion: 'Identificar la influencia de los pueblos originarios en la cultura actual y reconocer los desafíos y oportunidades que enfrentan en el presente.', habilidades: ['legado', 'cultura', 'presente'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Organización democrática, derechos y participación en Chile',
            oa: [
              { codigo: 'OA 4', descripcion: 'Comprender la organización democrática de Chile, el rol de las instituciones y autoridades, y la importancia de la participación ciudadana.', habilidades: ['democracia', 'instituciones', 'derechos', 'participación'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Historia, Geografía y Ciencias Sociales 4° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Historia-Geografia-y-Ciencias-Sociales-4-Basico/CNASA26E4B.pdf',
            actividades: [
              'Análisis de mapas y herramientas geográficas para localizar paisajes y recursos naturales en América.',
              'Investigación y comparación de las civilizaciones Maya, Azteca e Inca (política, sociedad, economía y tecnología).',
              'Elaboración de líneas de tiempo para comprender la cronología de las civilizaciones americanas.',
              'Análisis de fuentes históricas y primarias sobre el legado cultural y cotidiano de los pueblos originarios.',
              'Simulación de debates y procesos democráticos (elecciones escolares) para comprender la organización política de Chile.',
              'Desarrollo de proyectos grupales para investigar y exponer sobre el impacto de los recursos naturales y la importancia del desarrollo sostenible.',
            ],
          },
        ],
      },
      {
        nombre: 'Inglés',
        unidades: [
          {
            numero: 1,
            titulo: 'Around town',
            oa: [
              { codigo: 'OA 1', descripcion: 'Nombrar lugares de la ciudad y partes de la casa, describir actividades que las personas realizan en el hogar y comprender mapas básicos.', habilidades: ['lugares', 'ciudad', 'casa', 'mapas', 'actividades'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Around the world',
            oa: [
              { codigo: 'OA 2', descripcion: 'Nombrar países, nacionalidades y fechas de celebraciones importantes, y expresar planes a futuro.', habilidades: ['países', 'nacionalidades', 'celebraciones', 'planes'] },
            ],
          },
          {
            numero: 3,
            titulo: 'The universe',
            oa: [
              { codigo: 'OA 3', descripcion: 'Nombrar objetos del espacio y planetas del sistema solar, hablar sobre actividades diarias regulares y utilizar números hasta el mil.', habilidades: ['espacio', 'planetas', 'sistema solar', 'números'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Minibeasts',
            oa: [
              { codigo: 'OA 4', descripcion: 'Identificar, nombrar y describir física y espacialmente a los insectos y pequeños bichos, indicando dónde viven y cómo se mueven.', habilidades: ['insectos', 'bichos', 'hábitats', 'descripción'] },
            ],
          },
          {
            numero: 5,
            titulo: 'Summer camp',
            oa: [
              { codigo: 'OA 5', descripcion: 'Describir actividades recreativas de campamento, proponer planes al aire libre y seguir instrucciones de seguridad y cuidado de la naturaleza.', habilidades: ['campamento', 'actividades', 'seguridad', 'naturaleza'] },
            ],
          },
          {
            numero: 6,
            titulo: 'Story world',
            oa: [
              { codigo: 'OA 6', descripcion: 'Describir la apariencia física y los rasgos de personalidad de personajes de historias, y explicar las acciones que realizan en el momento (Presente Continuo).', habilidades: ['personajes', 'apariencia', 'personalidad', 'presente continuo'] },
            ],
          },
        ],
        textos: [
          {
            titulo: "English 4th Grade Student's Book",
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-4-Basico/INGSA26E4B.pdf',
            actividades: [
              'Juego de roles y diálogos interactivos sobre lugares de la ciudad, partes del hogar y nacionalidades.',
              'Uso de cuadrículas (grid maps) para localizar y dar direcciones de lugares públicos.',
              'Descripción de las rutinas de los astronautas, datos curiosos sobre el Sistema Solar y lectura de hechos sobre la Luna.',
              'Investigación, clasificación y descripción física de pequeños insectos (minibeasts) y sus respectivos hábitats.',
              'Planificación de un campamento de verano, identificando actividades al aire libre (rafting, hiking, zip-lining) y reglas de seguridad.',
              'Creación y descripción de la apariencia física y personalidad de superhéroes y personajes de cuentos.',
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 5° BÁSICO — Segundo Ciclo (datos completos)
  // ========================================================================
  {
    nombre: '5° Básico',
    asignaturas: [
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'La unión hace la fuerza',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reflexionar sobre el trabajo en equipo, la igualdad de género y el deporte a través de la lectura de novelas y artículos.', habilidades: ['trabajo en equipo', 'igualdad', 'deporte', 'personajes'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Emociones que sanan',
            oa: [
              { codigo: 'OA 2', descripcion: 'Explorar emociones y sentimientos en la poesía y narraciones, interpretando lenguaje figurado y comparando textos.', habilidades: ['emociones', 'poesía', 'lenguaje figurado', 'resiliencia'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Coexistir en armonía',
            oa: [
              { codigo: 'OA 3', descripcion: 'Analizar la relación entre el ser humano y el medioambiente mediante poemas, cómics y noticias, valorando la memoria histórica.', habilidades: ['medioambiente', 'memoria', 'cultura', 'pueblos originarios'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Un mundo en movimiento',
            oa: [
              { codigo: 'OA 4', descripcion: 'Investigar sobre migraciones y viajes como procesos de aprendizaje, analizando narrativas sobre cambios y nuevos comienzos.', habilidades: ['migraciones', 'viajes', 'aprendizaje', 'cambios'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Lenguaje y Comunicación 5° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lenguaje-y-Comunicacion-5-Basico/LYCSM26E5B_compressed.pdf',
            actividades: [
              'Lectura y análisis de textos narrativos (novelas, cuentos, leyendas) para reflexionar sobre valores como el trabajo en equipo y la resiliencia.',
              'Análisis de artículos informativos y reportajes relacionados con la crisis climática y la diversidad cultural.',
              'Estrategias de comprensión: inferir significados a partir del contexto, determinar consecuencias de acciones y reconocer lenguaje figurado.',
              'Producción de textos escritos: artículos informativos sobre deportes, leyendas locales y cómics.',
              'Expresión oral: participación en debates sobre igualdad de género y medioambiente.',
              'Análisis de recursos gráficos y su relación con el texto (infografías, cómics, imágenes).',
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Números naturales, operaciones y patrones',
            oa: [
              { codigo: 'OA 1', descripcion: 'Leer, escribir y ordenar números hasta 100 millones, resolver operaciones combinadas, aplicar propiedades de las operaciones y modelar situaciones con patrones y ecuaciones.', habilidades: ['números', 'operaciones', 'propiedades', 'patrones'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Multiplicación, división, fracciones y decimales',
            oa: [
              { codigo: 'OA 2', descripcion: 'Realizar divisiones por números de dos dígitos, resolver problemas con fracciones (igual y distinto denominador) y comparar/operar números decimales.', habilidades: ['división', 'fracciones', 'decimales', 'problemas'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Geometría: Ángulos, área y volumen',
            oa: [
              { codigo: 'OA 3', descripcion: 'Construir y medir ángulos, calcular áreas de triángulos y cuadriláteros, y relacionar el volumen de cubos y paralelepípedos con sus dimensiones.', habilidades: ['ángulos', 'área', 'volumen', 'geometría'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Estadística, probabilidad y transformaciones',
            oa: [
              { codigo: 'OA 4', descripcion: 'Analizar datos en gráficos de línea y doble barra, describir la probabilidad de eventos y aplicar traslaciones, reflexiones y rotaciones en el plano cartesiano.', habilidades: ['estadística', 'probabilidad', 'transformaciones', 'gráficos'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Sumo Primero 5° Básico (Tomos 1 y 2)',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-5-Basico/MATME26E5B_1.pdf',
            actividades: [
              'Resolución de operaciones combinadas con números naturales y aplicación de propiedades (conmutativa, asociativa, distributiva).',
              'Cálculo de múltiplos, divisores, números primos y compuestos, y resolución de problemas de MCM y MCD.',
              'Operaciones con fracciones (adición, sustracción, amplificación y simplificación) y su representación gráfica.',
              'Comparación, ordenamiento y operaciones con números decimales hasta la milésima.',
              'Cálculo de áreas de triángulos, paralelógramos y trapecios, y uso de escalas en planos.',
              'Interpretación de tablas y gráficos de línea y doble barra para analizar tendencias y datos.',
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'El agua en el planeta',
            oa: [
              { codigo: 'OA 1', descripcion: 'Describir la distribución del agua en la Tierra, comprender el ciclo hidrológico y proponer medidas de protección y uso responsable de las reservas hídricas.', habilidades: ['agua', 'ciclo', 'hidrológico', 'protección'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Seres vivos y alimentación',
            oa: [
              { codigo: 'OA 2', descripcion: 'Comprender la organización de los seres vivos a partir de la célula, su estructura y funciones, relacionándolas con la nutrición y el aporte energético de los alimentos.', habilidades: ['célula', 'organización', 'nutrición', 'alimentos'] },
            ],
          },
          {
            numero: 3,
            titulo: '¿Cómo prevenir enfermedades?',
            oa: [
              { codigo: 'OA 3', descripcion: 'Analizar los efectos del consumo de tabaco, reconocer el rol de los microorganismos en la salud y promover medidas de higiene y prevención.', habilidades: ['tabaco', 'microorganismos', 'higiene', 'prevención'] },
            ],
          },
          {
            numero: 4,
            titulo: 'La electricidad en nuestra vida',
            oa: [
              { codigo: 'OA 4', descripcion: 'Explicar el funcionamiento de circuitos eléctricos simples, identificar materiales conductores y aislantes, y promover el uso eficiente y seguro de la energía.', habilidades: ['electricidad', 'circuitos', 'conductores', 'aislantes'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Ciencias Naturales 5° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Ciencias-Naturales-5-Basico/CNASA26E5B.pdf',
            actividades: [
              'Investigación sobre la distribución del agua en la Tierra (ciclo hidrológico y reservas).',
              'Experimentación sobre las características de los seres vivos y niveles de organización biológica (célula, tejido, órgano, sistema, organismo).',
              'Análisis del impacto de las actividades humanas en el medio ambiente y los recursos hídricos.',
              'Diseño y ejecución de investigaciones experimentales sobre nutrición y salud (tabaquismo, microorganismos, desinfectantes).',
              'Construcción y análisis de circuitos eléctricos, distinguiendo entre materiales conductores y aislantes.',
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Chile: un país diverso',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer las zonas naturales de Chile, describiendo sus paisajes, clima, recursos naturales y los riesgos de desastres naturales.', habilidades: ['zonas', 'paisajes', 'clima', 'recursos'] },
            ],
          },
          {
            numero: 2,
            titulo: 'El encuentro de dos mundos',
            oa: [
              { codigo: 'OA 2', descripcion: 'Analizar el proceso de descubrimiento y conquista de América y Chile, valorando las diferentes perspectivas y el impacto cultural.', habilidades: ['descubrimiento', 'conquista', 'cultura', 'perspectivas'] },
            ],
          },
          {
            numero: 3,
            titulo: 'La Colonia en América y Chile',
            oa: [
              { codigo: 'OA 3', descripcion: 'Comprender la organización política, económica y social durante la Colonia, destacando el rol de la Iglesia y el mestizaje cultural.', habilidades: ['colonia', 'organización', 'mestizaje', 'iglesia'] },
            ],
          },
          {
            numero: 4,
            titulo: 'La construcción de la identidad nacional',
            oa: [
              { codigo: 'OA 4', descripcion: 'Identificar los procesos y actores clave que llevaron a la independencia y la formación del Estado-nación en Chile.', habilidades: ['independencia', 'identidad', 'derechos', 'ciudadanos'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Historia, Geografía y Ciencias Sociales 5° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Historia-Geografia-y-Ciencias-Sociales-5-Basico/HISSM26E5B_compressed.pdf',
            actividades: [
              'Análisis de mapas físicos y políticos de Chile, identificando zonas naturales y su diversidad de paisajes y recursos.',
              'Investigación sobre el proceso de descubrimiento y conquista de América y Chile.',
              'Análisis de fuentes históricas (documentos, imágenes y crónicas) sobre el impacto del encuentro entre dos mundos.',
              'Comprensión de la organización política y social de la Colonia en Chile y América.',
              'Debates y reflexión sobre la construcción de la identidad nacional, el mestizaje y los derechos ciudadanos.',
            ],
          },
        ],
      },
      {
        nombre: 'Inglés',
        unidades: [
          {
            numero: 1,
            titulo: 'Traveling',
            oa: [
              { codigo: 'OA 1', descripcion: 'Comunicar preferencias sobre destinos turísticos, usar medios de transporte y redactar descripciones de ciudades mediante correos electrónicos.', habilidades: ['viajes', 'transporte', 'ciudades', 'correos'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Cultures and traditions',
            oa: [
              { codigo: 'OA 2', descripcion: 'Describir tradiciones culturales y gastronomía de distintos países, utilizando adjetivos comparativos y reconociendo la diversidad global.', habilidades: ['cultura', 'tradiciones', 'comparativos', 'diversidad'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Languages',
            oa: [
              { codigo: 'OA 3', descripcion: 'Expresar habilidades lingüísticas, investigar sobre la importancia de las lenguas nativas y comprender sistemas de comunicación inclusiva.', habilidades: ['lenguas', 'habilidades', 'comunicación', 'inclusiva'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Jobs',
            oa: [
              { codigo: 'OA 4', descripcion: 'Hablar sobre oficios y ocupaciones, describir rutinas diarias, decir la hora y reflexionar sobre la importancia de las profesiones para el futuro.', habilidades: ['ocupaciones', 'rutinas', 'hora', 'profesiones'] },
            ],
          },
        ],
        textos: [
          {
            titulo: "Student's Book English 5th Grade",
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-5-Basico/INGSA26E5B.pdf',
            actividades: [
              'Desarrollo de habilidades comunicativas para hablar sobre viajes, cultura y ocupaciones.',
              'Práctica de comprensión lectora (escaneo y skimming) en folletos, artículos informativos y cómics.',
              'Producción de textos: correos electrónicos, descripciones de personas, artículos informativos y poemas (haikus).',
              'Uso de gramática contextualizada: adjetivos comparativos y superlativos, adverbios de modo/tiempo/lugar y concordancia sujeto-verbo.',
              'Pronunciación y fonética enfocada en sonidos específicos (/eɪ/, /i:/, /ɜː/).',
              'Integración interdisciplinaria: uso de gráficos matemáticos y reflexiones ambientales (Think Green).',
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 6° BÁSICO — Segundo Ciclo (datos completos)
  // ========================================================================
  {
    nombre: '6° Básico',
    asignaturas: [
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Operaciones, fracciones y razones',
            oa: [
              { codigo: 'OA 1', descripcion: 'Demostrar que comprenden los factores y múltiplos determinando los mínimos comunes múltiplos.', habilidades: ['factores', 'múltiplos', 'mcm'] },
              { codigo: 'OA 3', descripcion: 'Demostrar que comprenden el concepto de razón de manera concreta, pictórica y simbólica.', habilidades: ['razón', 'concreto', 'pictórico', 'simbólico'] },
              { codigo: 'OA 8', descripcion: 'Resolver problemas rutinarios y no rutinarios que involucren adiciones y sustracciones de fracciones.', habilidades: ['adición', 'sustracción', 'fracciones', 'resolución de problemas'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Fracciones, números mixtos y razones',
            oa: [
              { codigo: 'OA 9', descripcion: 'Operar con fracciones y números mixtos, comprendiendo su equivalencia con números decimales y aplicando razones para comparar magnitudes.', habilidades: ['fracciones', 'mixtos', 'decimales', 'razones'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Porcentajes, datos y álgebra',
            oa: [
              { codigo: 'OA 10', descripcion: 'Analizar situaciones mediante el uso de porcentajes, expresiones algebraicas, ecuaciones simples y la interpretación de gráficos estadísticos.', habilidades: ['porcentajes', 'álgebra', 'ecuaciones', 'gráficos'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Sumo Primero 6° Básico Tomo 2',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-6-Basico/MATME26E6B_1.pdf',
            actividades: [
              'Resolución de problemas de adición y sustracción con fracciones y números mixtos.',
              'Operaciones combinadas con números decimales y fracciones.',
              'Modelamiento de patrones y resolución de ecuaciones de primer grado.',
              'Comparación de cantidades mediante el concepto de razón y cálculo de densidad.',
              'Representación y análisis de datos en gráficos de barras dobles y circulares.',
            ],
          },
        ],
      },
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'El poder de la aventura, la imaginación y la creatividad',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar narraciones para identificar acciones principales, ambientes y costumbres, promoviendo el gusto por la lectura.', habilidades: ['narraciones', 'acciones', 'ambientes', 'costumbres'] },
            ],
          },
          {
            numero: 2,
            titulo: 'El medioambiente y su protección',
            oa: [
              { codigo: 'OA 2', descripcion: 'Comprender la importancia del cuidado ambiental a través de poemas y textos informativos, interpretando lenguaje figurado.', habilidades: ['medioambiente', 'poemas', 'informativo', 'lenguaje figurado'] },
            ],
          },
          {
            numero: 3,
            titulo: 'El ser humano y su vínculo con el cosmos',
            oa: [
              { codigo: 'OA 3', descripcion: 'Reflexionar sobre la relación del ser humano con el universo, analizando textos literarios y científicos.', habilidades: ['cosmos', 'universo', 'literario', 'científico'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Respetar las diferencias y la igualdad de derechos',
            oa: [
              { codigo: 'OA 4', descripcion: 'Valorar la diversidad y los derechos humanos a partir del análisis de textos narrativos y biográficos.', habilidades: ['diversidad', 'derechos', 'biográficos', 'igualdad'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Lenguaje y Comunicación 6° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lenguaje-y-Comunicacion-6-Basico/LYCSM26E6B_3.pdf',
            actividades: [
              'Lectura y análisis de textos narrativos, poéticos e informativos.',
              'Identificación de acciones principales y caracterización de personajes en relatos.',
              'Producción de artículos informativos y relatos de experiencias personales.',
              'Interpretación de figuras literarias y lenguaje figurado.',
              'Exposición oral sobre temáticas de medioambiente y pueblos originarios.',
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Reproducción y pubertad',
            oa: [
              { codigo: 'OA 1', descripcion: 'Describir los sistemas reproductores y los cambios asociados a la pubertad, promoviendo el cuidado del cuerpo y la higiene personal.', habilidades: ['reproducción', 'pubertad', 'cuidado', 'higiene'] },
            ],
          },
          {
            numero: 2,
            titulo: 'La Tierra y los seres vivos',
            oa: [
              { codigo: 'OA 2', descripcion: 'Caracterizar las capas externas de la Tierra, la importancia de la fotosíntesis y las interacciones alimentarias en los ecosistemas.', habilidades: ['tierra', 'fotosíntesis', 'ecosistemas', 'tramas tróficas'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Energía y recursos energéticos',
            oa: [
              { codigo: 'OA 3', descripcion: 'Explicar la energía y sus manifestaciones, distinguiendo entre recursos energéticos renovables y no renovables.', habilidades: ['energía', 'renovables', 'no renovables', 'recursos'] },
            ],
          },
          {
            numero: 4,
            titulo: 'La materia que nos rodea',
            oa: [
              { codigo: 'OA 4', descripcion: 'Describir el comportamiento de las partículas en los estados de la materia y los cambios de estado presentes en el entorno.', habilidades: ['materia', 'partículas', 'estados', 'cambios'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Ciencias Naturales 6° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Ciencias-Naturales-6-Basico/CNASA26E6B_3.pdf',
            actividades: [
              'Identificación de estructuras y funciones de los sistemas reproductores humanos.',
              'Análisis de cambios físicos y sicológicos durante la pubertad y autocuidado.',
              'Descripción de las capas de la Tierra (atmósfera, litósfera, hidrósfera) y fenómenos de erosión.',
              'Análisis de redes y tramas tróficas en ecosistemas chilenos y el impacto humano.',
              'Investigación sobre la fotosíntesis y el uso eficiente de recursos energéticos.',
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Organización política y derechos fundamentales en Chile',
            oa: [
              { codigo: 'OA 1', descripcion: 'Comprender la organización democrática del país, el rol de la Constitución, los poderes del Estado y la importancia de respetar los derechos fundamentales.', habilidades: ['organización', 'constitución', 'poderes', 'derechos'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Chile en el siglo XIX: Independencia, República y territorio',
            oa: [
              { codigo: 'OA 2', descripcion: 'Analizar el proceso de independencia de Hispanoamérica y Chile, la consolidación del orden republicano y la ocupación del territorio nacional.', habilidades: ['independencia', 'república', 'territorio', 'consolidación'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Chile en el siglo XX: democracia, dictadura y transición',
            oa: [
              { codigo: 'OA 3', descripcion: 'Caracterizar el desarrollo político y social del siglo XX en Chile, evaluando los procesos de democratización, el quiebre institucional y la dictadura.', habilidades: ['siglo XX', 'democracia', 'dictadura', 'derechos humanos'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Ambientes naturales y regiones de Chile',
            oa: [
              { codigo: 'OA 4', descripcion: 'Identificar y describir la diversidad de ambientes naturales del país y su división político-administrativa regional.', habilidades: ['ambientes', 'regiones', 'división', 'demográfica'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Historia, Geografía y Ciencias Sociales 6° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Historia-Geografia-y-Ciencias-Sociales-6-Basico/HISSM26E6B_compressed.pdf',
            actividades: [
              'Análisis del sistema político chileno, la Constitución y los poderes del Estado mediante esquemas y estudios de caso.',
              'Formulación de preguntas, debates y expresión de opiniones fundamentadas sobre derechos humanos y participación ciudadana.',
              'Uso de líneas de tiempo y periodizaciones para comprender la independencia, la organización de la república (siglo XIX) y la historia del siglo XX.',
              'Contraste y análisis de múltiples fuentes históricas (primarias y secundarias) para comprender la multicausalidad de hitos como el quiebre de la democracia.',
              'Análisis espacial utilizando mapas, cartografía y climogramas para identificar los ambientes naturales y las regiones de Chile.',
              'Desarrollo de proyectos grupales orientados a proponer soluciones para problemáticas territoriales y medioambientales locales.',
            ],
          },
        ],
      },
      {
        nombre: 'Inglés',
        unidades: [
          {
            numero: 1,
            titulo: 'Artistic inspirations',
            oa: [
              { codigo: 'OA 1', descripcion: 'Explorar y describir expresiones artísticas, expresando preferencias personales y practicando habilidades de comunicación oral y escrita.', habilidades: ['arte', 'pintura', 'escultura', 'teatro'] },
            ],
          },
          {
            numero: 2,
            titulo: 'World festivals',
            oa: [
              { codigo: 'OA 2', descripcion: 'Identificar y describir festividades chilenas y celebraciones mundiales, utilizando tiempos verbales del pasado.', habilidades: ['festividades', 'cultura', 'pasado', 'celebraciones'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Climate action',
            oa: [
              { codigo: 'OA 3', descripcion: 'Describir problemas ambientales, proponer acciones de cuidado para el planeta y expresar obligaciones para contribuir a la sostenibilidad.', habilidades: ['medioambiente', 'sostenibilidad', 'acciones', 'planeta'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Foreign friends',
            oa: [
              { codigo: 'OA 4', descripcion: 'Analizar y describir costumbres culturales de diferentes países, fomentando la empatía, el respeto por la diversidad y la comunicación intercultural.', habilidades: ['costumbres', 'diversidad', 'empatía', 'intercultural'] },
            ],
          },
        ],
        textos: [
          {
            titulo: "Student's Book English 6th Grade",
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-6-Basico/INGSA26E6B_2.pdf',
            actividades: [
              'Identificación y descripción de diversas expresiones artísticas como pintura, escultura, teatro y alfarería.',
              'Expresión de gustos, preferencias y opiniones sobre el arte.',
              'Lectura y análisis de textos literarios (como The Picture of Dorian Gray).',
              'Investigación sobre festividades tradicionales chilenas y del mundo.',
              'Producción de textos escritos (correos electrónicos y entradas de blog) sobre experiencias personales y eventos.',
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 7° BÁSICO — Segundo Ciclo
  // ========================================================================
  {
    nombre: '7° Básico',
    asignaturas: [
      {
        nombre: 'Lengua y Literatura',
        unidades: [
          {
            numero: 1,
            titulo: '¿Qué me hace sentir bien?',
            oa: [
              { codigo: 'OA 1', descripcion: 'Interpretar y reflexionar sobre obras literarias conectadas al autoconocimiento, además de analizar y producir reportajes informativos empleando estrategias de lectura.', habilidades: ['interpretación', 'autoconocimiento', 'reportajes', 'estrategias'] },
            ],
          },
          {
            numero: 2,
            titulo: '¿Cómo construimos comunidad?',
            oa: [
              { codigo: 'OA 2', descripcion: 'Fomentar el respeto por la diversidad comunitaria y los derechos ciudadanos mediante la interpretación de visiones de mundo en relatos orales y textos argumentativos.', habilidades: ['diversidad', 'derechos', 'oralidad', 'argumentación'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Somos naturaleza',
            oa: [
              { codigo: 'OA 3', descripcion: 'Apreciar la vinculación entre el ser humano y el entorno natural interpretando textos de ciencia ficción, relatos originarios y la redacción de cartas de temática ecológica.', habilidades: ['ciencia ficción', 'relatos originarios', 'cartas', 'ecología'] },
            ],
          },
          {
            numero: 4,
            titulo: '¿Qué nos cuenta el mundo?',
            oa: [
              { codigo: 'OA 4', descripcion: 'Desarrollar un pensamiento crítico frente a las representaciones sociales de los medios informativos, así como leer romances y crónicas que retratan historias del pasado.', habilidades: ['pensamiento crítico', 'medios', 'romances', 'crónicas'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Lengua y Literatura 7° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-y-Literatura-7-Basico/LYLSA26E7B.pdf',
            actividades: [
              'Análisis del relato narrativo, reconociendo al narrador, la estructura del conflicto y la evolución de los personajes.',
              'Lectura crítica de textos en medios de comunicación (reportajes y noticias) para deducir propósitos implícitos.',
              'Composición de textos literarios e informativos, incluyendo la redacción argumentativa de cartas al director.',
              'Interpretación de poemas e identificación de elementos del lenguaje poético como rima, musicalidad e imágenes lúdicas.',
              'Investigación sobre el contexto literario y la cosmovisión para vincular las obras con autores o pueblos originarios.',
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Números',
            oa: [
              { codigo: 'OA 1', descripcion: 'Demostrar dominio en la adición y sustracción de números enteros positivos y negativos, multiplicar decimales, dividir fracciones y representar porcentajes en escenarios de la vida real.', habilidades: ['enteros', 'decimales', 'fracciones', 'porcentajes'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Álgebra y funciones',
            oa: [
              { codigo: 'OA 2', descripcion: 'Transformar situaciones al lenguaje algebraico elemental, e interpretar y evaluar problemas cotidianos aplicando relaciones de proporcionalidad directa e inversa.', habilidades: ['álgebra', 'proporcionalidad', 'variables', 'ecuaciones'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Geometría',
            oa: [
              { codigo: 'OA 3', descripcion: 'Reconocer coordenadas de figuras e identificar vectores en el plano cartesiano, así como deducir fórmulas para calcular el área y perímetro de la circunferencia.', habilidades: ['coordenadas', 'vectores', 'plano cartesiano', 'circunferencia'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Probabilidad y estadística',
            oa: [
              { codigo: 'OA 4', descripcion: 'Interpretar información estadística separando muestras y poblaciones, construir tablas de frecuencias relativas/absolutas y calcular la probabilidad de ocurrencia de un experimento aleatorio.', habilidades: ['estadística', 'muestras', 'frecuencias', 'probabilidad'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Matemática 7° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-7-Basico/MATSM26E7B.pdf',
            actividades: [
              'Resolución de problemas con operaciones combinadas de números enteros (Z) utilizando la recta numérica.',
              'Multiplicación y división de decimales y fracciones, además del cálculo de proporciones y porcentajes.',
              'Traducción a lenguaje algebraico y modelamiento de ecuaciones con variables dependientes e independientes.',
              'Identificación de proporciones directas e inversas y deducción del valor de la constante de proporcionalidad.',
              'Uso del plano cartesiano, cálculo de área y perímetro de figuras poligonales circulares y organización estadística.',
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'La materia en nuestras vidas',
            oa: [
              { codigo: 'OA 1', descripcion: 'Clasificar los componentes de la materia en sustancias puras y mezclas, y comprender el comportamiento, las propiedades y las leyes que rigen a los gases.', habilidades: ['materia', 'sustancias', 'mezclas', 'gases'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Las fuerzas y la Tierra',
            oa: [
              { codigo: 'OA 2', descripcion: 'Analizar el efecto de diferentes tipos de fuerzas mecánicas sobre los cuerpos e identificar los procesos geológicos que modelan la litósfera por el movimiento de placas tectónicas.', habilidades: ['fuerzas', 'placas tectónicas', 'geología', 'litósfera'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Microorganismos y barreras de defensa',
            oa: [
              { codigo: 'OA 3', descripcion: 'Describir el rol perjudicial y benéfico de virus, bacterias y hongos, e identificar cómo reaccionan las barreras del sistema inmunológico para combatir infecciones.', habilidades: ['virus', 'bacterias', 'sistema inmunológico', 'infecciones'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Sexualidad y autocuidado',
            oa: [
              { codigo: 'OA 4', descripcion: 'Fomentar el respeto, reconocer de forma íntegra las distintas dimensiones de la sexualidad humana, la formación de gametos y promover medidas preventivas de salud e higiene.', habilidades: ['sexualidad', 'gametos', 'prevención', 'higiene'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Ciencias Naturales 7° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Ciencias-Naturales-7-Basico/CNASM26E7B_compressed.pdf',
            actividades: [
              'Diferenciación entre sustancias puras y mezclas, aplicando métodos físicos de separación y disolución.',
              'Análisis del estado gaseoso mediante el modelo cinético-molecular y las leyes de los gases.',
              'Estudio de las fuerzas mecánicas, interacción tectónica de placas y el efecto del cambio climático.',
              'Investigación sobre características de microorganismos, virus y los mecanismos del sistema inmunológico.',
              'Comprensión de los aspectos biológicos, afectivos y sociales de la sexualidad humana y el autocuidado.',
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: '¿Cómo cambió la vida de los seres humanos desde sus orígenes hasta las primeras civilizaciones?',
            oa: [
              { codigo: 'OA 1', descripcion: 'Comprender el proceso evolutivo de hominización, los cambios de adaptación al entorno durante el periodo Neolítico y la formación y legado de las civilizaciones antiguas.', habilidades: ['hominización', 'Neolítico', 'civilizaciones', 'legado'] },
            ],
          },
          {
            numero: 2,
            titulo: '¿En qué ámbitos de las sociedades actuales se aprecia la influencia de las civilizaciones clásicas?',
            oa: [
              { codigo: 'OA 2', descripcion: 'Estudiar el entorno geográfico del mar Mediterráneo, analizar el sistema de la democracia ateniense y el desarrollo político del Imperio romano.', habilidades: ['Mediterráneo', 'democracia', 'Imperio romano', 'política'] },
            ],
          },
          {
            numero: 3,
            titulo: '¿Cuáles fueron los principales procesos que dieron origen a la civilización europea occidental?',
            oa: [
              { codigo: 'OA 3', descripcion: 'Analizar la fragmentación política de Europa, el surgimiento del vasallaje y feudalismo, el rol de la Iglesia católica y la coexistencia con el Imperio bizantino y el mundo islámico.', habilidades: ['feudalismo', 'vasallaje', 'Iglesia', 'Imperio bizantino'] },
            ],
          },
          {
            numero: 4,
            titulo: '¿De qué modos se manifiesta hoy la herencia de las grandes civilizaciones americanas?',
            oa: [
              { codigo: 'OA 4', descripcion: 'Evaluar el desarrollo agrícola, la estratificación social, la cosmovisión religiosa y el legado de técnicas y arquitectura de los mayas, aztecas e incas en el presente.', habilidades: ['mayas', 'aztecas', 'incas', 'legado'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Historia, Geografía y Ciencias Sociales 7° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Historia-Geografia-y-Ciencias-Sociales-7-Basico/HISSM20E7B.pdf',
            actividades: [
              'Análisis del proceso de hominización y expansión del Homo sapiens por el mundo.',
              'Reconocimiento de las características del Neolítico y el desarrollo de las primeras civilizaciones.',
              'Estudio de las instituciones de Grecia clásica y de la República y el Imperio romano.',
              'Comprensión de los procesos de la civilización europea occidental durante la Edad Media.',
              'Estudio detallado del territorio, economía, ritualidad y legado de las civilizaciones maya, azteca e inca.',
            ],
          },
        ],
      },
      {
        nombre: 'Inglés',
        unidades: [
          {
            numero: 1,
            titulo: 'Feelings and opinions',
            oa: [
              { codigo: 'OA 1', descripcion: 'Expresar estados de ánimo, utilizar vocabulario descriptivo del aspecto físico y comprender historias cortas relacionadas con el desarrollo emocional de las personas.', habilidades: ['feelings', 'vocabulary', 'emotions', 'descriptions'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Healthy habits',
            oa: [
              { codigo: 'OA 2', descripcion: 'Incorporar vocabulario sobre diferentes dietas, nutrientes y rutinas de bienestar para distinguir comportamientos y tendencias propicios para un estilo de vida saludable.', habilidades: ['diet', 'nutrients', 'wellness', 'habits'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Sports and free-time activities',
            oa: [
              { codigo: 'OA 3', descripcion: 'Hablar e intercambiar opiniones acerca de los diferentes tipos de pasatiempos, competencias y destrezas físicas destacando logros deportivos.', habilidades: ['sports', 'hobbies', 'competitions', 'skills'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Green issues',
            oa: [
              { codigo: 'OA 4', descripcion: 'Generar conciencia cívica sobre la conservación del ecosistema mediante el vocabulario del reciclaje, ecología y prevención de daños medioambientales.', habilidades: ['recycling', 'ecology', 'environment', 'conservation'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'English 7th Grade',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-7-Basico/INGCC26E7B.pdf',
            actividades: [
              'Expresión de sentimientos y descripciones de características físicas y de personalidad.',
              'Desarrollo de habilidades de comprensión para narrar experiencias y relatar un diario de vida.',
              'Identificación de hábitos saludables, comida, nutrición y beneficios del bienestar físico y mental.',
              'Descripción de rutinas, deportes, actividades de tiempo libre e intereses recreativos personales.',
              'Discusión y sensibilización sobre la ecología, el reciclaje y las problemáticas de contaminación ambiental.',
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 8° BÁSICO — Segundo Ciclo
  // ========================================================================
  {
    nombre: '8° Básico',
    asignaturas: [
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'Comprensión y producción de textos',
            oa: [
              { codigo: 'OA 1', descripcion: 'Leer y comprender textos literarios y no literarios.', habilidades: ['géneros literarios', 'inferencia', 'estructura', 'opinión fundamentada'] },
              { codigo: 'OA 2', descripcion: 'Escribir textos de distintos géneros con intención comunicativa.', habilidades: ['géneros', 'estructura', 'convenciones ortográficas'] },
              { codigo: 'OA 3', descripcion: 'Analizar críticamente textos de los medios de comunicación.', habilidades: ['medios', 'hechos', 'opiniones', 'fuentes'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Números',
            oa: [
              { codigo: 'OA 1', descripcion: 'Operar con números enteros y racionales, y comprender el cálculo de potencias, raíces cuadradas y variaciones porcentuales aplicadas a situaciones de la vida cotidiana.', habilidades: ['enteros', 'racionales', 'potencias', 'raíces', 'porcentajes'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Álgebra y funciones',
            oa: [
              { codigo: 'OA 2', descripcion: 'Reducir expresiones algebraicas, resolver ecuaciones e inecuaciones, y modelar situaciones matemáticas identificando y graficando funciones lineales y afines.', habilidades: ['álgebra', 'ecuaciones', 'inecuaciones', 'funciones lineales', 'funciones afines'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Geometría',
            oa: [
              { codigo: 'OA 3', descripcion: 'Aplicar el Teorema de Pitágoras, efectuar transformaciones isométricas en figuras y calcular el área y el volumen de prismas rectos y cilindros.', habilidades: ['Pitágoras', 'transformaciones', 'isométricas', 'prismas', 'cilindros'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Probabilidad y estadística',
            oa: [
              { codigo: 'OA 4', descripcion: 'Analizar información a través de representaciones gráficas y medidas de posición estadística, y calcular la probabilidad de eventos aplicando el principio multiplicativo.', habilidades: ['gráficos', 'medidas de posición', 'probabilidad', 'principio multiplicativo'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Matemática 8° Básico',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-8-Basico/MATSA26E8B.pdf',
            actividades: [
              'Cálculo de multiplicaciones y divisiones con números enteros y racionales, además de potencias, raíces cuadradas y porcentajes.',
              'Uso de lenguaje algebraico para operar expresiones, plantear y resolver ecuaciones e inecuaciones.',
              'Comprensión y modelamiento de funciones lineales y afines mediante sus diferentes representaciones gráficas y algebraicas.',
              'Aplicación del teorema de Pitágoras, desarrollo de transformaciones isométricas en el plano y cálculo de volumen en cuerpos geométricos.',
              'Construcción e interpretación de gráficos, uso de medidas de posición y cálculo de probabilidades mediante el principio multiplicativo.',
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'La célula',
            oa: [
              { codigo: 'OA 1', descripcion: 'Explicar el papel central de la célula como unidad básica de los seres vivos.', habilidades: ['célula', 'organelas', 'animal', 'vegetal'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Estado Nacional y democracia',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar el proceso de formación del Estado Nacional chileno.', habilidades: ['Estado Nacional', 'independencia', 'Guerra del Pacífico'] },
              { codigo: 'OA 2', descripcion: 'Analizar el quiebre de la democracia en Chile en la década de 1970.', habilidades: ['golpe de Estado', 'dictadura', 'interpretaciones'] },
            ],
          },
        ],
      },
      {
        nombre: 'Inglés',
        unidades: [
          {
            numero: 1,
            titulo: 'Information and Communication Technology',
            oa: [
              { codigo: 'OA 1', descripcion: 'Comprender textos orales y escritos, y dialogar sobre el impacto de las tecnologías de la información y la comunicación (TIC) en la vida diaria, utilizando el proceso de escritura para elaborar textos pertinentes.', habilidades: ['TIC', 'comprensión', 'dialogar', 'proceso de escritura'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Countries, Cultures and Customs',
            oa: [
              { codigo: 'OA 2', descripcion: 'Leer y escuchar diversos textos para presentar y debatir sobre características geográficas, lugares históricos y personajes relevantes de diversas culturas, fomentando el respeto intercultural.', habilidades: ['geografía', 'culturas', 'debate', 'intercultural'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Going Places',
            oa: [
              { codigo: 'OA 3', descripcion: 'Extraer información de relatos e instrucciones para conversar sobre lugares y la vida cotidiana, mostrando interés por el aprendizaje continuo y valorando las contribuciones de otras culturas.', habilidades: ['relatos', 'instrucciones', 'lugares', 'vida cotidiana'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Future Matters',
            oa: [
              { codigo: 'OA 4', descripcion: 'Demostrar comprensión de predicciones, problemas futuros y soluciones ecológicas, trabajando de manera colaborativa para promover el cuidado y el uso eficiente de los recursos naturales.', habilidades: ['predicciones', 'ecología', 'colaboración', 'recursos'] },
            ],
          },
        ],
        textos: [
          {
            titulo: "English 8th Grade Student's Book",
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-8-Basico/INGBC26E8B.pdf',
            actividades: [
              'Desarrollo de comprensión auditiva y lectora sobre tecnologías de la información, multiculturalidad y temas medioambientales.',
              'Expresión oral mediante discusiones y presentaciones sobre el impacto de las TIC, el turismo y el cambio climático.',
              'Producción escrita de correos electrónicos, infografías y folletos siguiendo un proceso estructurado.',
              'Valoración de la diversidad cultural y reflexión activa sobre el respeto, la tolerancia y el cuidado del medio ambiente.',
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 1° MEDIO — Enseñanza Media
  // ========================================================================
  {
    nombre: '1° Medio',
    asignaturas: [
      {
        nombre: 'Lengua y Literatura',
        unidades: [
          {
            numero: 1,
            titulo: 'Caminos alternativos',
            oa: [
              { codigo: 'OA 1', descripcion: 'Interpretar textos que exploran opciones de vida, la relación humana con la naturaleza y la ciudad, identificando propósitos explícitos e implícitos.', habilidades: ['interpretación', 'propósitos', 'naturaleza', 'ciudad'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Un mundo en movimiento',
            oa: [
              { codigo: 'OA 2', descripcion: 'Reflexionar sobre la migración, la incorporación de extranjerismos e indigenismos, y el impacto social del desplazamiento humano.', habilidades: ['migración', 'extranjerismos', 'indigenismos', 'impacto social'] },
            ],
          },
          {
            numero: 3,
            titulo: 'El impulso de narrar',
            oa: [
              { codigo: 'OA 3', descripcion: 'Analizar narraciones literarias y orales, comprendiendo el rol del narrador, el enfrentamiento de fuerzas en el teatro y la necesidad humana de contar historias.', habilidades: ['narrador', 'teatro', 'conflicto', 'historias'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Imaginar el futuro',
            oa: [
              { codigo: 'OA 4', descripcion: 'Leer obras de ciencia ficción y artículos para evaluar visiones del mañana, el avance de la inteligencia artificial y el rescate de saberes ancestrales.', habilidades: ['ciencia ficción', 'IA', 'saberes ancestrales', 'futuro'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Lengua y Literatura 1º Medio',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-y-Literatura-1-Medio/LYLSA26E1M.pdf',
            actividades: [
              'Lectura e interpretación de textos literarios e informativos enfocados en el crecimiento personal y las visiones de mundo.',
              'Reflexión acerca del movimiento humano, la migración y la evolución del lenguaje a través de reportajes y crónicas.',
              'Análisis de relatos, novelas y obras dramáticas para identificar la estructura del conflicto y la evolución de los personajes.',
              'Escritura de textos argumentativos, columnas de opinión y microensayos anticipando desarrollos futuros.',
              'Investigación sobre problemáticas tecnológicas, sociales y ambientales evaluando la confiabilidad de las fuentes.',
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Números',
            oa: [
              { codigo: 'OA 1', descripcion: 'Resolver operaciones complejas con números racionales y analizar el comportamiento exponencial en situaciones del entorno científico y cotidiano.', habilidades: ['racionales', 'notación científica', 'exponencial', 'potencias'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Álgebra y funciones',
            oa: [
              { codigo: 'OA 2', descripcion: 'Aplicar productos notables para reducir expresiones, y plantear y resolver sistemas de ecuaciones lineales modelando contextos reales.', habilidades: ['productos notables', 'sistemas de ecuaciones', 'modelamiento'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Geometría',
            oa: [
              { codigo: 'OA 3', descripcion: 'Representar vectores en el plano, ejecutar homotecias y aplicar criterios de semejanza geométrica y el Teorema de Euclides.', habilidades: ['vectores', 'homotecia', 'semejanza', 'Euclides'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Probabilidad y estadística',
            oa: [
              { codigo: 'OA 4', descripcion: 'Analizar datos de múltiples poblaciones a través de indicadores estadísticos y calcular probabilidades compuestas mediante diagramas de árbol y reglas formales.', habilidades: ['estadística', 'probabilidad', 'diagramas de árbol', 'muestras'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Matemática 1º Medio',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-1-Medio/MATSA26E1M.pdf',
            actividades: [
              'Resolución de problemas con operaciones combinadas de números racionales y uso de notación científica.',
              'Modelamiento de procesos de crecimiento y decrecimiento utilizando potencias de base racional y exponente entero.',
              'Aplicación de productos notables (cuadrado de binomio, suma por su diferencia) y factorización algebraica.',
              'Resolución de sistemas de ecuaciones lineales con dos incógnitas a través de métodos gráficos y algebraicos.',
              'Estudio de transformaciones isométricas, homotecia, propiedades de los vectores y criterios de semejanza de figuras.',
              'Cálculo de la probabilidad de eventos empleando la regla aditiva y multiplicativa, y análisis comparativo de muestras estadísticas.',
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Conformación del Estado nación en Europa y América',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar cómo el liberalismo, la burguesía y las ideas republicanas del siglo XIX impulsaron la formación de Estados nacionales y redefinieron los derechos políticos.', habilidades: ['liberalismo', 'burguesía', 'república', 'derechos políticos'] },
            ],
          },
          {
            numero: 2,
            titulo: 'El nuevo orden contemporáneo en el mundo y en Chile',
            oa: [
              { codigo: 'OA 2', descripcion: 'Comprender los efectos tecnológicos de la Revolución Industrial, el surgimiento del proletariado urbano y el debate ideológico en torno a la cuestión social.', habilidades: ['Revolución Industrial', 'proletariado', 'cuestión social', 'ideología'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Las políticas de expansión territorial de Chile y su impacto',
            oa: [
              { codigo: 'OA 3', descripcion: 'Evaluar críticamente la anexión de zonas extremas, los procesos de asimilación cultural y la relación histórica y actual entre el Estado y los pueblos originarios.', habilidades: ['expansión territorial', 'pueblos originarios', 'asimilación', 'Guerra del Pacífico'] },
            ],
          },
          {
            numero: 4,
            titulo: 'El funcionamiento del mercado',
            oa: [
              { codigo: 'OA 4', descripcion: 'Describir el papel del mercado en la asignación de recursos, analizar el equilibrio de precios y dimensionar los efectos de las alteraciones económicas en la sociedad.', habilidades: ['mercado', 'oferta y demanda', 'precios', 'asignación de recursos'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Historia, Geografía y Ciencias Sociales 1º Medio',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Historia-Geografia-y-Ciencias-Sociales-1-Medio/HISSA26E1M.pdf',
            actividades: [
              'Análisis de las revoluciones liberales, la formación de repúblicas y el desarrollo del orden político y constitucional.',
              'Estudio del impacto de la industrialización, las migraciones campo-ciudad y las problemáticas surgidas con la "cuestión social".',
              'Evaluación del modelo económico primario exportador chileno y los debates políticos entre conservadores y liberales.',
              'Investigación sobre la expansión territorial nacional, incluyendo la Guerra del Pacífico y la ocupación militar de La Araucanía.',
              'Comprensión del sistema de mercado, el juego de oferta y demanda, y el rol que cumplen el Estado y los agentes privados.',
            ],
          },
        ],
      },
      {
        nombre: 'Inglés',
        unidades: [
          {
            numero: 1,
            titulo: 'Jobs',
            oa: [
              { codigo: 'OA 1', descripcion: 'Identificar características de distintas ocupaciones y desarrollar la habilidad para solicitar formalmente un empleo de verano mediante la redacción de correos y currículos.', habilidades: ['occupations', 'job application', 'CV', 'formal writing'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Lifelong Learning',
            oa: [
              { codigo: 'OA 2', descripcion: 'Explorar la importancia de la educación permanente y la participación en programas globales de voluntariado a través del análisis de textos informativos.', habilidades: ['lifelong learning', 'volunteering', 'global programs', 'reading'] },
            ],
          },
          {
            numero: 3,
            titulo: 'The Arts',
            oa: [
              { codigo: 'OA 3', descripcion: 'Debatir e intercambiar opiniones sobre cómo las expresiones artísticas reflejan la identidad individual y promueven la cohesión y el cambio social.', habilidades: ['arts', 'identity', 'social change', 'debate'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Traditions and Festivities',
            oa: [
              { codigo: 'OA 4', descripcion: 'Investigar sobre costumbres mundiales y locales fomentando una postura de respeto intercultural a través de exposiciones sobre tradiciones folclóricas.', habilidades: ['traditions', 'festivities', 'intercultural', 'research'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'English 1st High School',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-1-Medio/INGSA26E1M.pdf',
            actividades: [
              'Desarrollo de comprensión auditiva y lectora en torno a responsabilidades laborales, profesiones y trabajo de verano.',
              'Simulación oral de entrevistas de trabajo y discusiones sobre fortalezas, debilidades y postulación a cargos.',
              'Producción de correos electrónicos formales, resumes (currículos) y volantes promocionando programas de voluntariado.',
              'Análisis del impacto global del aprendizaje continuo y exploración del arte como medio de transformación y diversidad cultural.',
            ],
          },
        ],
      },
      {
        nombre: 'Biología',
        unidades: [
          {
            numero: 1,
            titulo: '¿Cómo han cambiado los seres vivos a lo largo del tiempo?',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar las evidencias fósiles y anatómicas para comprender el principio de ancestralidad común y los mecanismos de selección natural propuestos por la teoría evolutiva.', habilidades: ['fósiles', 'anatomía comparada', 'selección natural', 'evolución'] },
            ],
          },
          {
            numero: 2,
            titulo: '¿Cómo fluyen la materia y energía en los ecosistemas?',
            oa: [
              { codigo: 'OA 2', descripcion: 'Identificar los distintos tipos de relaciones e interacciones ecológicas y estudiar el mecanismo complementario entre fotosíntesis y respiración celular.', habilidades: ['relaciones ecológicas', 'fotosíntesis', 'respiración', 'energía'] },
            ],
          },
          {
            numero: 3,
            titulo: '¿Qué acciones y fenómenos alteran los ecosistemas?',
            oa: [
              { codigo: 'OA 3', descripcion: 'Investigar el efecto del cambio climático y la intervención industrial, promoviendo estrategias de desarrollo sustentable y protección de la biodiversidad.', habilidades: ['cambio climático', 'sustentabilidad', 'biodiversidad', 'antropogénico'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Ciencias Naturales - Biología 1º y 2º Medio (Ejes 1º Medio)',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Biologia-1-Medio/BIOSA26E1M.pdf',
            actividades: [
              'Estudio comparativo de restos fósiles, anatomía comparada y embriología como prueba del desarrollo evolutivo.',
              'Revisión de los postulados de Charles Darwin, la teoría de la selección natural y su impacto en la biodiversidad.',
              'Análisis ecológico de poblaciones, simbiosis y las dinámicas energéticas a nivel de transferencia y fotosíntesis.',
              'Evaluación del impacto antropogénico como la deforestación, la bioacumulación tóxica y las emisiones de carbono.',
            ],
          },
        ],
      },
      {
        nombre: 'Física',
        unidades: [
          {
            numero: 1,
            titulo: 'Los fenómenos sonoros en nuestro entorno',
            oa: [
              { codigo: 'OA 1', descripcion: 'Comprender la producción, transmisión y cualidades fisiológicas del sonido mediante el modelamiento de ondas mecánicas e interacciones acústicas.', habilidades: ['sonido', 'ondas mecánicas', 'acústica', 'frecuencia'] },
            ],
          },
          {
            numero: 2,
            titulo: 'La luz y los fenómenos luminosos',
            oa: [
              { codigo: 'OA 2', descripcion: 'Describir el comportamiento de las ondas electromagnéticas, el fenómeno de reflexión y refracción, y generar conciencia respecto a la normativa lumínica en Chile.', habilidades: ['luz', 'electromagnético', 'reflexión', 'refracción'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Ciencias Naturales - Física 1º y 2º Medio (Ejes 1º Medio)',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Fisica-1-Medio/FISSM26E1M_compressed.pdf',
            actividades: [
              'Estudio del sonido, su naturaleza ondulatoria, parámetros que lo definen (amplitud, frecuencia) y fenómenos acústicos.',
              'Análisis del espectro electromagnético, comprendiendo la naturaleza y propagación de la luz visible e invisible.',
              'Experimentación óptica utilizando lentes para demostrar cómo incide el índice de refracción en la trayectoria lumínica.',
              'Evaluación del impacto de la contaminación lumínica artificial en los ecosistemas y la astronomía nacional.',
            ],
          },
        ],
      },
      {
        nombre: 'Química',
        unidades: [
          {
            numero: 1,
            titulo: 'Reacciones químicas',
            oa: [
              { codigo: 'OA 1', descripcion: 'Identificar transformaciones de la materia, clasificar reacciones termodinámicas (endotérmicas/exotérmicas) y estudiar factores que modifican su velocidad.', habilidades: ['reacciones', 'termodinámica', 'velocidad', 'transformación'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Estequiometría de reacción',
            oa: [
              { codigo: 'OA 2', descripcion: 'Aplicar las leyes ponderales de la química en el ajuste de ecuaciones para establecer relaciones proporcionales de masa, mol y volumen entre reactivos y productos.', habilidades: ['estequiometría', 'leyes ponderales', 'balance', 'ecuaciones'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Ciencias Naturales - Química 1º y 2º Medio (Ejes 1º Medio)',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Quimica-1-Medio/QUISM26E1M_compressed.pdf',
            actividades: [
              'Diferenciación entre cambios físicos y químicos identificando variables (temperatura, energía) y manifestaciones empíricas.',
              'Experimentación variando temperatura y agitación para determinar su incidencia en la velocidad de una reacción química.',
              'Resolución estequiométrica aplicando el método de balance por tanteo o algebraico en ecuaciones químicas.',
              'Aplicación de los fundamentos de Dalton, Proust y Lavoisier mediante el cálculo de la ley de conservación de la materia.',
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 2° MEDIO — Enseñanza Media
  // ========================================================================
  {
    nombre: '2° Medio',
    asignaturas: [
      {
        nombre: 'Lengua y Literatura',
        unidades: [
          {
            numero: 1,
            titulo: 'La ruta que tú caminas',
            oa: [
              { codigo: 'OA 1', descripcion: 'Interpretar textos literarios y no literarios vinculados a los viajes físicos y de autoconocimiento, y producir narraciones biográficas integrando el contexto de la obra.', habilidades: ['viajes', 'autoconocimiento', 'biografías', 'contexto'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Quién dijo que todo está perdido',
            oa: [
              { codigo: 'OA 2', descripcion: 'Analizar obras dramáticas y literarias enfocadas en problemáticas universales, y escribir reportajes sobre la responsabilidad social y la urgencia climática.', habilidades: ['drama', 'problemáticas universales', 'reportajes', 'responsabilidad social'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Construyendo vínculos',
            oa: [
              { codigo: 'OA 3', descripcion: 'Reflexionar sobre la importancia de las relaciones humanas y la conexión con la naturaleza a través del análisis de ensayos y la evaluación de la convivencia comunitaria.', habilidades: ['vínculos', 'ensayos', 'convivencia', 'naturaleza'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Aquí estoy yo',
            oa: [
              { codigo: 'OA 4', descripcion: 'Leer críticamente discursos y narraciones de crecimiento personal, analizando las visiones de mundo, y producir discursos públicos argumentando ideas de impacto social.', habilidades: ['discursos', 'crecimiento personal', 'visión de mundo', 'impacto social'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Lengua y Literatura 2º Medio',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-y-Literatura-2-Medio/LYLSA26E2M.pdf',
            actividades: [
              'Lectura y análisis de textos literarios e informativos enfocados en la identidad, el viaje y el descubrimiento personal.',
              'Reflexión sobre los desafíos actuales, la crisis ambiental y social a través de reportajes y literatura contemporánea.',
              'Comprensión de los vínculos humanos y la convivencia mediante el diálogo, debates y la redacción de ensayos.',
              'Interpretación de obras dramáticas, discursos y relatos de formación, evaluando los personajes y sus motivaciones.',
              'Producción escrita de textos autobiográficos, reportajes y discursos públicos enfocados en la participación ciudadana.',
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Números',
            oa: [
              { codigo: 'OA 1', descripcion: 'Operar con el conjunto de los números reales, comprender las propiedades matemáticas de las raíces enésimas, las potencias de exponente racional y su vinculación directa con los logaritmos.', habilidades: ['números reales', 'raíces enésimas', 'potencias', 'logaritmos'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Álgebra y funciones',
            oa: [
              { codigo: 'OA 2', descripcion: 'Identificar, resolver y graficar funciones y ecuaciones cuadráticas, modelar fenómenos científicos y analizar las propiedades de inyectividad y epiyectividad para determinar la función inversa.', habilidades: ['cuadráticas', 'vértice', 'inversa', 'modelamiento'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Geometría',
            oa: [
              { codigo: 'OA 3', descripcion: 'Aplicar las razones trigonométricas para la resolución de problemas geométricos en el entorno físico y operar matemáticamente la descomposición de vectores en el plano cartesiano.', habilidades: ['trigonometría', 'seno', 'coseno', 'vectores'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Probabilidad y estadística',
            oa: [
              { codigo: 'OA 4', descripcion: 'Establecer la probabilidad de ocurrencia de eventos complejos empleando la regla de Laplace y utilizar técnicas de conteo avanzado como permutaciones y combinaciones.', habilidades: ['Laplace', 'permutaciones', 'combinaciones', 'conteo'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Matemática 2º Medio',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-2-Medio/MATSA26E2M.pdf',
            actividades: [
              'Resolución de problemas matemáticos involucrando números reales, raíces enésimas, potencias de exponente racional y propiedades de los logaritmos.',
              'Modelamiento de situaciones con funciones y ecuaciones cuadráticas, analizando vértices, concavidad y desplazamientos de gráficas.',
              'Determinación de las condiciones de existencia y el cálculo de la función inversa (lineal, afín y cuadrática).',
              'Aplicación de las razones trigonométricas (seno, coseno, tangente) y teorema de Pitágoras, además de la descomposición de vectores.',
              'Cálculo probabilístico empleando técnicas de combinatoria, permutaciones, variables aleatorias y la regla de Laplace.',
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Primera mitad del siglo XX: crisis y transformaciones',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar los grandes conflictos bélicos, el impacto social de los totalitarismos, la crisis económica de 1929 y el empoderamiento y democratización en la sociedad chilena.', habilidades: ['Guerras Mundiales', 'totalitarismos', 'crisis 1929', 'democratización'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Guerra Fría y globalización',
            oa: [
              { codigo: 'OA 2', descripcion: 'Comprender la confrontación geopolítica y la carrera armamentista bipolar, la polarización de América Latina y la consolidación de la internacionalización y revolución tecnológica global.', habilidades: ['Guerra Fría', 'bipolar', 'América Latina', 'globalización'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Chile desde 1973 a la recuperación de la democracia',
            oa: [
              { codigo: 'OA 3', descripcion: 'Evaluar críticamente los proyectos sociopolíticos del siglo XX, caracterizar la implantación del modelo neoliberal en la dictadura e internalizar el valor irrestricto de los derechos humanos.', habilidades: ['1973', 'dictadura', 'neoliberalismo', 'derechos humanos'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Chile: desde la recuperación de la democracia a nuestros días',
            oa: [
              { codigo: 'OA 4', descripcion: 'Analizar el complejo proceso de recuperación del Estado de derecho en Chile, valorando los desafíos constitucionales de inclusión ciudadana, diversidad y respeto en un mundo interconectado.', habilidades: ['democracia', 'constitución', 'inclusión', 'diversidad'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Historia, Geografía y Ciencias Sociales 2º Medio',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Historia-Geografia-y-Ciencias-Sociales-2-Medio/HISSM26E2M.pdf',
            actividades: [
              'Análisis de la crisis del Estado liberal decimonónico, el surgimiento de modelos totalitarios y el impacto destructivo de las Guerras Mundiales.',
              'Estudio de las dinámicas bipolares de amenaza nuclear durante la Guerra Fría y los hitos del proceso de descolonización mundial.',
              'Evaluación de los proyectos políticos en Chile en el siglo XX, el quiebre democrático de 1973 y la imposición de reformas neoliberales.',
              'Investigación sobre las violaciones a los Derechos Humanos durante la dictadura militar chilena y el establecimiento de Comisiones de Verdad.',
              'Revisión de los desafíos del mundo contemporáneo vinculados a la globalización, revolución tecnológica, diversidad ciudadana y no discriminación.',
            ],
          },
        ],
      },
      {
        nombre: 'Inglés',
        unidades: [
          {
            numero: 1,
            titulo: 'Global World',
            oa: [
              { codigo: 'OA 1', descripcion: 'Interpretar información crítica acerca del impacto económico de la globalización, interactuando en debates y redactando propuestas sobre problemáticas ciudadanas.', habilidades: ['globalization', 'debate', 'citizen proposals', 'critical thinking'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Technology Around Us',
            oa: [
              { codigo: 'OA 2', descripcion: 'Hablar e intercambiar puntos de vista estructurados sobre las ventajas, los problemas de adicción y las normas de seguridad asociadas a los dispositivos móviles y la web.', habilidades: ['technology', 'mobile devices', 'online safety', 'structured opinion'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Outstanding People',
            oa: [
              { codigo: 'OA 3', descripcion: 'Comprender narraciones reales y biografías de líderes destacados de la sociedad para producir textos y perfiles que reconozcan los rasgos de personalidad necesarios para alcanzar metas.', habilidades: ['biographies', 'leadership', 'personality traits', 'profile writing'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Sustainable Development',
            oa: [
              { codigo: 'OA 4', descripcion: 'Desarrollar un vocabulario y una conciencia ecológica activa al investigar sobre fuentes de energía limpia, consecuencias del efecto invernadero y estrategias para reducir residuos.', habilidades: ['sustainability', 'clean energy', 'greenhouse effect', 'waste reduction'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'High School English 2',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-2-Medio/INGSM26E2M.pdf',
            actividades: [
              'Desarrollo de habilidades de comprensión auditiva y lectora debatiendo sobre el mundo globalizado y problemas a escala internacional.',
              'Expresión oral y argumentación sobre el uso diario de la tecnología, las redes sociales y la prevención de riesgos de privacidad en línea.',
              'Investigación bibliográfica y análisis descriptivo del perfil de personas destacadas, identificando modelos a seguir y cualidades de liderazgo.',
              'Producción de material escrito enfocado en planes y campañas de sustentabilidad, impacto ambiental de las industrias y reciclaje local.',
            ],
          },
        ],
      },
      {
        nombre: 'Biología',
        unidades: [
          {
            numero: 1,
            titulo: '¿Cómo se controlan los procesos corporales?',
            oa: [
              { codigo: 'OA 1', descripcion: 'Comprender el funcionamiento de los centros cerebrales y redes neuronales, valorando la importancia de la prevención de trastornos y el cuidado de la salud mental.', habilidades: ['sistema nervioso', 'neuronas', 'salud mental', 'prevención'] },
            ],
          },
          {
            numero: 2,
            titulo: '¿Cómo ejercer una sexualidad responsable?',
            oa: [
              { codigo: 'OA 2', descripcion: 'Reconocer integralmente la sexualidad humana, fomentando habilidades para tomar decisiones informadas sobre la afectividad, el autocuidado y la prevención de ITS.', habilidades: ['sexualidad', 'autocuidado', 'ITS', 'decisiones informadas'] },
            ],
          },
          {
            numero: 3,
            titulo: '¿Cómo se transmite y manipula el ADN?',
            oa: [
              { codigo: 'OA 3', descripcion: 'Describir el proceso de replicación genética y división celular, y debatir sobre las aplicaciones médicas, éticas y agrícolas de la manipulación biotecnológica.', habilidades: ['ADN', 'replicación', 'biotecnología', 'ética'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Ciencias Naturales - Biología 1º y 2º Medio (Ejes 2º Medio)',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Biologia-1-Medio/BIOSA26E1M.pdf',
            actividades: [
              'Estudio de la anatomía del sistema nervioso, transmisión del impulso sináptico y respuestas automáticas (reflejos).',
              'Análisis sobre la importancia del sueño, la salud mental, el estrés y los efectos del consumo de drogas en la neuroquímica.',
              'Investigación sobre identidad de género, autocuidado preventivo, infecciones de transmisión sexual (ITS) y métodos de protección.',
              'Comprensión de la estructura de la molécula de ADN, procesos del ciclo celular y biotecnología aplicada a la ingeniería genética.',
            ],
          },
        ],
      },
      {
        nombre: 'Física',
        unidades: [
          {
            numero: 1,
            titulo: 'El movimiento y las fuerzas en nuestro entorno',
            oa: [
              { codigo: 'OA 1', descripcion: 'Modelar el movimiento empleando sistemas de referencia matemáticos e identificar la acción de las fuerzas concurrentes calculando la interacción neta vectorial.', habilidades: ['cinemática', 'vectores', 'fuerzas', 'sistema de referencia'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Dinámica del universo y exploración espacial',
            oa: [
              { codigo: 'OA 2', descripcion: 'Revisar los aportes de las leyes de gravitación, entender las principales teorías sobre el origen y evolución cósmica, y valorar el aporte de la infraestructura astronómica (ALMA, VLT).', habilidades: ['gravitación', 'Big Bang', 'ALMA', 'VLT'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Ciencias Naturales - Física 1º y 2º Medio (Ejes 2º Medio)',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Fisica-1-Medio/FISSM26E1M_compressed.pdf',
            actividades: [
              'Diferenciación cualitativa entre trayectoria y desplazamiento, y cálculo de rapidez y velocidad utilizando magnitudes cinemáticas.',
              'Uso de sistemas de referencia vectoriales bi y tridimensionales para ubicar y describir el movimiento de cuerpos físicos.',
              'Estudio de las fuerzas mecánicas aplicadas y el concepto de fuerza neta empleando diagramas de vectores.',
              'Investigación astronómica acerca del Big Bang, la expansión acelerada del universo y la tecnología espacial de observatorios chilenos.',
            ],
          },
        ],
      },
      {
        nombre: 'Química',
        unidades: [
          {
            numero: 1,
            titulo: 'Soluciones químicas',
            oa: [
              { codigo: 'OA 1', descripcion: 'Determinar las características cualitativas de la solubilidad en mezclas acuosas y cuantificar sus interacciones utilizando magnitudes de concentración analítica.', habilidades: ['solubilidad', 'mezclas', 'concentración', 'disoluciones'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Química orgánica',
            oa: [
              { codigo: 'OA 2', descripcion: 'Conocer la estructura tetravalente del carbono, representar hidrocarburos en modelos tridimensionales y asociar series homólogas nitrogenadas u oxigenadas con la industria y la biología.', habilidades: ['carbono', 'hidrocarburos', 'IUPAC', 'biomoléculas'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Ciencias Naturales - Química 1º y 2º Medio (Ejes 2º Medio)',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Quimica-1-Medio/QUISM26E1M_compressed.pdf',
            actividades: [
              'Identificación de solutos y disolventes en mezclas homogéneas y técnicas de separación asociadas.',
              'Cálculos matemáticos para determinar unidades físicas (%m/m, %m/v) y unidades químicas (Molaridad) en disoluciones.',
              'Análisis de las propiedades del átomo de carbono, su capacidad de hibridación y su rol como base de la estructura orgánica.',
              'Nomenclatura sistemática (IUPAC) para hidrocarburos alifáticos y cíclicos, e identificación de biomoléculas (lípidos, proteínas).',
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 3° MEDIO — Enseñanza Media
  // ========================================================================
  {
    nombre: '3° Medio',
    asignaturas: [
      {
        nombre: 'Lengua y Literatura',
        unidades: [
          {
            numero: 1,
            titulo: 'Hechos y emociones',
            oa: [
              { codigo: 'OA 1', descripcion: 'Proponer interpretaciones de cuentos analizando sus componentes y leer críticamente ensayos valorando la interculturalidad y el contexto sociocultural.', habilidades: ['interpretación', 'cuentos', 'ensayos', 'interculturalidad'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Identidad',
            oa: [
              { codigo: 'OA 2', descripcion: 'Interpretar obras y referentes culturales considerando dilemas éticos y la influencia de las tradiciones en la construcción de la identidad en la sociedad actual.', habilidades: ['identidad', 'dilemas éticos', 'tradiciones', 'sociedad'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Transformaciones',
            oa: [
              { codigo: 'OA 3', descripcion: 'Analizar la intertextualidad en la literatura y comprender de forma crítica textos argumentativos vinculados a problemáticas como la crisis climática y la transformación del medioambiente.', habilidades: ['intertextualidad', 'argumentativos', 'crisis climática', 'medioambiente'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Decisiones y desafíos',
            oa: [
              { codigo: 'OA 4', descripcion: 'Evaluar críticamente cómo la sociedad de consumo y los problemas de ubicación social afectan a los individuos, promoviendo el debate y el consumo responsable.', habilidades: ['consumo', 'ubicación social', 'debate', 'responsabilidad'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Lengua y Literatura 3° y 4° Medio',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-y-Literatura-3-Medio/LYLSM26E3M_compressed.pdf',
            actividades: [
              'Lectura y análisis de obras narrativas y dramáticas, proponiendo interpretaciones basadas en sus componentes, lenguaje y elementos simbólicos.',
              'Lectura crítica de ensayos y textos no literarios, evaluando intenciones, posicionamientos, creencias e influencia del contexto sociocultural.',
              'Participación en foros de discusión y debates argumentativos, respetando las convenciones del género y formulando argumentos y contraargumentos.',
              'Investigación sobre temas socioculturales y medioambientales, redactando ensayos, artículos informativos y columnas de opinión.',
              'Análisis de las relaciones de intertextualidad entre diferentes referentes culturales y obras de la literatura.',
            ],
          },
        ],
      },
      {
        nombre: 'Filosofía',
        unidades: [
          {
            numero: 1,
            titulo: 'Cuestionar para comprender',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reflexionar sobre el origen, el asombro y el sentido de la filosofía como herramienta de análisis del mundo, identificando herramientas lógicas y ramas de la disciplina.', habilidades: ['asombro', 'herramientas lógicas', 'ramas', 'filosofía'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Realidad, libertad y sentido de la vida',
            oa: [
              { codigo: 'OA 2', descripcion: 'Explorar las preguntas fundamentales sobre el ser, la nada y el existencialismo, analizando la libertad humana y nuestra capacidad de dar sentido y valor a la existencia.', habilidades: ['ser', 'nada', 'existencialismo', 'libertad'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Ciencia, conocimiento y verdad',
            oa: [
              { codigo: 'OA 3', descripcion: 'Analizar críticamente el origen, las posibilidades y los límites del conocimiento humano, debatiendo sobre empirismo, racionalismo y las implicancias éticas del método científico.', habilidades: ['empirismo', 'racionalismo', 'conocimiento', 'método científico'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Diálogo y verdad',
            oa: [
              { codigo: 'OA 4', descripcion: 'Valorar el diálogo filosófico y la argumentación como constructores de la realidad, reflexionando sobre la alteridad, la diversidad y los conflictos ético-políticos del mundo contemporáneo.', habilidades: ['diálogo', 'alteridad', 'diversidad', 'conflictos ético-políticos'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Filosofía 3° y 4° Medio',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Filosofia-3-Medio/FILSM26E3M_compressed.pdf',
            actividades: [
              'Reflexión y diálogo sobre problemas filosóficos contemporáneos, cuestionando lo obvio y analizando la realidad desde el asombro y la duda metódica.',
              'Aplicación de habilidades lógico-argumentativas, distinguiendo la lógica formal e informal, analizando silogismos y estructurando argumentos sólidos.',
              'Exploración de contextos filosóficos fundamentales (ontología, epistemología, ética, estética) y cuestionamiento de perspectivas eurocéntricas.',
              'Análisis de textos filosóficos para investigar sobre la libertad, el sentido de la vida, el origen del universo y la construcción del conocimiento.',
              'Desarrollo de proyectos interdisciplinarios que vinculan la ética, la política y la ciencia con fenómenos actuales como la crisis medioambiental y el rol de las inteligencias artificiales.',
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Decido hacer deporte y cuidar mi salud',
            oa: [
              { codigo: 'OA 1', descripcion: 'Tomar decisiones informadas en contextos de salud y deporte mediante el uso de medidas de dispersión y la aplicación de probabilidades condicionales.', habilidades: ['dispersión', 'varianza', 'probabilidad condicional', 'decisiones'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Uso herramientas para aplicar modelos matemáticos',
            oa: [
              { codigo: 'OA 2', descripcion: 'Caracterizar, graficar y aplicar modelos matemáticos basados en funciones exponenciales y logarítmicas para comprender fenómenos del entorno.', habilidades: ['exponenciales', 'logarítmicas', 'modelos', 'gráfico'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Resuelvo problemas en formas circulares de mi entorno',
            oa: [
              { codigo: 'OA 3', descripcion: 'Aplicar teoremas geométricos para calcular la medida de ángulos y la longitud de diversos segmentos asociados a una circunferencia.', habilidades: ['circunferencia', 'cuerdas', 'tangentes', 'teoremas'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Matemática 3° y 4° Medio',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-3-Medio/MATSA26E3M.pdf',
            actividades: [
              'Cálculo y análisis de medidas de dispersión (varianza, desviación estándar, coeficiente de variación) en datos agrupados y no agrupados.',
              'Toma de decisiones en contextos de incerteza mediante la construcción de diagramas de árbol y el cálculo de probabilidades condicionales.',
              'Modelamiento de fenómenos de crecimiento y decrecimiento utilizando funciones exponenciales y logarítmicas, analizando sus desplazamientos gráficos.',
              'Resolución de problemas geométricos calculando longitudes de cuerdas, secantes y tangentes, y determinando ángulos en la circunferencia.',
            ],
          },
        ],
      },
      {
        nombre: 'Inglés',
        unidades: [
          {
            numero: 1,
            titulo: 'What Makes Us Succeed?',
            oa: [
              { codigo: 'OA 1', descripcion: 'Discutir y debatir sobre el éxito y la colaboración, describir hábitos y formular historias sobre buenas acciones (acts of kindness).', habilidades: ['success', 'collaboration', 'habits', 'acts of kindness'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Why is Media Literacy Important?',
            oa: [
              { codigo: 'OA 2', descripcion: 'Aprender a diferenciar hechos de ficción en los medios de comunicación, entender el impacto de los anuncios publicitarios y redactar campañas de concientización.', habilidades: ['media literacy', 'facts vs fiction', 'advertising', 'campaigns'] },
            ],
          },
          {
            numero: 3,
            titulo: 'What is Business For?',
            oa: [
              { codigo: 'OA 3', descripcion: 'Reflexionar críticamente sobre el propósito del trabajo, los modelos de negocios sostenibles y la contribución de las ONGs al mundo.', habilidades: ['business', 'sustainability', 'NGOs', 'purpose'] },
            ],
          },
          {
            numero: 4,
            titulo: 'What Can We Do For Our Planet?',
            oa: [
              { codigo: 'OA 4', descripcion: 'Analizar problemáticas ambientales, proponer hábitos ecológicos (eco-friendly) y discutir los beneficios de la legislación sobre el cambio climático.', habilidades: ['environment', 'eco-friendly', 'climate change', 'legislation'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'High School English 3-4',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-3-Medio/INGSA26E3M.pdf',
            actividades: [
              'Desarrollo de habilidades comunicativas (Reading, Listening, Speaking, Writing) debatiendo sobre el éxito, la competencia y los actos de bondad.',
              'Análisis de la alfabetización mediática, discerniendo entre hechos y ficción, y evaluando el impacto de la publicidad.',
              'Reflexión en idioma inglés sobre la ética empresarial, el trabajo remunerado frente al voluntariado y el apoyo a la comunidad.',
              'Investigación sobre acciones sostenibles y el cuidado del medioambiente, implementando proyectos interdisciplinarios.',
            ],
          },
        ],
      },
      {
        nombre: 'Educación Ciudadana',
        unidades: [
          {
            numero: 1,
            titulo: 'Democracia y ciudadanía',
            oa: [
              { codigo: 'OA 1', descripcion: 'Comprender la democracia como un sistema en permanente construcción y analizar los desafíos contemporáneos como la desafección política y la desigualdad.', habilidades: ['democracia', 'ciudadanía', 'desafección', 'desigualdad'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Derechos Humanos y acceso a la justicia',
            oa: [
              { codigo: 'OA 2', descripcion: 'Valorar la promoción de los derechos humanos desde la institucionalidad democrática y entender cómo garantizar un acceso igualitario a la justicia.', habilidades: ['derechos humanos', 'justicia', 'igualdad', 'institucionalidad'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Estado, mercado y participación',
            oa: [
              { codigo: 'OA 3', descripcion: 'Analizar las relaciones entre el Estado y el mercado, evaluando políticas públicas y la importancia de la participación para el bien común.', habilidades: ['Estado', 'mercado', 'políticas públicas', 'bien común'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Territorio y participación',
            oa: [
              { codigo: 'OA 4', descripcion: 'Entender la configuración del territorio y promover instancias de participación democrática activa en las comunidades educativas y locales.', habilidades: ['territorio', 'participación', 'comunidad', 'democracia activa'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Educación Ciudadana 3° Medio',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Educacion-Ciudadana-3-Medio/EDCSM26E3M.pdf',
            actividades: [
              'Análisis de los fundamentos, atributos y dimensiones que componen la democracia y la ciudadanía contemporánea.',
              'Reconocimiento de la dignidad humana y estudio de los principios que sustentan los Derechos Humanos.',
              'Comprensión de las relaciones e interacciones económicas, destacando el rol del Estado frente al mercado.',
              'Evaluación de la configuración interescalar del territorio y dinámicas de participación comunitaria en el ámbito escolar.',
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 4° MEDIO — Enseñanza Media
  // ========================================================================
  {
    nombre: '4° Medio',
    asignaturas: [
      {
        nombre: 'Lengua y Literatura',
        unidades: [
          {
            numero: 1,
            titulo: 'Ciudadanía y comunicación',
            oa: [
              { codigo: 'OA 1', descripcion: 'Ejercer ciudadanía crítica a través del lenguaje y la comunicación.', habilidades: ['discursos', 'medios', 'noticias falsas', 'debate público'] },
              { codigo: 'OA 2', descripcion: 'Producir comunicaciones efectivas para su proyecto de vida.', habilidades: ['CV', 'portfolio', 'negociación', 'autoevaluación'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Lengua y Literatura 3° y 4° Medio',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-y-Literatura-3-Medio/LYLSM26E3M_compressed.pdf',
            actividades: [
              'Lectura y análisis de obras narrativas y dramáticas, proponiendo interpretaciones basadas en sus componentes, lenguaje y elementos simbólicos.',
              'Lectura crítica de ensayos y textos no literarios, evaluando intenciones, posicionamientos, creencias e influencia del contexto sociocultural.',
              'Participación en foros de discusión y debates argumentativos, respetando las convenciones del género y formulando argumentos y contraargumentos.',
              'Investigación sobre temas socioculturales y medioambientales, redactando ensayos, artículos informativos y columnas de opinión.',
              'Análisis de las relaciones de intertextualidad entre diferentes referentes culturales y obras de la literatura.',
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Modelamiento matemático',
            oa: [
              { codigo: 'OA 1', descripcion: 'Aplicar modelos matemáticos para resolver problemas del mundo real.', habilidades: ['modelamiento', 'optimización', 'análisis', 'conclusión'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Matemática 3° y 4° Medio',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-3-Medio/MATSA26E3M.pdf',
            actividades: [
              'Cálculo y análisis de medidas de dispersión (varianza, desviación estándar, coeficiente de variación) en datos agrupados y no agrupados.',
              'Toma de decisiones en contextos de incerteza mediante la construcción de diagramas de árbol y el cálculo de probabilidades condicionales.',
              'Modelamiento de fenómenos de crecimiento y decrecimiento utilizando funciones exponenciales y logarítmicas, analizando sus desplazamientos gráficos.',
              'Resolución de problemas geométricos calculando longitudes de cuerdas, secantes y tangentes, y determinando ángulos en la circunferencia.',
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Ciencia y sociedad',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar el impacto de la ciencia y tecnología en la sociedad.', habilidades: ['ciencia', 'tecnología', 'impacto', 'ética'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Desafíos del siglo XXI',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar los grandes desafíos de la humanidad en el siglo XXI.', habilidades: ['cambio climático', 'desigualdad', 'sostenibilidad'] },
            ],
          },
        ],
      },
      {
        nombre: 'Filosofía',
        unidades: [
          {
            numero: 1,
            titulo: 'Cuestionar para comprender',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reflexionar sobre el origen, el asombro y el sentido de la filosofía como herramienta de análisis del mundo, identificando herramientas lógicas y ramas de la disciplina.', habilidades: ['asombro', 'herramientas lógicas', 'ramas', 'filosofía'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Realidad, libertad y sentido de la vida',
            oa: [
              { codigo: 'OA 2', descripcion: 'Explorar las preguntas fundamentales sobre el ser, la nada y el existencialismo, analizando la libertad humana y nuestra capacidad de dar sentido y valor a la existencia.', habilidades: ['ser', 'nada', 'existencialismo', 'libertad'] },
            ],
          },
          {
            numero: 3,
            titulo: 'Ciencia, conocimiento y verdad',
            oa: [
              { codigo: 'OA 3', descripcion: 'Analizar críticamente el origen, las posibilidades y los límites del conocimiento humano, debatiendo sobre empirismo, racionalismo y las implicancias éticas del método científico.', habilidades: ['empirismo', 'racionalismo', 'conocimiento', 'método científico'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Diálogo y verdad',
            oa: [
              { codigo: 'OA 4', descripcion: 'Valorar el diálogo filosófico y la argumentación como constructores de la realidad, reflexionando sobre la alteridad, la diversidad y los conflictos ético-políticos del mundo contemporáneo.', habilidades: ['diálogo', 'alteridad', 'diversidad', 'conflictos ético-políticos'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Filosofía 3° y 4° Medio',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Filosofia-3-Medio/FILSM26E3M_compressed.pdf',
            actividades: [
              'Reflexión y diálogo sobre problemas filosóficos contemporáneos, cuestionando lo obvio y analizando la realidad desde el asombro y la duda metódica.',
              'Aplicación de habilidades lógico-argumentativas, distinguiendo la lógica formal e informal, analizando silogismos y estructurando argumentos sólidos.',
              'Exploración de contextos filosóficos fundamentales (ontología, epistemología, ética, estética) y cuestionamiento de perspectivas eurocéntricas.',
              'Análisis de textos filosóficos para investigar sobre la libertad, el sentido de la vida, el origen del universo y la construcción del conocimiento.',
              'Desarrollo de proyectos interdisciplinarios que vinculan la ética, la política y la ciencia con fenómenos actuales como la crisis medioambiental y el rol de las inteligencias artificiales.',
            ],
          },
        ],
      },
      {
        nombre: 'Inglés',
        unidades: [
          {
            numero: 1,
            titulo: 'What Makes Us Succeed?',
            oa: [
              { codigo: 'OA 1', descripcion: 'Discutir y debatir sobre el éxito y la colaboración, describir hábitos y formular historias sobre buenas acciones (acts of kindness).', habilidades: ['success', 'collaboration', 'habits', 'acts of kindness'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Why is Media Literacy Important?',
            oa: [
              { codigo: 'OA 2', descripcion: 'Aprender a diferenciar hechos de ficción en los medios de comunicación, entender el impacto de los anuncios publicitarios y redactar campañas de concientización.', habilidades: ['media literacy', 'facts vs fiction', 'advertising', 'campaigns'] },
            ],
          },
          {
            numero: 3,
            titulo: 'What is Business For?',
            oa: [
              { codigo: 'OA 3', descripcion: 'Reflexionar críticamente sobre el propósito del trabajo, los modelos de negocios sostenibles y la contribución de las ONGs al mundo.', habilidades: ['business', 'sustainability', 'NGOs', 'purpose'] },
            ],
          },
          {
            numero: 4,
            titulo: 'What Can We Do For Our Planet?',
            oa: [
              { codigo: 'OA 4', descripcion: 'Analizar problemáticas ambientales, proponer hábitos ecológicos (eco-friendly) y discutir los beneficios de la legislación sobre el cambio climático.', habilidades: ['environment', 'eco-friendly', 'climate change', 'legislation'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'High School English 3-4',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-3-Medio/INGSA26E3M.pdf',
            actividades: [
              'Desarrollo de habilidades comunicativas (Reading, Listening, Speaking, Writing) debatiendo sobre el éxito, la competencia y los actos de bondad.',
              'Análisis de la alfabetización mediática, discerniendo entre hechos y ficción, y evaluando el impacto de la publicidad.',
              'Reflexión en idioma inglés sobre la ética empresarial, el trabajo remunerado frente al voluntariado y el apoyo a la comunidad.',
              'Investigación sobre acciones sostenibles y el cuidado del medioambiente, implementando proyectos interdisciplinarios.',
            ],
          },
        ],
      },
      {
        nombre: 'Educación Ciudadana',
        unidades: [
          {
            numero: 1,
            titulo: '¿Por qué es importante participar para resolver problemas sociales?',
            oa: [
              { codigo: 'OA 1', descripcion: 'Comprender los mecanismos para participar en la democracia chilena y analizar las brechas sociales que deben superarse.', habilidades: ['participación', 'democracia', 'brechas sociales', 'ciudadanía'] },
            ],
          },
          {
            numero: 2,
            titulo: '¿Cómo se relacionan los medios de comunicación con la democracia?',
            oa: [
              { codigo: 'OA 2', descripcion: 'Analizar el rol de los medios de comunicación y evaluar las oportunidades y riesgos que representan las TIC y redes sociales.', habilidades: ['medios', 'TIC', 'redes sociales', 'democracia'] },
            ],
          },
          {
            numero: 3,
            titulo: '¿Cómo construir una democracia más inclusiva?',
            oa: [
              { codigo: 'OA 3', descripcion: 'Identificar los principios rectores de la democracia para promover una sociedad respetuosa y avanzar hacia un territorio inclusivo.', habilidades: ['inclusión', 'principios democráticos', 'respeto', 'territorio'] },
            ],
          },
          {
            numero: 4,
            titulo: 'Derechos laborales y modelos de desarrollo, ¿cómo se relacionan?',
            oa: [
              { codigo: 'OA 4', descripcion: 'Comprender la protección de los derechos laborales y evaluar cómo los distintos modelos de desarrollo afectan la vida cotidiana y el medioambiente.', habilidades: ['derechos laborales', 'desarrollo', 'medioambiente', 'cotidiano'] },
            ],
          },
        ],
        textos: [
          {
            titulo: 'Educación Ciudadana 3°-4° Medio',
            url: 'https://www.curriculumnacional.cl/portal/Estudiantes/Educacion-Ciudadana-4-Medio/EDCSS26E4M.pdf',
            actividades: [
              'Participación ciudadana para resolver problemas sociales y superar brechas de desigualdad.',
              'Análisis crítico del rol de los medios de comunicación y las TIC en la democracia moderna.',
              'Promoción de principios éticos para construir una democracia más inclusiva y un territorio equitativo.',
              'Reflexión sobre los derechos laborales y evaluación del impacto de los modelos de desarrollo en el cambio climático.',
            ],
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Generación de SQL (orden estricto: niveles → asignaturas → unidades → OA)
// ---------------------------------------------------------------------------

function generateSQL(): string {
  const lines: string[] = [
    '-- ============================================================',
    '-- Migración 0003: Currículum masivo 1° Básico → 4° Medio',
    '-- Generado automáticamente por scripts/generate-curriculum-sql.ts',
    '-- Compatible con SQLite / Cloudflare D1',
    '-- ============================================================',
    '',
    'PRAGMA foreign_keys = ON;',
    '',
  ];

  // ------------------------------------------------------------------
  // 1. NIVELES (primero)
  // ------------------------------------------------------------------
  lines.push('-- ============================================================');
  lines.push('-- 1. NIVELES');
  lines.push('-- ============================================================');

  for (const nivel of CURRICULUM) {
    const id = nivelId(nivel.nombre);
    lines.push(
      `INSERT OR IGNORE INTO niveles (id, nombre, descripcion) VALUES`,
      `  ('${id}', '${sqlStr(nivel.nombre)}', '');`,
    );
  }

  lines.push('');

  // ------------------------------------------------------------------
  // 2. ASIGNATURAS (segundo)
  // ------------------------------------------------------------------
  lines.push('-- ============================================================');
  lines.push('-- 2. ASIGNATURAS');
  lines.push('-- ============================================================');

  for (const nivel of CURRICULUM) {
    const nid = nivelId(nivel.nombre);
    for (const asig of nivel.asignaturas) {
      const aid = asignaturaId(asig.nombre, nivel.nombre);
      lines.push(
        `INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES`,
        `  ('${aid}', '${nid}', '${sqlStr(asig.nombre)}');`,
      );
    }
  }

  lines.push('');

  // ------------------------------------------------------------------
  // 3. UNIDADES (tercero)
  // ------------------------------------------------------------------
  lines.push('-- ============================================================');
  lines.push('-- 3. UNIDADES');
  lines.push('-- ============================================================');

  for (const nivel of CURRICULUM) {
    for (const asig of nivel.asignaturas) {
      const aid = asignaturaId(asig.nombre, nivel.nombre);
      for (const uni of asig.unidades) {
        const uid = unidadId(asig.nombre, nivel.nombre, uni.numero);
        lines.push(
          `INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES`,
          `  ('${uid}', '${aid}', ${uni.numero}, '${sqlStr(uni.titulo)}');`,
        );
      }
    }
  }

  lines.push('');

  // ------------------------------------------------------------------
  // 4. OBJETIVOS DE APRENDIZAJE (cuarto)
  // ------------------------------------------------------------------
  lines.push('-- ============================================================');
  lines.push('-- 4. OBJETIVOS DE APRENDIZAJE');
  lines.push('-- ============================================================');

  for (const nivel of CURRICULUM) {
    for (const asig of nivel.asignaturas) {
      for (const uni of asig.unidades) {
        const uid = unidadId(asig.nombre, nivel.nombre, uni.numero);
        for (let i = 0; i < uni.oa.length; i++) {
          const oa = uni.oa[i];
          const oid = oaId(asig.nombre, nivel.nombre, uni.numero, i);
          const habilidadesCsv = oa.habilidades.map(sqlStr).join(',');
          lines.push(
            `INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES`,
            `  ('${oid}', '${uid}', '${sqlStr(oa.codigo)}', '${sqlStr(oa.descripcion)}', '${sqlStr(habilidadesCsv)}');`,
          );
        }
      }
    }
  }

  lines.push('');

  // ------------------------------------------------------------------
  // 5. TEXTOS ESCOLARES (quinto)
  // ------------------------------------------------------------------
  lines.push('-- ============================================================');
  lines.push('-- 5. TEXTOS ESCOLARES');
  lines.push('-- ============================================================');

  for (const nivel of CURRICULUM) {
    for (const asig of nivel.asignaturas) {
      if (asig.textos && asig.textos.length > 0) {
        const aid = asignaturaId(asig.nombre, nivel.nombre);
        for (const texto of asig.textos) {
          if (isTextoCompleto(texto)) {
            const tid = textoId(texto.titulo, nivel.nombre);
            const url = texto.url || '';
            const actividades = JSON.stringify(texto.actividades || []);
            const planificacion = texto.planificacion_detalle || '';
            lines.push(
              `INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES`,
              `  ('${tid}', '${aid}', '${sqlStr(texto.titulo)}', '${sqlStr(url)}', '${sqlStr(actividades)}', '${sqlStr(planificacion)}');`,
            );
          } else {
            const tid = textoId(texto, nivel.nombre);
            lines.push(
              `INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES`,
              `  ('${tid}', '${aid}', '${sqlStr(texto)}', '', '[]', '');`,
            );
          }
        }
      }
    }
  }

  lines.push('');
  lines.push('-- Fin de la migración 0003');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const sql = generateSQL();
const outPath = join(process.cwd(), 'migrations', '0003_curriculum_masivo.sql');
writeFileSync(outPath, sql, 'utf-8');

const stats = {
  niveles: CURRICULUM.length,
  asignaturas: CURRICULUM.reduce((acc, n) => acc + n.asignaturas.length, 0),
  unidades: CURRICULUM.reduce(
    (acc, n) => acc + n.asignaturas.reduce((a2, asig) => a2 + asig.unidades.length, 0),
    0,
  ),
  oa: CURRICULUM.reduce(
    (acc, n) =>
      acc +
      n.asignaturas.reduce(
        (a2, asig) => a2 + asig.unidades.reduce((a3, uni) => a3 + uni.oa.length, 0),
        0,
      ),
    0,
  ),
};

console.log('✅ SQL generado exitosamente');
console.log(`📄 Archivo: ${outPath}`);
console.log(`📊 Estadísticas:`);
console.log(`   Niveles:          ${stats.niveles}`);
console.log(`   Asignaturas:      ${stats.asignaturas}`);
console.log(`   Unidades:         ${stats.unidades}`);
console.log(`   OA:               ${stats.oa}`);
