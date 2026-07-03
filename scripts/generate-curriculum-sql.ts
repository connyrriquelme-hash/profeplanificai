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

// ---------------------------------------------------------------------------
// Datos curriculares (1° Básico → 4° Medio)
// ---------------------------------------------------------------------------

const CURRICULUM: Nivel[] = [
  // ========================================================================
  // 1° BÁSICO
  // ========================================================================
  {
    nombre: '1° Básico',
    asignaturas: [
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'Iniciación a la lectura y escritura',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer y producir sonidos del habla y asociarlos con letras y sílabas.', habilidades: ['fonología', 'conciencia fonológica', 'asociar grafemas'] },
              { codigo: 'OA 2', descripcion: 'Leer y escribir sílabas y palabras simples del vocabulario conocido.', habilidades: ['lectura', 'escritura', 'sílabas'] },
              { codigo: 'OA 3', descripcion: 'Comprender textos escritos simples identificando su tema principal.', habilidades: ['comprensión lectora', 'idea principal'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Producción de textos escritos',
            oa: [
              { codigo: 'OA 4', descripcion: 'Escribir oraciones simples relacionadas con experiencias personales.', habilidades: ['escritura', 'oraciones', 'expresión personal'] },
              { codigo: 'OA 5', descripcion: 'Dictar y escribir palabras y oraciones coherentes.', habilidades: ['dictado', 'escritura', 'coherencia'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Números y operaciones básicas',
            oa: [
              { codigo: 'OA 1', descripcion: 'Contar, leer y escribir números del 0 al 100.', habilidades: ['conteo', 'lectura numérica', 'escritura numérica'] },
              { codigo: 'OA 2', descripcion: 'Comparar y ordenar números naturales usando los símbolos <, >, =.', habilidades: ['comparación', 'ordenamiento', 'desigualdad'] },
              { codigo: 'OA 3', descripcion: 'Sumar y restar números de un dígito con resultado hasta 10.', habilidades: ['suma', 'resta', 'cálculo mental'] },
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Mi cuerpo y los seres vivos',
            oa: [
              { codigo: 'OA 1', descripcion: 'Identificar y nombrar las partes principales del cuerpo humano.', habilidades: ['identificación', 'anatomía básica', 'observación'] },
              { codigo: 'OA 2', descripcion: 'Reconocer características de seres vivos y no vivos del entorno.', habilidades: ['clasificación', 'observación', 'cuidado del medio'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Mi entorno y comunidad',
            oa: [
              { codigo: 'OA 1', descripcion: 'Identificar elementos de su entorno familiar, escolar y vecinal.', habilidades: ['identificación', 'observación', 'sentido de pertenencia'] },
              { codigo: 'OA 2', descripcion: 'Reconocer normas de convivencia en la familia y la escuela.', habilidades: ['normas', 'convivencia', 'responsabilidad'] },
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 2° BÁSICO
  // ========================================================================
  {
    nombre: '2° Básico',
    asignaturas: [
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'Lectura comprensiva de textos narrativos',
            oa: [
              { codigo: 'OA 1', descripcion: 'Leer comprensivamente textos narrativos identificando personajes, lugar y tiempo.', habilidades: ['lectura', 'comprensión', 'elementos narrativos'] },
              { codigo: 'OA 2', descripcion: 'Reconocer la secuencia de eventos en un texto narrativo.', habilidades: ['secuencia', 'orden cronológico', 'ordenamiento'] },
            ],
          },
          {
            numero: 2,
            titulo: 'Escritura de textos simples',
            oa: [
              { codigo: 'OA 3', descripcion: 'Escribir textos narrativos breves usando oraciones coherentes y conectores básicos.', habilidades: ['escritura', 'conectores', 'coherencia'] },
              { codigo: 'OA 4', descripcion: 'Utilizar vocabulario variado en la producción de textos escritos.', habilidades: ['vocabulario', 'expresión', 'variedad léxica'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Números hasta el 1000 y operaciones',
            oa: [
              { codigo: 'OA 1', descripcion: 'Contar, leer y escribir números del 0 al 1000.', habilidades: ['conteo', 'lectura', 'escritura'] },
              { codigo: 'OA 2', descripcion: 'Sumar y restar números de dos dígitos con y sin reagrupación.', habilidades: ['suma', 'resta', 'reagrupación'] },
              { codigo: 'OA 3', descripcion: 'Resolver problemas de addition y sustracción del contexto diario.', habilidades: ['resolución de problemas', 'contexto', 'operación'] },
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
              { codigo: 'OA 1', descripcion: 'Identificar estados de la materia: sólido, líquido y gaseoso.', habilidades: ['identificación', 'estados de la materia', 'observación'] },
              { codigo: 'OA 2', descripcion: 'Reconocer fuentes de luz y calor en el entorno.', habilidades: ['identificación', 'luz', 'calor'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Chile: mi país',
            oa: [
              { codigo: 'OA 1', descripcion: 'Identificar elementos geográficos básicos de Chile: montañas, ríos, mar.', habilidades: ['geografía', 'identificación', 'elementos naturales'] },
              { codigo: 'OA 2', descripcion: 'Reconocer símbolos patrios y su importancia en la identidad nacional.', habilidades: ['símbolos', 'identidad', 'nación'] },
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 3° BÁSICO
  // ========================================================================
  {
    nombre: '3° Básico',
    asignaturas: [
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'Comprensión de textos informativos',
            oa: [
              { codigo: 'OA 1', descripcion: 'Leer comprensivamente textos informativos identificando la idea principal y datos relevantes.', habilidades: ['comprensión', 'idea principal', 'datos relevantes'] },
              { codigo: 'OA 2', descripcion: 'Reconocer la estructura de textos informativos: título, subtitulo, párrafos.', habilidades: ['estructura textos', 'organización', 'identificación'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Tabla pitagórica y operaciones',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer la tabla pitagórica como herramienta para multiplicar.', habilidades: ['tabla pitagórica', 'multiplicación', 'cálculo'] },
              { codigo: 'OA 2', descripcion: 'Multiplicar y dividir números naturales de dos dígitos.', habilidades: ['multiplicación', 'división', 'algoritmo'] },
              { codigo: 'OA 3', descripcion: 'Resolver problemas que involucren las cuatro operaciones básicas.', habilidades: ['resolución de problemas', 'operaciones', 'razonamiento'] },
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Ecosistemas terrestres y acuáticos',
            oa: [
              { codigo: 'OA 1', descripcion: 'Identificar componentes bióticos y abióticos de un ecosistema.', habilidades: ['identificación', 'componentes', 'ecosistema'] },
              { codigo: 'OA 2', descripcion: 'Describir relaciones de alimentación en cadenas alimentarias.', habilidades: ['cadena alimentaria', 'relaciones', 'descripción'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Pueblos originarios de Chile',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer la existencia de pueblos originarios en Chile antes de la conquista.', habilidades: ['historia', 'pueblos originarios', 'reconocimiento'] },
              { codigo: 'OA 2', descripcion: 'Identificar características culturales de al menos dos pueblos originarios.', habilidades: ['cultura', 'identificación', 'diversidad'] },
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 4° BÁSICO
  // ========================================================================
  {
    nombre: '4° Básico',
    asignaturas: [
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'Géneros literarios: narración y descripción',
            oa: [
              { codigo: 'OA 1', descripcion: 'Leer comprensivamente textos literarios de los géneros narrativo y descriptivo.', habilidades: ['comprensión', 'géneros literarios', 'lectura'] },
              { codigo: 'OA 2', descripcion: 'Identificar elementos constitutivos del cuento: personajes, escenario, conflicto, desenlace.', habilidades: ['elementos del cuento', 'análisis', 'estructura'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Números naturales y fracciones',
            oa: [
              { codigo: 'OA 1', descripcion: 'Leer, escribir y comparar números naturales hasta el millón.', habilidades: ['lectura', 'escritura', 'comparación'] },
              { codigo: 'OA 2', descripcion: 'Reconocer fracciones como partes de un todo y representarlas gráficamente.', habilidades: ['fracciones', 'representación gráfica', 'partes'] },
              { codigo: 'OA 3', descripcion: 'Sumar y restar fracciones con igual denominador.', habilidades: ['suma', 'resta', 'fracciones'] },
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Máquinas simples y su uso',
            oa: [
              { codigo: 'OA 1', descripcion: 'Identificar máquinas simples: palanca, plano inclinado, polea, tornillo, cuña.', habilidades: ['identificación', 'máquinas simples', 'tecnología'] },
              { codigo: 'OA 2', descripcion: 'Explicar cómo las máquinas simples facilitan las tareas cotidianas.', habilidades: ['explicación', 'aplicación', 'vida cotidiana'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Conquista y Colonia en Chile',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer los principales acontecimientos de la Conquista española en Chile.', habilidades: ['historia', 'conquista', 'cronología'] },
              { codigo: 'OA 2', descripcion: 'Describir la vida en las ciudades coloniales y su organización social.', habilidades: ['vida colonial', 'organización social', 'descripción'] },
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 5° BÁSICO
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
  // 6° BÁSICO
  // ========================================================================
  {
    nombre: '6° Básico',
    asignaturas: [
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'Análisis de textos argumentativos',
            oa: [
              { codigo: 'OA 1', descripcion: 'Leer comprensivamente textos argumentativos identificando tesis, argumentos y contraargumentos.', habilidades: ['lectura', 'análisis', 'argumentación', 'tesis'] },
              { codigo: 'OA 2', descripcion: 'Producir textos argumentativos sencillos con estructura coherente.', habilidades: ['escritura', 'argumentación', 'estructura', 'coherencia'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Operaciones con fracciones y decimales',
            oa: [
              { codigo: 'OA 1', descripcion: 'Multiplicar y dividir fracciones con distinto denominador.', habilidades: ['multiplicación', 'división', 'fracciones', 'denominador'] },
              { codigo: 'OA 2', descripcion: 'Operar con números decimales: suma, resta, multiplicación y división.', habilidades: ['decimales', 'operaciones', 'cálculo'] },
              { codigo: 'OA 3', descripcion: 'Resolver problemas que involucren fracciones y decimales en contextos cotidianos.', habilidades: ['resolución de problemas', 'contexto', 'fracciones', 'decimales'] },
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
  // 7° BÁSICO
  // ========================================================================
  {
    nombre: '7° Básico',
    asignaturas: [
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'Textos periodísticos y opinativos',
            oa: [
              { codigo: 'OA 1', descripcion: 'Leer y analizar textos periodísticos identificando titulares, lead y cuerpos de la noticia.', habilidades: ['lectura', 'análisis', 'periodismo', 'estructura'] },
              { codigo: 'OA 2', descripcion: 'Producir textos opinativos sobre temas de interés social.', habilidades: ['escritura', 'opinión', 'temas sociales'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Álgebra elemental',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer expresiones algebraicas y evaluarlas sustituyendo valores.', habilidades: ['expresiones algebraicas', 'evaluación', 'sustitución'] },
              { codigo: 'OA 2', descripcion: 'Resolver ecuaciones de primer grado con una incógnita.', habilidades: ['ecuaciones', 'primer grado', 'resolución'] },
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Células y tejidos',
            oa: [
              { codigo: 'OA 1', descripcion: 'Identificar las partes principales de una célula vegetal y animal.', habilidades: ['célula', 'identificación', 'estructura celular'] },
              { codigo: 'OA 2', descripcion: 'Comparar células vegetales y animales usando un microscopio.', habilidades: ['comparación', 'microscopio', 'observación'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'La república en Chile',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer los períodos de la República en Chile y sus características políticas.', habilidades: ['historia', 'república', 'períodos'] },
              { codigo: 'OA 2', descripcion: 'Identificar los cambios sociales y económicos del siglo XIX en Chile.', habilidades: ['cambios sociales', 'economía', 'siglo XIX'] },
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 8° BÁSICO
  // ========================================================================
  {
    nombre: '8° Básico',
    asignaturas: [
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'Análisis de textos literarios',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar textos literarios de autores chilenos e iberoamericanos.', habilidades: ['análisis', 'literatura', 'autores', 'comprensión'] },
              { codigo: 'OA 2', descripcion: 'Interpretar recursos literarios: metáfora, símbolo, ironía, hipérbole.', habilidades: ['recursos literarios', 'interpretación', 'análisis'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Funciones lineales y cuadráticas',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer y graficar funciones lineales y cuadráticas.', habilidades: ['funciones', 'gráfica', 'lineal', 'cuadrática'] },
              { codigo: 'OA 2', descripcion: 'Resolver ecuaciones de segundo grado y aplicar la fórmula general.', habilidades: ['ecuaciones', 'segundo grado', 'fórmula general'] },
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Genética y evolución',
            oa: [
              { codigo: 'OA 1', descripcion: 'Explicar los fundamentos de la genética mendeliana y la herencia de caracteres.', habilidades: ['genética', 'herencia', 'mendel'] },
              { codigo: 'OA 2', descripcion: 'Describir el proceso de evolución de las especies según la teoría de Darwin.', habilidades: ['evolución', 'Darwin', 'selección natural'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Chile en el siglo XX',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer los principales acontecimientos políticos de Chile en el siglo XX.', habilidades: ['historia', 'siglo XX', 'política'] },
              { codigo: 'OA 2', descripcion: 'Analizar los cambios sociales, económicos y culturales del siglo XX en Chile.', habilidades: ['análisis', 'cambios sociales', 'economía', 'cultura'] },
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 1° MEDIO
  // ========================================================================
  {
    nombre: '1° Medio',
    asignaturas: [
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'Texto argumentativo y pensamiento crítico',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar textos argumentativos complejos identificando tesis, argumentos y tipos de evidencia.', habilidades: ['análisis', 'argumentación', 'tesis', 'evidencia'] },
              { codigo: 'OA 2', descripcion: 'Producir ensayos argumentativos con estructura clara: introducción, desarrollo y conclusión.', habilidades: ['escritura', 'ensayo', 'estructura', 'argumentación'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Funciones y ecuaciones',
            oa: [
              { codigo: 'OA 1', descripcion: 'Definir y representar funciones polinomiales de grado mayor a 2.', habilidades: ['funciones', 'polinomios', 'grado', 'representación'] },
              { codigo: 'OA 2', descripcion: 'Resolver sistemas de ecuaciones lineales con dos incógnitas.', habilidades: ['sistemas', 'ecuaciones', 'incógnitas', 'resolución'] },
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Química: materia y transformaciones',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer los estados de la materia y las transformaciones físicas y químicas.', habilidades: ['estados', 'transformaciones', 'físicas', 'químicas'] },
              { codigo: 'OA 2', descripcion: 'Describir la tabla periódica y las propiedades de los elementos.', habilidades: ['tabla periódica', 'elementos', 'propiedades'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Chile en el siglo XXI',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar los principales desafíos políticos, sociales y económicos de Chile en el siglo XXI.', habilidades: ['análisis', 'desafíos', 'siglo XXI'] },
              { codigo: 'OA 2', descripcion: 'Reconocer la diversidad cultural y la interculturalidad en Chile contemporáneo.', habilidades: ['diversidad', 'interculturalidad', 'contemporáneo'] },
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 2° MEDIO
  // ========================================================================
  {
    nombre: '2° Medio',
    asignaturas: [
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'Análisis de textos filosóficos y ensayísticos',
            oa: [
              { codigo: 'OA 1', descripcion: 'Leer y analizar textos filosóficos y ensayísticos de autores chilenos e iberoamericanos.', habilidades: ['lectura', 'análisis', 'filosofía', 'ensayo'] },
              { codigo: 'OA 2', descripcion: 'Producir textos reflexivos sobre problemáticas sociales y éticas contemporáneas.', habilidades: ['escritura', 'reflexión', 'problemas sociales', 'ética'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Trigonometría y geometría',
            oa: [
              { codigo: 'OA 1', descripcion: 'Definir y aplicar las razones trigonométricas en triángulos rectángulos.', habilidades: ['trigonometría', 'razones', 'triángulos'] },
              { codigo: 'OA 2', descripcion: 'Resolver problemas de geometría plana y del espacio usando fórmulas de áreas y volúmenes.', habilidades: ['geometría', 'áreas', 'volúmenes', 'fórmulas'] },
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Física: movimiento y fuerzas',
            oa: [
              { codigo: 'OA 1', descripcion: 'Describir los conceptos de velocidad, aceleración y movimiento rectilíneo.', habilidades: ['velocidad', 'aceleración', 'movimiento'] },
              { codigo: 'OA 2', descripcion: 'Explicar las leyes de Newton y su aplicación en la vida cotidiana.', habilidades: ['Newton', 'leyes', 'aplicación'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Globalización y mundo contemporáneo',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar el proceso de globalización y sus efectos en la cultura, economía y política.', habilidades: ['globalización', 'análisis', 'efectos'] },
              { codigo: 'OA 2', descripcion: 'Reconocer los desafíos ambientales globales y las políticas de sustentabilidad.', habilidades: ['medio ambiente', 'sustentabilidad', 'desafíos'] },
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 3° MEDIO
  // ========================================================================
  {
    nombre: '3° Medio',
    asignaturas: [
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'Producción de textos académicos y creativos',
            oa: [
              { codigo: 'OA 1', descripcion: 'Producir textos académicos con estructura formal: tesis, argumentación y conclusión.', habilidades: ['escritura', 'académico', 'estructura', 'tesis'] },
              { codigo: 'OA 2', descripcion: 'Crear textos literarios experimentales aplicando recursos estilísticos avanzados.', habilidades: ['creatividad', 'literatura', 'estilo', 'experimentación'] },
            ],
          },
        ],
      },
      {
        nombre: 'Matemática',
        unidades: [
          {
            numero: 1,
            titulo: 'Probabilidad, estadística y cálculo',
            oa: [
              { codigo: 'OA 1', descripcion: 'Calcular probabilidades de eventos simples y compuestos.', habilidades: ['probabilidad', 'eventos', 'cálculo'] },
              { codigo: 'OA 2', descripcion: 'Interpretar y analizar datos estadísticos usando medidas de tendencia central y dispersión.', habilidades: ['estadística', 'datos', 'medidas'] },
              { codigo: 'OA 3', descripcion: 'Introducción al cálculo diferencial: derivadas y sus aplicaciones.', habilidades: ['cálculo', 'derivadas', 'aplicaciones'] },
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Biología molecular y biotecnología',
            oa: [
              { codigo: 'OA 1', descripcion: 'Explicar los procesos de replicación del ADN y síntesis de proteínas.', habilidades: ['ADN', 'replicación', 'proteínas'] },
              { codigo: 'OA 2', descripcion: 'Reconocer aplicaciones de la biotecnología en la medicina, agricultura y industria.', habilidades: ['biotecnología', 'aplicaciones', 'medicina'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Derechos humanos y democracia',
            oa: [
              { codigo: 'OA 1', descripcion: 'Reconocer los derechos humanos fundamentales y su importancia en sociedades democráticas.', habilidades: ['derechos humanos', 'democracia', 'fundamentos'] },
              { codigo: 'OA 2', descripcion: 'Analizar el rol de la sociedad civil en la protección y promoción de los derechos humanos.', habilidades: ['sociedad civil', 'análisis', 'protección'] },
            ],
          },
        ],
      },
    ],
  },

  // ========================================================================
  // 4° MEDIO
  // ========================================================================
  {
    nombre: '4° Medio',
    asignaturas: [
      {
        nombre: 'Lenguaje y Comunicación',
        unidades: [
          {
            numero: 1,
            titulo: 'Síntesis y evaluación de textos',
            oa: [
              { codigo: 'OA 1', descripcion: 'Sintetizar información de múltiples fuentes para producir textos argumentativos originales.', habilidades: ['síntesis', 'múltiples fuentes', 'originalidad'] },
              { codigo: 'OA 2', descripcion: 'Evaluar críticamente discursos mediáticos y publicitarios.', habilidades: ['evaluación', 'crítica', 'medios', 'discurso'] },
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
              { codigo: 'OA 1', descripcion: 'Aplicar modelos matemáticos para resolver problemas reales de diversas disciplinas.', habilidades: ['modelamiento', 'aplicación', 'interdisciplinario'] },
              { codigo: 'OA 2', descripcion: 'Interpretar y comunicar resultados matemáticos en contextos sociales y científicos.', habilidades: ['interpretación', 'comunicación', 'contexto'] },
            ],
          },
        ],
      },
      {
        nombre: 'Ciencias Naturales',
        unidades: [
          {
            numero: 1,
            titulo: 'Ciencia, tecnología y sociedad',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar el impacto de la ciencia y la tecnología en el desarrollo social y ambiental.', habilidades: ['análisis', 'impacto', 'ciencia', 'tecnología'] },
              { codigo: 'OA 2', descripcion: 'Proponer soluciones a problemas ambientales usando el método científico.', habilidades: ['soluciones', 'método científico', 'medio ambiente'] },
            ],
          },
        ],
      },
      {
        nombre: 'Historia, Geografía y Ciencias Sociales',
        unidades: [
          {
            numero: 1,
            titulo: 'Chile: desafíos para el bicentenario',
            oa: [
              { codigo: 'OA 1', descripcion: 'Analizar los principales desafíos de Chile para consolidar una sociedad justa, equitativa y sustentable.', habilidades: ['análisis', 'desafíos', 'justicia', 'sustentabilidad'] },
              { codigo: 'OA 2', descripcion: 'Proponer alternativas de participación ciudadana para mejorar la calidad de vida en la comunidad.', habilidades: ['participación', 'ciudadana', 'propuestas', 'calidad de vida'] },
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
