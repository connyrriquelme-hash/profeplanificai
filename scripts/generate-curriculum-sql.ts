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

interface Asignatura {
  nombre: string;
  unidades: Unidad[];
  textos?: string[];
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

// ---------------------------------------------------------------------------
// Datos curriculares (1° Básico → 4° Medio)
// ---------------------------------------------------------------------------

const CURRICULUM: Nivel[] = [
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
              { codigo: 'OA 3', descripcion: 'Escribir textos breves usando mayúsculas, puntos y conectores simples.', habilidades: ['escritura', 'ortografía', 'conectores', 'puntuación'] },
            ],
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
            titulo: 'Lectura y escritura',
            oa: [
              { codigo: 'OA 1', descripcion: 'Leer textos significativos que incluyan palabras con hiatos y diptongos, con grupos consonánticos y con combinación.', habilidades: ['lectura', 'hiatos', 'diptongos', 'combinaciones'] },
              { codigo: 'OA 2', descripcion: 'Escribir textos narrativos, descriptivos y expositivos breves.', habilidades: ['escritura', 'narrativo', 'descriptivo', 'expositivo'] },
              { codigo: 'OA 4', descripcion: 'Leer independientemente y familiarizarse con un amplio repertorio de literatura.', habilidades: ['lectura', 'repertorio literario', 'preferencia'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Números y medidas',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer y escribir números naturales de hasta 3 dígitos.', habilidades: ['números', 'escritura', 'valor posicional', 'comparación'] },
              { codigo: 'OA 2', descripcion: 'Resolver problemas de suma y resta hasta 3 dígitos sin reagrupar.', habilidades: ['suma', 'resta', 'problemas', 'material concreto'] },
              { codigo: 'OA 3', descripcion: 'Medir objetos usando unidades no convencionales.', habilidades: ['medición', 'unidades no convencionales', 'longitud'] },
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Exploración del entorno',
            oa: [
              { codigo: 'OA 1', descripcion: 'Observar y describir características de seres vivos y materiales del entorno.', habilidades: ['observación', 'descripción', 'clasificación'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Mi comunidad',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer su identidad personal y los roles dentro de la familia y comunidad.', habilidades: ['identidad', 'familia', 'comunidad', 'normas'] },
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
            titulo: 'Comprensión lectora',
            oa: [
              { codigo: 'OA 1', descripcion: 'Leer y comprender textos narrativos, descriptivos e instructivos.', habilidades: ['lectura', 'comprensión', 'idea principal', 'personajes'] },
              { codigo: 'OA 2', descripcion: 'Escribir textos narrativos y descriptivos con estructura clara.', habilidades: ['escritura', 'planificación', 'coherencia', 'ortografía'] },
              { codigo: 'OA 3', descripcion: 'Participar en conversaciones respetando normas de interacción.', habilidades: ['conversación', 'turnos', 'opiniones', 'escucha activa'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Operaciones y geometría',
            oa: [
              { codigo: 'OA 1', descripcion: 'Demostrar comprensión de números naturales y operaciones básicas.', habilidades: ['números', 'suma', 'resta', 'multiplicación'] },
              { codigo: 'OA 2', descripcion: 'Reconocer y describir figuras geométricas en el entorno.', habilidades: ['figuras', 'geometría', 'perímetro', 'área'] },
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Seres vivos y materiales',
            oa: [
              { codigo: 'OA 1', descripcion: 'Observar y clasificar seres vivos según sus características.', habilidades: ['observación', 'clasificación', 'seres vivos', 'características'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Espacio geográfico',
            oa: [
              { codigo: 'OA 1', descripcion: 'Identificar elementos básicos del espacio geográfico local.', habilidades: ['espacio', 'mapa', 'localización', 'entorno'] },
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
            titulo: 'Lectura y producción de textos',
            oa: [
              { codigo: 'OA 1', descripcion: 'Leer y comprender textos literarios e informativos de mayor extensión.', habilidades: ['lectura', 'propósito comunicativo', 'información explícita', 'recursos literarios'] },
              { codigo: 'OA 2', descripcion: 'Escribir textos de diversos géneros con coherencia y cohesión.', habilidades: ['escritura', 'estructura', 'conectores', 'ortografía'] },
              { codigo: 'OA 3', descripcion: 'Investigar y presentar información usando múltiples fuentes.', habilidades: ['investigación', 'fuentes', 'organización', 'presentación oral'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Números y operaciones',
            oa: [
              { codigo: 'OA 1', descripcion: 'Demostrar comprensión de números naturales y sus operaciones.', habilidades: ['números', 'operaciones', 'problemas', 'estrategias'] },
              { codigo: 'OA 2', descripcion: 'Reconocer y describir propiedades de figuras geométricas.', habilidades: ['figuras', 'propiedades', 'simetría', 'perímetro'] },
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Materia y energía',
            oa: [
              { codigo: 'OA 1', descripcion: 'Observar y describir propiedades de la materia.', habilidades: ['observación', 'propiedades', 'estado', 'cambio'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Historia de Chile',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer hechos relevantes de la historia de Chile.', habilidades: ['historia', 'fechos', 'personajes', 'contexto'] },
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
            titulo: 'Comprensión de textos escritos',
            oa: [
              { codigo: 'OA 1', descripcion: 'Leer comprensivamente textos escritos de diverso tipo, identificando la idea principal y los detalles relevantes.', habilidades: ['leer', 'identificar idea principal', 'identificar detalles', 'infiriendo'] },
              { codigo: 'OA 2', descripcion: 'Reconocer y aplicar estrategias de lectura: anticipación, predicción, formulación de preguntas y resumen.', habilidades: ['estrategias de lectura', 'anticipar', 'predicir', 'formular preguntas', 'resumir'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Fracciones y números decimales',
            oa: [
              { codigo: 'OA 1', descripcion: 'Representar fracciones propias e impropias y su equivalencia con decimales, usando modelos concretos y gráficos.', habilidades: ['representar', 'fracciones', 'decimales', 'modelo concreto', 'modelo gráfico'] },
              { codigo: 'OA 2', descripcion: 'Sumar y restar fracciones con denominadores distintos, aplicando criterios de equivalencia y simplificación.', habilidades: ['sumar', 'restar', 'fracciones', 'denominador común', 'equivalencia', 'simplificar'] },
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'La diversidad de la vida',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer y explicar que los seres vivos están formados por una o más células y que estas se organizan en tejidos, órganos y sistemas.', habilidades: ['observar', 'comparar', 'describir', 'usar modelos', 'comunicar'] },
              { codigo: 'OA 2', descripcion: 'Identificar y describir, por medio de modelos, las estructuras básicas del sistema digestivo y sus funciones principales en el proceso de digestión.', habilidades: ['identificar', 'describir', 'modelar', 'explicar', 'relacionar estructura y función'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Chile: regiones naturales y población',
            oa: [
              { codigo: 'OA 1', descripcion: 'Identificar las regiones naturales de Chile y describir sus características geográficas, climáticas y de vegetación.', habilidades: ['identificar', 'describir', 'regiones naturales', 'geografía', 'clima', 'vegetación'] },
              { codigo: 'OA 2', descripcion: 'Explicar la relación entre las regiones naturales y las actividades económicas de la población chilena.', habilidades: ['explicar', 'relacionar', 'actividades económicas', 'población', 'regiones'] },
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
        ],
        textos: ['Texto del Estudiante Matemática 6° Básico 2026'],
      },
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'Profundización de la comprensión lectora',
            oa: [
              { codigo: 'OA 3', descripcion: 'Leer y familiarizarse con un amplio repertorio de literatura para aumentar su conocimiento del mundo.', habilidades: ['lectura', 'repertorio literario', 'conocimiento'] },
              { codigo: 'OA 4', descripcion: 'Analizar aspectos relevantes de las narraciones leídas para profundizar su comprensión.', habilidades: ['análisis', 'narraciones', 'comprensión'] },
              { codigo: 'OA 6', descripcion: 'Leer de manera fluida textos variados apropiados a su edad.', habilidades: ['fluidez', 'textos variados', 'adecuación'] },
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'El sistema solar y la Tierra',
            oa: [
              { codigo: 'OA 1', descripcion: 'Describir los componentes del sistema solar y las características de los planetas.', habilidades: ['describir', 'sistema solar', 'planetas', 'componentes'] },
              { codigo: 'OA 2', descripcion: 'Explicar el movimiento de rotación y traslación de la Tierra y sus efectos.', habilidades: ['explicar', 'rotación', 'traslación', 'efectos'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Independencia de Chile',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer las causas y consecuencias de la Independencia de Chile.', habilidades: ['historia', 'independencia', 'causas', 'consecuencias'] },
              { codigo: 'OA 2', descripcion: 'Identificar los próceres de la Independencia y su contribución.', habilidades: ['próceres', 'contribución', 'identificación'] },
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
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'Análisis crítico de textos',
            oa: [
              { codigo: 'OA 1', descripcion: 'Leer críticamente textos de diversos géneros y formatos.', habilidades: ['análisis crítico', 'intencionalidad', 'posición ideológica', 'falacias'] },
              { codigo: 'OA 2', descripcion: 'Producir textos creativos y académicos con voz propia.', habilidades: ['escritura creativa', 'ensayos', 'coherencia', 'autoevaluación'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Álgebra y funciones',
            oa: [
              { codigo: 'OA 1', descripcion: 'Demostrar comprensión de ecuaciones lineales y funciones.', habilidades: ['ecuaciones', 'funciones', 'variables', 'representación'] },
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Ecosistemas',
            oa: [
              { codigo: 'OA 1', descripcion: 'Explicar la interacción de los seres vivos con su ambiente.', habilidades: ['ecosistemas', 'interacción', 'ambiente', 'biodiversidad'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Proceso histórico chileno',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar el proceso de formación del Estado Nacional chileno.', habilidades: ['historia', 'Estado Nacional', 'independencia', 'guerra'] },
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
            titulo: 'Proporciones y ecuaciones',
            oa: [
              { codigo: 'OA 1', descripcion: 'Demostrar comprensión de proporciones y fracciones.', habilidades: ['proporciones', 'fracciones', 'porcentajes', 'regla de tres'] },
              { codigo: 'OA 2', descripcion: 'Demostrar comprensión de ecuaciones de segundo grado.', habilidades: ['ecuaciones', 'segundo grado', 'coeficientes', 'fórmula general'] },
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
            titulo: 'Análisis literario',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar e interpretar textos literarios chilenos e hispanoamericanos.', habilidades: ['contextualización', 'construcción de personajes', 'temas universales'] },
              { codigo: 'OA 2', descripcion: 'Escribir textos argumentativos complejos y académicos.', habilidades: ['argumentación', 'evidencia', 'contraargumentos', 'normas APA'] },
              { codigo: 'OA 3', descripcion: 'Participar en debates y diálogos argumentativos formales.', habilidades: ['debate', 'argumentación', 'refutación', 'lenguaje persuasivo'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Funciones y álgebra',
            oa: [
              { codigo: 'OA 1', descripcion: 'Demostrar comprensión de funciones lineales y cuadráticas.', habilidades: ['funciones', 'lineales', 'cuadráticas', 'representación'] },
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Energía y materia',
            oa: [
              { codigo: 'OA 1', descripcion: 'Explicar los principios de conservación de la energía.', habilidades: ['energía', 'conservación', 'transformación', 'fuentes'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Siglo XX chileno',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar los procesos políticos y sociales del siglo XX en Chile.', habilidades: ['siglo XX', 'reformas', 'movimientos sociales'] },
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
            titulo: 'Producción académica',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar la construcción del sentido en textos literarios y no literarios.', habilidades: ['intertextualidad', 'construcción de sentido', 'enfoques críticos'] },
              { codigo: 'OA 2', descripcion: 'Producir textos académico-científicos con metodología de investigación.', habilidades: ['investigación', 'hipótesis', 'monografías', 'criterios éticos'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Probabilidad y estadística',
            oa: [
              { codigo: 'OA 1', descripcion: 'Demostrar comprensión de probabilidades y estadística descriptiva.', habilidades: ['probabilidad', 'estadística', 'datos', 'análisis'] },
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Biología molecular',
            oa: [
              { codigo: 'OA 1', descripcion: 'Explicar los procesos moleculares de la herencia.', habilidades: ['ADN', 'genes', 'herencia', 'mutaciones'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Chile contemporáneo',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar los procesos de democratización y desarrollo en Chile.', habilidades: ['democratización', 'desarrollo', 'sociedad civil'] },
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
            titulo: 'Literatura como construcción cultural',
            oa: [
              { codigo: 'OA 1', descripcion: 'Interpretar y valorar la literatura como construcción cultural.', habilidades: ['canon literario', 'artes', 'función social', 'lectura crítica'] },
              { codigo: 'OA 2', descripcion: 'Comunicar ideas complejas en contextos académicos y profesionales.', habilidades: ['registro', 'presentaciones', 'medios digitales', 'portfolio'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Geometría y trigonometría',
            oa: [
              { codigo: 'OA 1', descripcion: 'Demostrar comprensión de relaciones geométricas y trigonométricas.', habilidades: ['geometría', 'trigonometría', 'relaciones', 'demostración'] },
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Química orgánica',
            oa: [
              { codigo: 'OA 1', descripcion: 'Explicar la estructura y propiedades de compuestos orgánicos.', habilidades: ['orgánicos', 'propiedades', 'reacciones', 'laboratorio'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Globalización y desafíos',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar los efectos de la globalización en la sociedad chilena.', habilidades: ['globalización', 'cultura', 'economía', 'desafíos'] },
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
        for (const titulo of asig.textos) {
          const tid = textoId(titulo, nivel.nombre);
          lines.push(
            `INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo) VALUES`,
            `  ('${tid}', '${aid}', '${sqlStr(titulo)}');`,
          );
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
