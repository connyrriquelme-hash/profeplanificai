import { describe, it, expect, vi } from 'vitest';
import { editSeccionGuia } from '../functions/core/GuiaEditEngine';
import type { GuiaResult } from '../functions/core/GuiaEngine';
import type { AIEngineEnv } from '../functions/core/types';

function mockGuia(): GuiaResult {
  return {
    title: 'Guía: Fracciones',
    objective: 'Comprendo qué es una fracción y la represento de distintas formas.',
    sections: [
      { title: 'Introducción', content: 'Hoy vamos a aprender sobre fracciones usando ejemplos de la vida diaria.' },
      {
        title: 'Vocabulario clave',
        content: 'fracción, numerador, denominador',
        activities: ['Una fracción representa una parte de un todo.', 'El numerador es el número de arriba.'],
      },
      {
        title: 'Actividad 1: Activación',
        content: 'Responde qué sabes sobre repartir cosas en partes iguales.',
        activities: ['¿Alguna vez repartiste una pizza en partes iguales?', 'Dibuja cómo la repartirías entre 4 personas.', 'Escribe qué fracción representa un pedazo.'],
      },
      {
        title: 'Actividad 2: Desarrollo',
        content: 'Lee el texto y responde las preguntas de comprensión sobre fracciones equivalentes.',
        activities: ['Lee el texto atentamente.', 'Identifica dos fracciones equivalentes.', 'Explica por qué son equivalentes.'],
      },
      {
        title: 'Reflexión / Autoevaluación',
        content: '',
        activities: ['Puedo explicar qué es una fracción.', 'Todavía me cuesta identificar el denominador.'],
      },
    ],
  };
}

function mockAI(responseText: string): AIEngineEnv {
  return { AI: { run: vi.fn().mockResolvedValue(responseText) } as unknown as Ai };
}

function mockAINoAI(): AIEngineEnv {
  return { AI: undefined as unknown as Ai };
}

function validAiEditResponse(overrides: Partial<{ seccionModificada: number; explicacion: string }> = {}) {
  return {
    seccionModificada: overrides.seccionModificada ?? 2,
    seccionNueva: {
      title: 'Actividad 1: Activación',
      content: 'Responde con dibujos simples qué sabes sobre repartir cosas en partes iguales, con apoyo visual.',
      activities: ['Mira la imagen de la pizza repartida en 4 partes.', 'Señala un pedazo y di qué fracción representa.'],
    },
    explicacion: overrides.explicacion ?? 'Simplifiqué la actividad usando apoyo visual y menos pasos para estudiantes con dificultades.',
  };
}

describe('editSeccionGuia', () => {
  it('edición exitosa: la IA elige la sección y el engine la reemplaza devolviendo su índice', async () => {
    const env = mockAI(JSON.stringify(validAiEditResponse({ seccionModificada: 2 })));
    const guia = mockGuia();

    const result = await editSeccionGuia(env, {
      guia,
      instruccion: 'simplifica la primera actividad para estudiantes con dificultades',
      level: '4° Básico',
      subject: 'Matemática',
    });

    expect(result.seccionModificada).toBe(2);
    expect(result.guia.sections[2].content).toContain('apoyo visual');
    expect(result.explicacion).toContain('Simplifiqué');
    // El resto de las secciones queda intacto.
    expect(result.guia.sections[0]).toEqual(guia.sections[0]);
    expect(result.guia.sections[3]).toEqual(guia.sections[3]);
    expect(result.guia.sections[4]).toEqual(guia.sections[4]);
  });

  it('seccionIndex explícito manda sobre lo que la IA devuelva en seccionModificada', async () => {
    const env = mockAI(JSON.stringify(validAiEditResponse({ seccionModificada: 0 })));
    const guia = mockGuia();

    const result = await editSeccionGuia(env, {
      guia,
      instruccion: 'simplifica esta sección',
      seccionIndex: 2,
      level: '4° Básico',
      subject: 'Matemática',
    });

    expect(result.seccionModificada).toBe(2);
    expect(result.guia.sections[2].content).toContain('apoyo visual');
    // La sección 0 (Introducción) no debió tocarse aunque la IA haya
    // devuelto seccionModificada: 0.
    expect(result.guia.sections[0]).toEqual(guia.sections[0]);
  });

  it('instrucción con respuesta de IA no-JSON devuelve fallback limpio (guía sin cambios)', async () => {
    const env = mockAI('Esto no es JSON.');
    const guia = mockGuia();

    const result = await editSeccionGuia(env, {
      guia,
      instruccion: 'cambia algo',
      level: '4° Básico',
      subject: 'Matemática',
    });

    expect(result.seccionModificada).toBe(-1);
    expect(result.explicacion).toContain('No pude aplicar el cambio');
    expect(result.guia).toEqual(guia);
  });

  it('respuesta de IA que no cumple el schema (sección inválida) devuelve fallback tras reintentos', async () => {
    const env = mockAI(JSON.stringify({ seccionModificada: 1, seccionNueva: { title: '' }, explicacion: 'x' }));
    const guia = mockGuia();

    const result = await editSeccionGuia(env, {
      guia,
      instruccion: 'cambia algo',
      level: '4° Básico',
      subject: 'Matemática',
    });

    expect(result.seccionModificada).toBe(-1);
    expect(result.guia).toEqual(guia);
  });

  it('seccionIndex fuera de rango devuelve fallback sin llamar a la IA', async () => {
    const env = mockAI(JSON.stringify(validAiEditResponse()));
    const guia = mockGuia();

    const result = await editSeccionGuia(env, {
      guia,
      instruccion: 'cambia la sección 99',
      seccionIndex: 99,
      level: '4° Básico',
      subject: 'Matemática',
    });

    expect(result.seccionModificada).toBe(-1);
    expect(result.guia).toEqual(guia);
    expect((env.AI!.run as unknown as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it('sin env.AI configurado devuelve fallback limpio', async () => {
    const env = mockAINoAI();
    const guia = mockGuia();

    const result = await editSeccionGuia(env, {
      guia,
      instruccion: 'cambia algo',
      level: '4° Básico',
      subject: 'Matemática',
    });

    expect(result.seccionModificada).toBe(-1);
    expect(result.explicacion).toContain('No pude aplicar el cambio');
    expect(result.guia).toEqual(guia);
  });
});
