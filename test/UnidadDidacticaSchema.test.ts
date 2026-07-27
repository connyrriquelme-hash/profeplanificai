import { describe, it, expect } from 'vitest';
import { UnidadDidacticaSchema } from '../schemas/UnidadDidacticaSchema';

function etapa(tiempoMinutos: number, descripcion: string) {
  return { tiempoMinutos, descripcion };
}

function unidadValida() {
  return {
    titulo: 'Unidad 1: Pueblos originarios de Chile',
    nivel: '2° Básico',
    asignatura: 'Historia, Geografía y Ciencias Sociales',
    metodologiaActiva: 'ABP' as const,
    objetivosAprendizaje: ['HI02 OA 01', 'HI02 OA 02'],
    fases: [
      { nombre: 'Pregunta Guía', descripcion: 'Se plantea la pregunta central del proyecto.', orden: 0 },
      { nombre: 'Investigación', descripcion: 'Los estudiantes investigan en grupos.', orden: 1 },
    ],
    clases: [
      {
        numero: 1,
        faseAsociada: 'Pregunta Guía',
        tema: '¿Quiénes eran los pueblos originarios?',
        objetivoEspecifico: 'Reconocer la diversidad de pueblos originarios de Chile.',
        estructuraClase: {
          inicio: etapa(10, 'Activación de conocimientos previos con imágenes.'),
          desarrollo: etapa(30, 'Presentación de la pregunta guía y formación de grupos.'),
          cierre: etapa(5, 'Compartir hipótesis iniciales.'),
        },
      },
      {
        numero: 2,
        faseAsociada: 'Investigación',
        tema: 'Modos de vida',
        objetivoEspecifico: 'Investigar modos de vida de un pueblo originario asignado.',
        estructuraClase: {
          inicio: etapa(5, 'Recordar la pregunta guía.'),
          desarrollo: etapa(35, 'Investigación en grupos con material impreso.'),
          cierre: etapa(5, 'Registrar avances en bitácora.'),
        },
      },
    ],
  };
}

describe('UnidadDidacticaSchema', () => {
  it('acepta una unidad válida', () => {
    const result = UnidadDidacticaSchema.safeParse(unidadValida());
    expect(result.success).toBe(true);
  });

  it('rechaza faseAsociada que no existe en fases[].nombre', () => {
    const unidad = unidadValida();
    unidad.clases[0].faseAsociada = 'Fase Que No Existe';
    const result = UnidadDidacticaSchema.safeParse(unidad);
    expect(result.success).toBe(false);
  });

  it('rechaza clases[].numero duplicados', () => {
    const unidad = unidadValida();
    unidad.clases[1].numero = unidad.clases[0].numero;
    const result = UnidadDidacticaSchema.safeParse(unidad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('clases[].numero'))).toBe(true);
    }
  });

  it('rechaza fases[].orden duplicados', () => {
    const unidad = unidadValida();
    unidad.fases[1].orden = unidad.fases[0].orden;
    const result = UnidadDidacticaSchema.safeParse(unidad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('fases[].orden'))).toBe(true);
    }
  });
});
