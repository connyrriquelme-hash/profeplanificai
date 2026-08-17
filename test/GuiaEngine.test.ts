import { describe, it, expect, vi } from 'vitest';
import { generateGuia, type GuiaEngineInput } from '../functions/core/GuiaEngine';
import type { AIEngineEnv } from '../functions/core/types';

const INPUT: GuiaEngineInput = {
  level: '2° Básico',
  subject: 'Lenguaje y Comunicación',
  objectiveCode: 'LE02 OA 07',
  objectiveText: 'Leer independientemente y comprender textos no literarios para ampliar su conocimiento del mundo.',
  topic: 'El caracol',
  indicators: [],
};

function validAiEstudianteResponse() {
  return {
    title: 'Descubriendo al caracol',
    objective: 'Vamos a leer y entender un texto sobre el caracol.',
    textoLectura: {
      titulo: 'El caracol',
      cuerpo: 'El caracol es un animal invertebrado que vive tanto en la tierra como en el agua. Su cuerpo blando está protegido por una concha dura que carga sobre su espalda. Los caracoles se mueven muy lento, deslizándose sobre una capa de baba que ellos mismos producen. En su cabeza tienen dos pares de tentáculos: los más largos tienen ojos en la punta y los más cortos sirven para tocar y oler. Los caracoles comen principalmente hojas y plantas. Prefieren salir en la noche o cuando el ambiente está húmedo, como después de llover.',
      fuente: 'generado_ia',
    },
    sections: [
      { title: 'Introducción', content: 'Hoy vamos a descubrir todo sobre el caracol leyendo un texto informativo.' },
      {
        title: 'Vocabulario clave',
        content: 'caracol, concha, tentáculos',
        activities: [
          'Un caracol es un animal con cuerpo blando, como una babosa con casa.',
          'La concha es la casa dura que el caracol lleva en la espalda.',
        ],
      },
      {
        title: 'Actividad 1: ¿Qué dice el texto?',
        content: 'Responde estas preguntas sobre el texto que leíste.',
        activities: ['¿Dónde vive el caracol?', '¿Con qué se mueve el caracol?', 'Completa: los caracoles comen principalmente ___.'],
      },
      {
        title: 'Actividad 2: Dibujando al caracol',
        content: 'Dibuja un caracol y señala sus partes.',
        activities: ['Dibuja un caracol con su concha.', 'Señala dónde están sus tentáculos.', 'Escribe el nombre de una parte del caracol.'],
      },
      {
        title: 'Reflexión / Autoevaluación',
        content: '',
        activities: ['Puedo explicar cómo se mueve el caracol.', 'Todavía me cuesta recordar para qué sirven los tentáculos.'],
      },
    ],
  };
}

function validAiDocenteResponse() {
  return {
    title: 'Guía Docente: LE02 OA 07',
    objective: 'Leer independientemente y comprender textos no literarios para ampliar su conocimiento del mundo.',
    sections: [
      { title: 'Inicio (15 min)', content: 'Muestra una imagen de un caracol y pregunta qué saben sobre él.' },
      { title: 'Desarrollo (60 min)', content: 'Modela la lectura del texto informativo (yo hago), lee junto a los estudiantes (hacemos juntos) y luego leen de forma independiente (tú haces).' },
      { title: 'Cierre (15 min)', content: 'Los estudiantes comparten qué aprendieron sobre el caracol.' },
      {
        title: 'Diferenciación / Adecuaciones DUA',
        content: '',
        activities: ['Para dificultades: entregar un resumen con las ideas principales del texto.', 'Para avanzados: pedir que investiguen otro molusco y comparen.'],
      },
      {
        title: 'Materiales y evaluación',
        content: 'Duración total: 90 minutos. Evaluación formativa mediante preguntas de comprensión oral.',
        activities: ['Texto informativo sobre el caracol', 'Imágenes de caracoles'],
      },
    ],
  };
}

function mockAI(responseText: string): AIEngineEnv {
  return { AI: { run: vi.fn().mockResolvedValue(responseText) } as unknown as Ai };
}

describe('generateGuia — estudiante (textoLectura)', () => {
  it('incluye textoLectura con fuente "generado_ia" cuando no hay additionalContext', async () => {
    const env = mockAI(JSON.stringify(validAiEstudianteResponse()));
    const result = await generateGuia(env, INPUT, 'estudiante');

    expect(result.textoLectura).toBeDefined();
    expect(result.textoLectura!.titulo).toBe('El caracol');
    expect(result.textoLectura!.fuente).toBe('generado_ia');
    expect(result.textoLectura!.cuerpo.length).toBeGreaterThanOrEqual(100);
  });

  it('fuerza fuente "proporcionado_profesor" cuando hay additionalContext, aunque la IA responda otra cosa', async () => {
    const aiResponse = validAiEstudianteResponse();
    aiResponse.textoLectura.fuente = 'generado_ia'; // la IA "se equivoca" a propósito en este test
    const env = mockAI(JSON.stringify(aiResponse));

    const result = await generateGuia(env, { ...INPUT, additionalContext: 'El caracol es un molusco gasterópodo terrestre...' }, 'estudiante');

    expect(result.textoLectura!.fuente).toBe('proporcionado_profesor');
  });

  it('la primera actividad (Actividad 1) es de comprensión del texto', async () => {
    const env = mockAI(JSON.stringify(validAiEstudianteResponse()));
    const result = await generateGuia(env, INPUT, 'estudiante');

    const actividad1 = result.sections.find((s) => s.title.startsWith('Actividad 1'));
    expect(actividad1).toBeDefined();
    expect(actividad1!.title.toLowerCase()).toContain('texto');
  });

  it('fallback determinista (IA responde no-JSON) incluye textoLectura genérico para cumplir el contrato del schema', async () => {
    const env = mockAI('Esto no es JSON.');
    const result = await generateGuia(env, INPUT, 'estudiante');

    expect(result.textoLectura).toBeDefined();
    expect(result.textoLectura!.fuente).toBe('generado_ia');
    expect(result.textoLectura!.cuerpo).toContain('El caracol');
    expect(result.sections[2].title).toBe('Actividad 1: Comprensión del texto');
  });

  it('respuesta de IA sin textoLectura (schema inválido) cae al fallback completo tras reintentos', async () => {
    const invalid = validAiEstudianteResponse() as any;
    delete invalid.textoLectura;
    const env = mockAI(JSON.stringify(invalid));

    const result = await generateGuia(env, INPUT, 'estudiante');

    expect(result.textoLectura).toBeDefined();
    expect(result.title).toBe(INPUT.topic);
  });
});

describe('generateGuia — docente (sin textoLectura)', () => {
  it('la guía docente nunca trae textoLectura, ni desde la IA ni desde el fallback', async () => {
    const env = mockAI(JSON.stringify(validAiDocenteResponse()));
    const result = await generateGuia(env, INPUT, 'docente');

    expect(result.textoLectura).toBeUndefined();
  });

  it('fallback docente (IA falla) tampoco trae textoLectura', async () => {
    const env = mockAI('Esto no es JSON.');
    const result = await generateGuia(env, INPUT, 'docente');

    expect(result.textoLectura).toBeUndefined();
  });
});
