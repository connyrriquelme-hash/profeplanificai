import { describe, it, expect, vi } from 'vitest';
import { generateUnidadDidactica, buildFallbackUnidad, type UnidadDidacticaOptions } from '../functions/core/UnidadDidacticaEngine';
import { UnidadDidacticaSchema } from '../schemas/UnidadDidacticaSchema';
import type { AIEngineEnv } from '../functions/core/types';

const MOCK_OPCIONES: UnidadDidacticaOptions = {
  nivel: '2° Básico',
  asignatura: 'Historia, Geografía y Ciencias Sociales',
  metodologiaActiva: 'ABP',
  objetivosAprendizaje: [
    { code: 'HI02 OA 01', text: 'Describir los modos de vida de algunos pueblos originarios de Chile en el periodo precolombino.' },
    { code: 'HI02 OA 02', text: 'Comparar el modo de vida y expresiones culturales de algunos pueblos indígenas presentes en Chile actual.' },
  ],
  temaSugerido: 'Pueblos originarios de Chile',
};

const VALID_AI_RESPONSE = JSON.stringify({
  titulo: 'Investigando a los pueblos originarios de Chile',
  nivel: '2° Básico',
  asignatura: 'Historia, Geografía y Ciencias Sociales',
  metodologiaActiva: 'ABP',
  objetivosAprendizaje: ['HI02 OA 01', 'HI02 OA 02'],
  fases: [
    { nombre: 'Pregunta Guia', descripcion: 'Se plantea la pregunta central del proyecto.', orden: 0 },
    { nombre: 'Investigacion', descripcion: 'Los estudiantes investigan en grupos.', orden: 1 },
  ],
  clases: [
    {
      numero: 1,
      faseAsociada: 'Pregunta Guia',
      tema: '¿Quiénes vivían en Chile hace mucho tiempo?',
      objetivoEspecifico: 'Reconocer que existieron distintos pueblos antes de la llegada de los españoles.',
      estructuraClase: {
        inicio: { tiempoMinutos: 10, descripcion: 'Mostrar imágenes de distintos pueblos originarios.' },
        desarrollo: { tiempoMinutos: 30, descripcion: 'Formar grupos y plantear la pregunta guía del proyecto.' },
        cierre: { tiempoMinutos: 10, descripcion: 'Compartir ideas iniciales en plenario.' },
      },
    },
    {
      numero: 2,
      faseAsociada: 'Investigacion',
      tema: 'Cómo vivían los pueblos originarios',
      objetivoEspecifico: 'Investigar en grupos cómo vivía un pueblo originario asignado.',
      estructuraClase: {
        inicio: { tiempoMinutos: 5, descripcion: 'Recordar la pregunta guía.' },
        desarrollo: { tiempoMinutos: 35, descripcion: 'Investigación en grupos con material impreso.' },
        cierre: { tiempoMinutos: 5, descripcion: 'Registrar avances en una bitácora grupal.' },
      },
    },
  ],
});

// IA con campos débiles: inicio genérico < 40 chars, desarrollo débil < 80 chars,
// y objetivo duplicado en 2 clases — todo esto debe ser enriquecido por enrichUnidad.
const WEAK_AI_RESPONSE = JSON.stringify({
  titulo: 'Investigando a los pueblos originarios de Chile',
  nivel: '2° Básico',
  asignatura: 'Historia, Geografía y Ciencias Sociales',
  metodologiaActiva: 'ABP',
  objetivosAprendizaje: ['HI02 OA 01', 'HI02 OA 02'],
  fases: [
    { nombre: 'Pregunta Guia', descripcion: 'Se plantea la pregunta central del proyecto.', orden: 0 },
    { nombre: 'Investigacion', descripcion: 'Los estudiantes investigan en grupos.', orden: 1 },
  ],
  clases: [
    {
      numero: 1,
      faseAsociada: 'Pregunta Guia',
      tema: '¿Quiénes vivían en Chile?',
      objetivoEspecifico: 'Comprender la historia de los pueblos originarios.',
      estructuraClase: {
        inicio: { tiempoMinutos: 10, descripcion: 'Activación de conocimientos previos.' },
        desarrollo: { tiempoMinutos: 30, descripcion: 'Explicación breve del tema.' },
        cierre: { tiempoMinutos: 10, descripcion: 'Cierre con una reflexión grupal.' },
      },
    },
    {
      numero: 2,
      faseAsociada: 'Investigacion',
      tema: 'Modos de vida',
      objetivoEspecifico: 'Comprender la historia de los pueblos originarios.',
      estructuraClase: {
        inicio: { tiempoMinutos: 5, descripcion: 'Inicio rápido.' },
        desarrollo: { tiempoMinutos: 35, descripcion: 'Investigar.' },
        cierre: { tiempoMinutos: 5, descripcion: 'Cierre.' },
      },
    },
  ],
});

function mockAI(responseText: string): AIEngineEnv {
  return {
    AI: {
      run: vi.fn().mockResolvedValue(responseText),
    } as unknown as Ai,
  };
}

function mockAIParseError(): AIEngineEnv {
  return {
    AI: {
      run: vi.fn().mockResolvedValue('Esto no es JSON en absoluto.'),
    } as unknown as Ai,
  };
}

function mockAINoAI(): AIEngineEnv {
  return {
    AI: undefined as unknown as Ai,
  };
}

describe('UnidadDidacticaEngine.generateUnidadDidactica', () => {
  it('debe devolver la unidad generada cuando la IA responde con JSON válido, con usedFallback=false', async () => {
    const env = mockAI(VALID_AI_RESPONSE);
    const { unidad, usedFallback } = await generateUnidadDidactica(env, MOCK_OPCIONES);

    expect(usedFallback).toBe(false);
    expect(unidad.titulo).toBe('Investigando a los pueblos originarios de Chile');
    expect(unidad.clases.length).toBe(2);
    const validation = UnidadDidacticaSchema.safeParse(unidad);
    expect(validation.success).toBe(true);
  });

  it('REGRESIÓN: debe parsear correctamente cuando env.AI.run() resuelve a { response: string }, la forma real de Cloudflare Workers AI (no solo un string plano)', async () => {
    const env: AIEngineEnv = {
      AI: { run: vi.fn().mockResolvedValue({ response: VALID_AI_RESPONSE }) } as unknown as Ai,
    };
    const { unidad, usedFallback } = await generateUnidadDidactica(env, MOCK_OPCIONES);

    expect(usedFallback).toBe(false);
    expect(unidad.titulo).toBe('Investigando a los pueblos originarios de Chile');
    expect(unidad.clases.length).toBe(2);
  });

  it('debe activar el fallback (usedFallback=true) cuando la IA responde JSON inválido, nunca lanza excepción', async () => {
    const env = mockAIParseError();
    const { unidad, usedFallback } = await generateUnidadDidactica(env, MOCK_OPCIONES);

    expect(usedFallback).toBe(true);
    expect(unidad).toBeDefined();
    expect(unidad.clases.length).toBeGreaterThanOrEqual(2);
    const validation = UnidadDidacticaSchema.safeParse(unidad);
    expect(validation.success).toBe(true);
  });

  it('debe activar el fallback (usedFallback=true) cuando la IA no está configurada, nunca lanza excepción', async () => {
    const env = mockAINoAI();
    const { unidad, usedFallback } = await generateUnidadDidactica(env, MOCK_OPCIONES);

    expect(usedFallback).toBe(true);
    expect(unidad).toBeDefined();
    const validation = UnidadDidacticaSchema.safeParse(unidad);
    expect(validation.success).toBe(true);
  });

  it('debe activar el fallback (usedFallback=true) cuando la IA devuelve una unidad que viola el schema (ej. faseAsociada inexistente)', async () => {
    const invalidResponse = JSON.parse(VALID_AI_RESPONSE);
    invalidResponse.clases[0].faseAsociada = 'Fase Inventada Que No Existe';
    const env = mockAI(JSON.stringify(invalidResponse));

    const { unidad, usedFallback } = await generateUnidadDidactica(env, MOCK_OPCIONES);

    expect(usedFallback).toBe(true);
    const validation = UnidadDidacticaSchema.safeParse(unidad);
    expect(validation.success).toBe(true);
  });

  it('el fallback nunca queda vacío para ninguna metodologiaActiva', async () => {
    const metodologias: UnidadDidacticaOptions['metodologiaActiva'][] = [
      'Tradicional', 'ABP', 'Gamificacion', 'Aula Invertida', 'Design Thinking',
    ];

    for (const metodologiaActiva of metodologias) {
      const opciones: UnidadDidacticaOptions = { ...MOCK_OPCIONES, metodologiaActiva };
      const unidad = buildFallbackUnidad(opciones);

      expect(unidad.fases.length).toBeGreaterThanOrEqual(2);
      expect(unidad.clases.length).toBeGreaterThanOrEqual(2);
      const validation = UnidadDidacticaSchema.safeParse(unidad);
      expect(validation.success).toBe(true);
    }
  });

  it('el fallback nunca lanza excepción aunque no haya objetivos de aprendizaje', () => {
    const opciones: UnidadDidacticaOptions = { ...MOCK_OPCIONES, objetivosAprendizaje: [] };
    const unidad = buildFallbackUnidad(opciones);

    const validation = UnidadDidacticaSchema.safeParse(unidad);
    expect(validation.success).toBe(true);
  });

  it('no debe copiar el texto crudo del OA en el título del fallback más allá de TITULO_MAX', async () => {
    const largoOA = { ...MOCK_OPCIONES, temaSugerido: 'A'.repeat(200) };
    const env = mockAINoAI();
    const { unidad } = await generateUnidadDidactica(env, largoOA);

    expect(unidad.titulo.length).toBeLessThanOrEqual(120);
  });
});

describe('UnidadDidacticaEngine — enrich parcial', () => {
  it('debe reemplazar inicios débiles (< 40 chars) con los del fallback', async () => {
    const env = mockAI(WEAK_AI_RESPONSE);
    const { unidad, usedFallback } = await generateUnidadDidactica(env, MOCK_OPCIONES);

    expect(usedFallback).toBe(false);
    expect(unidad.clases[0].estructuraClase.inicio.descripcion.length).toBeGreaterThan(0);
    expect(unidad.clases[1].estructuraClase.inicio.descripcion.length).toBeGreaterThan(0);
  });

  it('debe reemplazar desarrollos débiles (< 80 chars) con los del fallback', async () => {
    const env = mockAI(WEAK_AI_RESPONSE);
    const { unidad, usedFallback } = await generateUnidadDidactica(env, MOCK_OPCIONES);

    expect(usedFallback).toBe(false);
    expect(unidad.clases[0].estructuraClase.desarrollo.descripcion.length).toBeGreaterThan(0);
  });

  it('debe reemplazar objetivos duplicados con el del fallback', async () => {
    const env = mockAI(WEAK_AI_RESPONSE);
    const { unidad, usedFallback } = await generateUnidadDidactica(env, MOCK_OPCIONES);

    expect(usedFallback).toBe(false);
    const objetivos = unidad.clases.map((c) => c.objetivoEspecifico.trim().toLowerCase());
    const unicos = new Set(objetivos);
    expect(unicos.size).toBe(objetivos.length);
  });

  it('debe preservar campos fuertes de la IA cuando no están débiles', async () => {
    const env = mockAI(VALID_AI_RESPONSE);
    const { unidad, usedFallback } = await generateUnidadDidactica(env, MOCK_OPCIONES);

    expect(usedFallback).toBe(false);
    expect(unidad.titulo).toBe('Investigando a los pueblos originarios de Chile');
    expect(unidad.fases.length).toBe(2);
    expect(unidad.fases[0].nombre).toBe('Pregunta Guia');
  });

  it('la unidad enriquecida debe pasar validación del schema', async () => {
    const env = mockAI(WEAK_AI_RESPONSE);
    const { unidad, usedFallback } = await generateUnidadDidactica(env, MOCK_OPCIONES);

    expect(usedFallback).toBe(false);
    const validation = UnidadDidacticaSchema.safeParse(unidad);
    expect(validation.success).toBe(true);
  });

  it('debe mantener la faseAsociada correcta después del enrich', async () => {
    const env = mockAI(WEAK_AI_RESPONSE);
    const { unidad, usedFallback } = await generateUnidadDidactica(env, MOCK_OPCIONES);

    expect(usedFallback).toBe(false);
    const nombresFases = new Set(unidad.fases.map((f) => f.nombre));
    for (const clase of unidad.clases) {
      expect(nombresFases.has(clase.faseAsociada)).toBe(true);
    }
  });
});
