import { describe, it, expect, vi } from 'vitest';
import type { Ai } from 'cloudflare:workers';
import type { AIEngineEnv } from '../functions/core/types';

import { generateBitacora, type BitacoraEngineInput } from '../functions/core/BitacoraEngine';
import { generateSemaforo, type SemaforoEngineInput } from '../functions/core/SemaforoEngine';
import { generateTicketSalida, type TicketSalidaEngineInput } from '../functions/core/TicketSalidaEngine';
import { generateListaCotejo, type ListaCotejoEngineInput } from '../functions/core/ListaCotejoEngine';
import { generateFormato321, type Format321EngineInput } from '../functions/core/Format321Engine';

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

const BASE_BITACORA_INPUT: BitacoraEngineInput = {
  level: '4° Básico',
  subject: 'Ciencias Naturales',
  objectiveCode: 'CN04 OA 01',
  objectiveText: 'Investigar cómo los organismos obtienen la energía que necesitan para vivir.',
  topic: 'fotosíntesis',
  indicators: ['Describe el proceso de fotosíntesis'],
};

const BASE_SEMAFORO_INPUT: SemaforoEngineInput = {
  level: '4° Básico',
  subject: 'Ciencias Naturales',
  objectiveCode: 'CN04 OA 01',
  objectiveText: 'Investigar cómo los organismos obtienen la energía que necesitan para vivir.',
  topic: 'fotosíntesis',
  indicators: ['Describe el proceso de fotosíntesis'],
};

const BASE_TICKET_INPUT: TicketSalidaEngineInput = {
  level: '4° Básico',
  subject: 'Ciencias Naturales',
  objectiveCode: 'CN04 OA 01',
  objectiveText: 'Investigar cómo los organismos obtienen la energía que necesitan para vivir.',
  topic: 'fotosíntesis',
  indicators: ['Describe el proceso de fotosíntesis'],
};

const BASE_LISTA_INPUT: ListaCotejoEngineInput = {
  level: '4° Básico',
  subject: 'Ciencias Naturales',
  objectiveCode: 'CN04 OA 01',
  objectiveText: 'Investigar cómo los organismos obtienen la energía que necesitan para vivir.',
  topic: 'fotosíntesis',
  indicators: ['Describe el proceso de fotosíntesis'],
};

const BASE_FORMATO_INPUT: Format321EngineInput = {
  level: '4° Básico',
  subject: 'Ciencias Naturales',
  objectiveCode: 'CN04 OA 01',
  objectiveText: 'Investigar cómo los organismos obtienen la energía que necesitan para vivir.',
  topic: 'fotosíntesis',
  indicators: ['Describe el proceso de fotosíntesis'],
};

// ─── BitacoraEngine enrich ───

describe('BitacoraEngine — enrich profundo', () => {
  const WEAK_BITACORA = JSON.stringify({
    hipotesis: 'Escribe tu hipótesis',
    observaciones: 'Escribe tus observaciones',
    resultados: 'Escribe tus resultados',
    conclusion: 'Escribe tu conclusión',
  });

  const STRONG_BITACORA = JSON.stringify({
    hipotesis: 'Antes de observar las plantas, predice qué parte de la fotosíntesis es la que más influye en el crecimiento y por qué lo piensas.',
    observaciones: 'Durante la actividad de fotosíntesis con luz y oscuridad, registra qué hojas cambian de color y qué gases produce la fotosíntesis.',
    resultados: 'Organiza en una tabla comparativa los resultados de tus mediciones de oxígeno durante la fotosíntesis en plantas expuestas a luz vs. oscuridad.',
    conclusion: 'Responde si se cumplió tu hipótesis sobre la fotosíntesis: ¿qué parte del proceso fue más importante según tu evidencia?',
  });

  it('reemplaza consignas genéricas con fallback cuando la IA devuelve contenido débil', async () => {
    const env = mockAI(WEAK_BITACORA);
    const result = await generateBitacora(env, BASE_BITACORA_INPUT);

    expect(result.hipotesis).not.toBe('Escribe tu hipótesis');
    expect(result.hipotesis.length).toBeGreaterThan(30);
    expect(result.observaciones).not.toBe('Escribe tus observaciones');
    expect(result.resultados).not.toBe('Escribe tus resultados');
    expect(result.conclusion).not.toBe('Escribe tu conclusión');
  });

  it('preserva contenido fuerte y específico de la IA', async () => {
    const env = mockAI(STRONG_BITACORA);
    const result = await generateBitacora(env, BASE_BITACORA_INPUT);

    expect(result.hipotesis).toContain('fotosíntesis');
    expect(result.observaciones).toContain('luz');
    expect(result.resultados).toContain('tabla');
    expect(result.conclusion).toContain('fotosíntesis');
  });

  it('usa fallback completo cuando no hay AI configurada', async () => {
    const env = mockAINoAI();
    const result = await generateBitacora(env, BASE_BITACORA_INPUT);

    expect(result.hipotesis.length).toBeGreaterThan(20);
    expect(result.observaciones.length).toBeGreaterThan(20);
    expect(result.resultados.length).toBeGreaterThan(20);
    expect(result.conclusion.length).toBeGreaterThan(20);
  });
});

// ─── SemaforoEngine enrich ───

describe('SemaforoEngine — enrich profundo', () => {
  const WEAK_SEMAFORO = JSON.stringify({
    title: 'Semáforo',
    aspects: [
      { description: 'Concepto general', levels: '🔴 No sé — 🟡 Algo sé — 🟢 Lo sé bien' },
      { description: 'Participación', levels: '🔴 No participo — 🟡 Participo algo — 🟢 Participo bien' },
      { description: 'Comprensión', levels: '🔴 No comprendo — 🟡 Comprendo algo — 🟢 Comprendo bien' },
    ],
  });

  const STRONG_SEMAFORO = JSON.stringify({
    title: 'Semáforo de Comprensión: Fotosíntesis y Energía',
    aspects: [
      {
        description: 'Reconozco las partes de la planta que participan en la fotosíntesis',
        levels: '🔴 No logro identificar las partes — 🟡 Reconozco hojas y tallo — 🟢 Identifico hojas, tallo y raíz y explico su función',
      },
      {
        description: 'Explico con mis palabras cómo la luz solar se transforma en energía en las plantas',
        levels: '🔴 No puedo explicar el proceso — 🟡 Explico que la planta usa la luz — 🟢 Explico el proceso con luz, agua y CO₂',
      },
      {
        description: 'Doy un ejemplo de cómo la fotosíntesis afecta mi vida cotidiana',
        levels: '🔴 No logro dar un ejemplo — 🟡 Pienso en un ejemplo con ayuda — 🟢 Identifico un ejemplo concreto sin ayuda',
      },
    ],
  });

  it('reemplaza descripciones genéricas con fallback', async () => {
    const env = mockAI(WEAK_SEMAFORO);
    const result = await generateSemaforo(env, BASE_SEMAFORO_INPUT);

    expect(result.aspects.length).toBeGreaterThanOrEqual(3);
    for (const aspect of result.aspects) {
      expect(aspect.description.length).toBeGreaterThan(15);
      expect(aspect.indicator).toContain('🔴');
      expect(aspect.indicator).toContain('🟡');
      expect(aspect.indicator).toContain('🟢');
    }
  });

  it('preserva contenido fuerte y específico de la IA', async () => {
    const env = mockAI(STRONG_SEMAFORO);
    const result = await generateSemaforo(env, BASE_SEMAFORO_INPUT);

    expect(result.title).toContain('Fotosíntesis');
    expect(result.aspects[0].description).toContain('planta');
    expect(result.aspects[0].indicator).toContain('🔴');
    expect(result.aspects[0].indicator).toContain('🟡');
    expect(result.aspects[0].indicator).toContain('🟢');
  });

  it('usa fallback completo cuando no hay AI configurada', async () => {
    const env = mockAINoAI();
    const result = await generateSemaforo(env, BASE_SEMAFORO_INPUT);

    expect(result.aspects.length).toBeGreaterThanOrEqual(3);
    expect(result.colors.length).toBe(3);
    expect(result.title.length).toBeGreaterThan(5);
  });
});

// ─── TicketSalidaEngine enrich ───

describe('TicketSalidaEngine — enrich profundo', () => {
  const WEAK_TICKET = JSON.stringify({
    title: 'Ticket',
    questions: [
      { question: '¿Qué aprendiste?' },
      { question: '¿Te gustó la clase?' },
      { question: '¿Qué te pareció?' },
    ],
  });

  const STRONG_TICKET = JSON.stringify({
    title: 'Ticket de Salida: Fotosíntesis',
    questions: [
      { question: '¿Qué partes de la planta intervienen en la fotosíntesis y qué hace cada una?' },
      { question: 'Da un ejemplo de cómo la fotosíntesis afecta la vida cotidiana de los seres humanos.' },
      { question: '¿Qué pasaría con las plantas si no recibieran luz solar durante una semana completa?' },
    ],
  });

  it('reemplaza preguntas genéricas con fallback', async () => {
    const env = mockAI(WEAK_TICKET);
    const result = await generateTicketSalida(env, BASE_TICKET_INPUT);

    expect(result.questions.length).toBeGreaterThanOrEqual(3);
    for (const q of result.questions) {
      expect(q.question.length).toBeGreaterThan(15);
    }
  });

  it('preserva contenido fuerte y específico de la IA', async () => {
    const env = mockAI(STRONG_TICKET);
    const result = await generateTicketSalida(env, BASE_TICKET_INPUT);

    expect(result.title).toContain('Fotosíntesis');
    expect(result.questions[0].question).toContain('planta');
    expect(result.questions[1].question).toContain('ejemplo');
  });

  it('usa fallback completo cuando no hay AI configurada', async () => {
    const env = mockAINoAI();
    const result = await generateTicketSalida(env, BASE_TICKET_INPUT);

    expect(result.questions.length).toBeGreaterThanOrEqual(3);
    expect(result.title.length).toBeGreaterThan(5);
    expect(result.instructions.length).toBeGreaterThan(10);
  });
});

// ─── ListaCotejoEngine enrich ───

describe('ListaCotejoEngine — enrich profundo', () => {
  const WEAK_LISTA = JSON.stringify({
    title: 'Autoevaluación',
    criteria: [
      { description: 'Comprendo el tema' },
      { description: 'Participo en clase' },
      { description: 'Hago la tarea' },
      { description: 'Presto atención' },
      { description: 'Soy bueno' },
    ],
  });

  const STRONG_LISTA = JSON.stringify({
    title: 'Lista de Cotejo: Fotosíntesis y Obtención de Energía',
    criteria: [
      { description: 'Reconozco las partes de la planta que participan en la fotosíntesis.' },
      { description: 'Puedo explicar con mis palabras cómo la luz solar se transforma en energía.' },
      { description: 'Identifiqué un ejemplo de la fotosíntesis en mi vida cotidiana.' },
      { description: 'Resolví correctamente un ejercicio sobre las fases de la fotosíntesis.' },
      { description: 'Puedo explicarle a un compañero qué es la fotosíntesis y por qué es importante.' },
    ],
  });

  it('reemplaza criterios genéricos con fallback', async () => {
    const env = mockAI(WEAK_LISTA);
    const result = await generateListaCotejo(env, BASE_LISTA_INPUT);

    expect(result.criteria.length).toBeGreaterThanOrEqual(5);
    for (const c of result.criteria) {
      expect(c.description.length).toBeGreaterThan(20);
    }
  });

  it('preserva contenido fuerte y específico de la IA', async () => {
    const env = mockAI(STRONG_LISTA);
    const result = await generateListaCotejo(env, BASE_LISTA_INPUT);

    expect(result.title).toContain('Fotosíntesis');
    expect(result.criteria[0].description).toContain('planta');
    expect(result.criteria[1].description).toContain('palabras');
    expect(result.criteria.length).toBe(5);
  });

  it('usa fallback completo cuando no hay AI configurada', async () => {
    const env = mockAINoAI();
    const result = await generateListaCotejo(env, BASE_LISTA_INPUT);

    expect(result.criteria.length).toBeGreaterThanOrEqual(5);
    expect(result.title.length).toBeGreaterThan(5);
  });
});

// ─── Format321Engine enrich ───

describe('Format321Engine — enrich profundo', () => {
  const WEAK_FORMATO = JSON.stringify({
    title: 'Formato 3-2-1',
    learned: 'Cosas que aprendí',
    interesting: 'Cosas interesantes',
    question: 'Una pregunta',
  });

  const STRONG_FORMATO = JSON.stringify({
    title: 'Formato 3-2-1: Fotosíntesis y Obtención de Energía',
    learned: 'Tres cosas que aprendiste hoy sobre la fotosíntesis:\n1. Las hojas son las principales encargadas de captar la luz solar.\n2. El agua viaja desde las raíces hasta las hojas por el tallo.\n3. La planta libera oxígeno como subproducto del proceso.',
    interesting: 'Dos cosas que te parecieron interesantes sobre la fotosíntesis:\n1. Las plantas pueden "comer" usando solo luz del sol, agua y aire.\n2. Sin la fotosíntesis no existiría oxígeno para respirar.',
    question: '¿Qué pasaría con la fotosíntesis si la temperatura del planeta siguiera aumentando?',
  });

  it('reemplaza consignas genéricas con fallback', async () => {
    const env = mockAI(WEAK_FORMATO);
    const result = await generateFormato321(env, BASE_FORMATO_INPUT);

    expect(result.sections.length).toBe(3);
    expect(result.sections[0].number).toBe(3);
    expect(result.sections[1].number).toBe(2);
    expect(result.sections[2].number).toBe(1);
    expect(result.sections[0].description.length).toBeGreaterThan(10);
    expect(result.sections[1].description.length).toBeGreaterThan(10);
    expect(result.sections[2].description.length).toBeGreaterThan(10);
  });

  it('preserva contenido fuerte y específico de la IA', async () => {
    const env = mockAI(STRONG_FORMATO);
    const result = await generateFormato321(env, BASE_FORMATO_INPUT);

    expect(result.title).toContain('Fotosíntesis');
    expect(result.sections[0].description).toContain('fotosíntesis');
    expect(result.sections[0].description).toContain('1.');
    expect(result.sections[0].description).toContain('2.');
    expect(result.sections[0].description).toContain('3.');
  });

  it('usa fallback completo cuando no hay AI configurada', async () => {
    const env = mockAINoAI();
    const result = await generateFormato321(env, BASE_FORMATO_INPUT);

    expect(result.sections.length).toBe(3);
    expect(result.sections[0].lines).toBe(3);
    expect(result.sections[1].lines).toBe(2);
    expect(result.sections[2].lines).toBe(1);
    expect(result.title.length).toBeGreaterThan(5);
  });
});
