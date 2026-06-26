/*
  Datos curriculares para la Biblioteca Creativa.

  MODO DESARROLLO:
    Usa los datos mock incluidos abajo (17 OAs con indicadores y habilidades).

  MODO PRODUCCIÓN (Cloudflare D1):
    El proyecto ya tiene D1 configurado (wrangler.toml → DB binding)
    con endpoint GET /api/objectives que consulta las tablas:
      objectives (code, official_text, type, course_id, subject_id, axis_id)
      courses (code, name, sort_order)
      subjects (id, name, normalized_name)
      axes (name)

    Para activar D1 basta con que el helper USE_D1 = true y las funciones
    asíncronas fetchObjectivesFromAPI llamarán al endpoint real.

    Pendiente: agregar columnas indicators (JSON) y skills (JSON) a la tabla
    objectives mediante migración D1:
      ALTER TABLE objectives ADD COLUMN indicators TEXT DEFAULT '[]';
      ALTER TABLE objectives ADD COLUMN skills TEXT DEFAULT '[]';
*/

const USE_D1 = false; // Cambiar a true cuando D1 tenga datos de indicadores/habilidades

export interface LearningObjective {
  id: string;
  code: string;
  level: string;
  subject: string;
  axis?: string;
  source?: string;
  text: string;
  indicators: string[];
  skills: string[];
}

// ── D1 API connector ─────────────────────────────────────────────────────────

interface D1ObjectiveRow {
  code: string;
  official_text: string;
  axis_name: string;
  course_code: string;
  course_name: string;
  subject_name: string;
}

async function fetchObjectivesFromAPI(params: { course?: string; subject?: string; q?: string }): Promise<LearningObjective[]> {
  const query = new URLSearchParams();
  if (params.course) query.set('course', params.course);
  if (params.subject) query.set('subject', params.subject);
  if (params.q) query.set('q', params.q);
  query.set('limit', '200');

  const res = await fetch(`/api/objectives?${query.toString()}`);
  if (!res.ok) throw new Error(`Error al cargar objetivos: ${res.status}`);

  const json = await res.json() as { data: D1ObjectiveRow[] };
  return json.data.map((row, idx) => ({
    id: `${row.course_code}-${row.subject_name}-${row.code}-${idx}`,
    code: row.code,
    level: row.course_name,
    subject: row.subject_name,
    axis: row.axis_name || undefined,
    text: row.official_text,
    indicators: [],  // TODO: leer de columna indicators cuando exista en D1
    skills: [],      // TODO: leer de columna skills cuando exista en D1
  }));
}

// ── Mock data (fallback para desarrollo) ─────────────────────────────────────

const mockData: LearningObjective[] = [
  { id: '1b-len-oa2', code: 'OA 2', level: '1° Básico', subject: 'Lenguaje y Comunicación', axis: 'Lectura', text: 'Leer palabras aisladas y combinaciones consonánticas directas.', indicators: ['Lee palabras con todas las letras del alfabeto', 'Lee combinaciones (bra, cre, dri, flo, gru)', 'Lee oraciones breves con fluidez inicial'], skills: ['Decodificación', 'Fluidez lectora', 'Conciencia fonológica'] },
  { id: '1b-len-oa5', code: 'OA 5', level: '1° Básico', subject: 'Lenguaje y Comunicación', axis: 'Escritura', text: 'Escribir oraciones simples utilizando combinaciones consonánticas trabajadas.', indicators: ['Escribe oraciones de 3-5 palabras', 'Usa mayúscula al inicio y punto final', 'Respeta la secuencia de sonidos en palabras'], skills: ['Producción de textos', 'Conciencia fonológica', 'Uso de convenciones'] },
  { id: '1b-len-oa8', code: 'OA 8', level: '1° Básico', subject: 'Lenguaje y Comunicación', axis: 'Lectura', text: 'Comprender textos breves, extrayendo información explícita.', indicators: ['Responde preguntas literales sobre el texto', 'Identifica personajes y acciones principales', 'Ordena secuencias de hasta 3 eventos'], skills: ['Comprensión lectora', 'Localización de información', 'Secuenciación'] },
  { id: '2b-len-oa3', code: 'OA 3', level: '2° Básico', subject: 'Lenguaje y Comunicación', axis: 'Lectura', text: 'Leer textos breves con fluidez, comprendiendo información explícita e implícita.', indicators: ['Lee 40 palabras por minuto', 'Responde preguntas inferenciales', 'Identifica propósito del texto'], skills: ['Fluidez lectora', 'Comprensión inferencial', 'Propósito del autor'] },
  { id: '2b-len-oa12', code: 'OA 12', level: '2° Básico', subject: 'Lenguaje y Comunicación', axis: 'Escritura', text: 'Producir textos narrativos breves con estructura clara de inicio, desarrollo y final.', indicators: ['Escribe un cuento breve', 'Respeta la estructura narrativa', 'Usa conectores de secuencia (primero, luego, al final)'], skills: ['Producción narrativa', 'Estructura textual', 'Cohesión'] },
  { id: '1b-mat-oa1', code: 'OA 1', level: '1° Básico', subject: 'Matemática', axis: 'Números', text: 'Contar números del 0 al 100 de 1 en 1, de 2 en 2, de 5 en 5 y de 10 en 10.', indicators: ['Cuenta hacia adelante desde cualquier número', 'Cuenta de 2 en 2 hasta 20', 'Cuenta de 5 en 5 y 10 en 10 hasta 100'], skills: ['Conteo', 'Patrones numéricos', 'Secuencia'] },
  { id: '1b-mat-oa6', code: 'OA 6', level: '1° Básico', subject: 'Matemática', axis: 'Números', text: 'Resolver problemas de adición y sustracción con números hasta 20.', indicators: ['Representa problemas con dibujos o material concreto', 'Resuelve problemas de cambio y combinación', 'Explica el procedimiento usado'], skills: ['Resolución de problemas', 'Representación', 'Comunicación matemática'] },
  { id: '2b-mat-oa3', code: 'OA 3', level: '2° Básico', subject: 'Matemática', axis: 'Números', text: 'Comparar y ordenar números del 0 al 100 según valor posicional.', indicators: ['Identifica decenas y unidades', 'Compara usando >, <, =', 'Ordena números en ascendente y descendente'], skills: ['Valor posicional', 'Comparación numérica', 'Orden'] },
  { id: '2b-mat-oa9', code: 'OA 9', level: '2° Básico', subject: 'Matemática', axis: 'Números', text: 'Demostrar que comprenden la multiplicación como suma repetida.', indicators: ['Representa multiplicaciones como sumas repetidas', 'Resuelve problemas de multiplicación simple', 'Usa material concreto para agrupar'], skills: ['Multiplicación', 'Representación', 'Resolución de problemas'] },
  { id: '1b-cien-oa1', code: 'OA 1', level: '1° Básico', subject: 'Ciencias Naturales', axis: 'Ciencias de la Vida', text: 'Reconocer y describir las características de los seres vivos (animales y plantas).', indicators: ['Clasifica animales según hábitat', 'Describe partes de una planta', 'Compara seres vivos e inertes'], skills: ['Observación', 'Clasificación', 'Comparación'] },
  { id: '1b-hist-oa2', code: 'OA 2', level: '1° Básico', subject: 'Historia, Geografía y Cs. Sociales', axis: 'Historia', text: 'Secuenciar cronológicamente eventos significativos de su historia personal y familiar.', indicators: ['Ordena fotografías de etapas de su vida', 'Nombra fechas importantes familiares', 'Relata eventos en orden temporal'], skills: ['Orientación temporal', 'Secuenciación', 'Narrativa histórica'] },
  { id: 'pk-len-oa1', code: 'OA 1', level: 'Prekinder', subject: 'Lenguaje Verbal', text: 'Expresarse oralmente con claridad usando vocabulario variado en situaciones cotidianas.', indicators: ['Responde preguntas simples sobre experiencias personales', 'Usa palabras nuevas en conversaciones guiadas', 'Describe imágenes con frases de 3-4 palabras'], skills: ['Comunicación oral', 'Vocabulario', 'Descripción'] },
  { id: 'kin-mat-oa4', code: 'OA 4', level: 'Kinder', subject: 'Pensamiento Matemático', text: 'Reconocer y nombrar números hasta el 20, cuantificar colecciones y resolver problemas simples.', indicators: ['Cuenta hasta 20 en secuencia', 'Asocia número a cantidad hasta 10', 'Resuelve problemas de agregar y quitar con material concreto'], skills: ['Conteo', 'Cuantificación', 'Resolución de problemas'] },
  { id: '1m-len-oa1', code: 'OA 1', level: '1° Medio', subject: 'Lenguaje y Comunicación', axis: 'Lectura', text: 'Leer y analizar obras literarias del canon, interpretando recursos literarios y temáticas.', indicators: ['Analiza personajes y su evolución', 'Identifica recursos retóricos en poemas', 'Escribe reseñas críticas'], skills: ['Análisis literario avanzado', 'Identificación de recursos', 'Pensamiento crítico'] },
  { id: '1m-mat-oa3', code: 'OA 3', level: '1° Medio', subject: 'Matemática', axis: 'Álgebra', text: 'Resolver ecuaciones lineales con coeficientes enteros y fraccionarios.', indicators: ['Despeja la incógnita en ecuaciones simples', 'Resuelve ecuaciones con paréntesis', 'Verifica soluciones sustituyendo'], skills: ['Ecuaciones', 'Álgebra', 'Verificación'] },
  { id: '3tp-prog-oa1', code: 'OA 1', level: '3° Medio TP', subject: 'Programación', axis: 'Algoritmia', text: 'Desarrollar algoritmos utilizando estructuras de control básicas.', indicators: ['Diseña algoritmos con pseudocódigo', 'Implementa condicionales y bucles', 'Prueba y depura código simple'], skills: ['Algoritmia', 'Lógica de programación', 'Depuración'] },
  { id: '3tp-admin-oa1', code: 'OA 1', level: '3° Medio TP', subject: 'Administración', axis: 'Gestión', text: 'Aplicar principios de administración y gestión empresarial en contextos simulados.', indicators: ['Identifica funciones administrativas básicas', 'Elabora un organigrama empresarial', 'Aplica conceptos de planificación estratégica'], skills: ['Gestión empresarial', 'Organización', 'Planificación'] },
];

// ── Helpers (mock + D1) ──────────────────────────────────────────────────────

export function getLevels(): string[] {
  const standardLevels = ['Prekinder', 'Kinder', '1° Básico', '2° Básico', '3° Básico', '4° Básico', '5° Básico', '6° Básico', '1° Medio', '2° Medio', '3° Medio', '4° Medio', '3° Medio TP', '4° Medio TP'];
  const set = new Set(mockData.map(o => o.level));
  for (const l of standardLevels) set.add(l);
  return Array.from(set).sort();
}

export function getSubjectsByLevel(level: string): string[] {
  const subjects = mockData.filter(o => o.level === level).map(o => o.subject);
  return Array.from(new Set(subjects)).sort();
}

export function getObjectives(level: string, subject: string): LearningObjective[] {
  if (USE_D1) {
    // TODO: usar fetchObjectivesFromAPI({ course: level, subject }) en su lugar
    // Por ahora devuelve mock mientras D1 no tenga indicators/skills poblados
  }
  return mockData.filter(o => o.level === level && o.subject === subject);
}

export function searchObjectives(query: string, level?: string, subject?: string): LearningObjective[] {
  if (USE_D1) {
    // TODO: usar fetchObjectivesFromAPI({ course: level, subject, q: query })
  }
  const q = query.toLowerCase();
  return mockData.filter(o => {
    if (level && o.level !== level) return false;
    if (subject && o.subject !== subject) return false;
    return o.code.toLowerCase().includes(q) || o.text.toLowerCase().includes(q) || o.indicators.some(i => i.toLowerCase().includes(q));
  });
}

export function getObjectiveById(id: string): LearningObjective | undefined {
  return mockData.find(o => o.id === id);
}


