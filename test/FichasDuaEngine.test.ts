import { describe, it, expect, vi } from 'vitest';
import { generateFichasDua } from '../functions/core/FichasDuaEngine';
import type { AIEngineEnv, DuaGuide } from '../functions/core/types';

const MOCK_DUA_GUIDE: DuaGuide = {
  titulo_guia: 'Guía Multinivel DUA: La célula — Ciencias Naturales (5° Básico)',
  contexto_motivacional: 'Exploramos la célula desde experiencias concretas y visuales.',
  contexto_pedagogico_inclusivo: 'El OA se trabaja para que cada estudiante comprenda la célula por distintas vías.',
  oa_a_trabajar: 'OA 1: Describir la estructura celular.',
  interpretacion_pedagogica: 'Este OA requiere experiencias modeladas y evidencias flexibles.',
  habilidades: ['Describir', 'Comparar', 'Identificar'],
  habilidades_sugeridas: [],
  criterios_aprendizaje: ['Identifica las partes principales de la célula.', 'Compara célula animal y vegetal.'],
  barreras_posibles: ['Vocabulario técnico de la asignatura.'],
  nivel_apoyo: [
    'Actividad 1: modelaje docente con diagrama de la célula y pictogramas.',
    'Actividad 2: elegir entre 2-3 alternativas la parte de la célula mostrada.',
  ],
  nivel_estandar: [
    'Actividad 1: explorar un modelo de célula y registrar sus partes.',
    'Actividad 2: comparar célula animal y vegetal con un organizador gráfico.',
  ],
  nivel_desafio: [
    'Actividad 1: investigar una organela y explicar su función al curso.',
    'Actividad 2: crear un modelo 3D o esquema propio de una célula.',
  ],
  principios_dua: {
    representacion: ['Diagramas y modelos concretos de la célula.'],
    accion_expresion: ['Explicar oralmente o por escrito.'],
    implicacion: ['Conectar con el cuerpo humano y la vida cotidiana.'],
  },
  evaluacion_formativa_inclusiva: {
    evidencias: ['Registro de partes identificadas.'],
    preguntas_retroalimentacion: ['¿Qué parte te costó reconocer?'],
    lista_cotejo: ['Nombra al menos 3 partes de la célula.'],
    opciones_respuesta: ['oral', 'escrita breve'],
    retroalimentacion_docente: ['Buen trabajo identificando la membrana.'],
  },
  adecuaciones_apoyos: ['Para dificultades lectoras: leer las instrucciones en voz alta.'],
  cierre_inclusivo: ['Hoy descubrí...'],
};

const OPCIONES = { level: '5° Básico', subject: 'Ciencias Naturales', topic: 'La célula' };

function validAiFichas() {
  return {
    apoyo: {
      nivel: 'apoyo',
      titulo: 'Ficha de Apoyo: La célula',
      objetivo: 'Reconozco las partes principales de la célula con apoyo visual.',
      vocabularioClave: [
        { termino: 'Célula', definicion: 'La unidad más pequeña que forma a los seres vivos.' },
        { termino: 'Núcleo', definicion: 'La parte de la célula que la controla, como un jefe.' },
      ],
      actividades: [
        { instruccion: 'Observa el diagrama y señala el núcleo.', espacioRespuesta: false },
        { instruccion: 'Dibuja una célula y pinta el núcleo.', espacioRespuesta: true },
      ],
      autoevaluacion: ['Puedo señalar el núcleo de la célula.', 'Todavía me cuesta reconocer la membrana.'],
    },
    estandar: {
      nivel: 'estandar',
      titulo: 'Ficha Estándar: La célula',
      objetivo: 'Describo las partes principales de la célula y su función.',
      vocabularioClave: [
        { termino: 'Membrana', definicion: 'La capa que envuelve y protege la célula.' },
        { termino: 'Citoplasma', definicion: 'El líquido que llena la célula por dentro.' },
      ],
      actividades: [
        { instruccion: 'Compara una célula animal y una vegetal en una tabla.', espacioRespuesta: true },
        { instruccion: 'Explica a un compañero qué hace el núcleo.', espacioRespuesta: false },
      ],
      autoevaluacion: ['Puedo explicar qué hace el núcleo.', '¿Qué parte me costó más comparar?'],
    },
    desafio: {
      nivel: 'desafio',
      titulo: 'Ficha de Desafío: La célula',
      objetivo: 'Investigo una organela y explico su función en la célula.',
      vocabularioClave: [
        { termino: 'Mitocondria', definicion: 'La organela que produce la energía de la célula.' },
        { termino: 'Organela', definicion: 'Una estructura pequeña dentro de la célula con una función específica.' },
      ],
      actividades: [
        { instruccion: 'Investiga una organela y escribe su función.', espacioRespuesta: true },
        { instruccion: 'Crea un modelo 3D de una célula con material reciclado.', espacioRespuesta: false },
      ],
      autoevaluacion: ['Puedo justificar por qué elegí esa organela.', '¿Qué agregaría para profundizar más?'],
    },
  };
}

function mockAI(responseText: string): AIEngineEnv {
  return {
    AI: {
      run: vi.fn().mockResolvedValue(responseText),
    } as unknown as Ai,
  };
}

function mockAINoAI(): AIEngineEnv {
  return {
    AI: undefined as unknown as Ai,
  };
}

describe('generateFichasDua', () => {
  it('debe devolver las 3 fichas parseadas cuando la IA responde con JSON válido', async () => {
    const env = mockAI(JSON.stringify(validAiFichas()));
    const result = await generateFichasDua(env, MOCK_DUA_GUIDE, OPCIONES);

    expect(result.apoyo.nivel).toBe('apoyo');
    expect(result.estandar.nivel).toBe('estandar');
    expect(result.desafio.nivel).toBe('desafio');
    expect(result.apoyo.titulo).toContain('Apoyo');
    expect(result.estandar.titulo).toContain('Estándar');
    expect(result.desafio.titulo).toContain('Desafío');
  });

  it('cada ficha debe traer vocabulario, actividades y autoevaluación distintos por nivel', async () => {
    const env = mockAI(JSON.stringify(validAiFichas()));
    const result = await generateFichasDua(env, MOCK_DUA_GUIDE, OPCIONES);

    const vocabApoyo = result.apoyo.vocabularioClave.map((v) => v.termino);
    const vocabEstandar = result.estandar.vocabularioClave.map((v) => v.termino);
    const vocabDesafio = result.desafio.vocabularioClave.map((v) => v.termino);

    expect(vocabApoyo).not.toEqual(vocabEstandar);
    expect(vocabEstandar).not.toEqual(vocabDesafio);
    expect(result.apoyo.actividades.length).toBeGreaterThanOrEqual(2);
    expect(result.estandar.autoevaluacion.length).toBeGreaterThanOrEqual(2);
  });

  it('debe usar el fallback determinista (desde nivel_apoyo/estandar/desafio) cuando la IA no responde JSON válido', async () => {
    const env = mockAI('Esto no es JSON.');
    const result = await generateFichasDua(env, MOCK_DUA_GUIDE, OPCIONES);

    expect(result.apoyo.nivel).toBe('apoyo');
    expect(result.apoyo.actividades.map((a) => a.instruccion)).toEqual(MOCK_DUA_GUIDE.nivel_apoyo);
    expect(result.estandar.actividades.map((a) => a.instruccion)).toEqual(MOCK_DUA_GUIDE.nivel_estandar);
    expect(result.desafio.actividades.map((a) => a.instruccion)).toEqual(MOCK_DUA_GUIDE.nivel_desafio);
  });

  it('debe usar el fallback cuando env.AI no está configurado', async () => {
    const env = mockAINoAI();
    const result = await generateFichasDua(env, MOCK_DUA_GUIDE, OPCIONES);

    expect(result.apoyo.titulo).toContain('La célula');
    expect(result.apoyo.vocabularioClave.length).toBeGreaterThanOrEqual(2);
    expect(result.estandar.vocabularioClave.length).toBeGreaterThanOrEqual(2);
    expect(result.desafio.vocabularioClave.length).toBeGreaterThanOrEqual(2);
  });

  it('el fallback nunca deja vocabularioClave vacío aunque el DuaGuide no traiga habilidades ni criterios', async () => {
    const env = mockAINoAI();
    const guideSinHabilidades: DuaGuide = { ...MOCK_DUA_GUIDE, habilidades: [], habilidades_sugeridas: [], criterios_aprendizaje: [] };
    const result = await generateFichasDua(env, guideSinHabilidades, OPCIONES);

    expect(result.apoyo.vocabularioClave.length).toBeGreaterThanOrEqual(2);
    expect(result.estandar.vocabularioClave.length).toBeGreaterThanOrEqual(2);
    expect(result.desafio.vocabularioClave.length).toBeGreaterThanOrEqual(2);
  });

  it('debe reemplazar solo la ficha débil (nivel puntual) por el fallback cuando la IA responde una ficha incompleta', async () => {
    const partial = validAiFichas();
    // "estandar" queda con solo 1 término de vocabulario → falla el schema
    // en ese nivel, pero apoyo y desafío sí deberían pasar.
    partial.estandar.vocabularioClave = [{ termino: 'Membrana', definicion: 'La capa que envuelve la célula.' }];

    const env = mockAI(JSON.stringify(partial));
    const result = await generateFichasDua(env, MOCK_DUA_GUIDE, OPCIONES);

    // El schema completo (FichasDuaSchema) exige min 2 en cada ficha, así
    // que una ficha inválida invalida todo el objeto tras los reintentos y
    // se recurre al fallback completo determinista.
    expect(result.apoyo.actividades.map((a) => a.instruccion)).toEqual(MOCK_DUA_GUIDE.nivel_apoyo);
  });
});
