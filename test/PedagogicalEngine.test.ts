import { describe, it, expect, vi } from 'vitest';
import { PedagogicalEngine } from '../functions/core/PedagogicalEngine';
import type { PedagogicalEngineEnv, CurriculumObjectiveRow } from '../functions/core/types';

const MOCK_ROW: CurriculumObjectiveRow = {
  codigo_oa: 'OA 1',
  descripcion: 'Descripción del OA de prueba',
  habilidades_csv: 'H1, H2, H3',
  unidad_titulo: 'Unidad de Prueba',
};

function mockEnv(objective: CurriculumObjectiveRow | null = MOCK_ROW): PedagogicalEngineEnv {
  const bindMock = vi.fn().mockReturnValue({
    first: vi.fn().mockResolvedValue(objective),
  });
  const prepareMock = vi.fn().mockReturnValue({ bind: bindMock });

  return {
    CORE_DB: { prepare: prepareMock } as unknown as D1Database,
  };
}

describe('PedagogicalEngine', () => {
  it('should build a PedagogicalPlan when OA is found', async () => {
    const env = mockEnv();
    const plan = await PedagogicalEngine.buildPlan(env, '1° Básico', 'Lenguaje y Comunicación', 'Conciencia fonológica');

    expect(plan.tema).toBe('Conciencia fonológica');
    expect(plan.curso).toBe('1° Básico');
    expect(plan.asignatura).toBe('Lenguaje y Comunicación');
    expect(plan.objetivo_aprendizaje).toBe('OA 1: Descripción del OA de prueba');
    expect(plan.habilidades).toBe('H1, H2, H3');
    expect(plan.taxonomia_bloom_sugerida).toBeDefined();

    expect(plan.estructura_clase.inicio).toBeDefined();
    expect(plan.estructura_clase.inicio.tiempo_minutos).toBe(15);
    expect(plan.estructura_clase.inicio.descripcion).toContain('Conciencia fonológica');
    expect(plan.estructura_clase.inicio.descripcion).toContain('Unidad de Prueba');

    expect(plan.estructura_clase.desarrollo).toBeDefined();
    expect(plan.estructura_clase.desarrollo.tiempo_minutos).toBe(60);
    expect(plan.estructura_clase.desarrollo.descripcion).toContain('OA 1');

    expect(plan.estructura_clase.cierre).toBeDefined();
    expect(plan.estructura_clase.cierre.tiempo_minutos).toBe(15);
  });

  it('should throw when D1 returns no objective', async () => {
    const env = mockEnv(null);

    await expect(
      PedagogicalEngine.buildPlan(env, '1° Básico', 'Lenguaje y Comunicación', 'Tema fantasma'),
    ).rejects.toThrow('No se encontró OA para 1° Básico / Lenguaje y Comunicación.');
  });

  it('should build a plan from explicitly selected OA context when CORE_DB does not contain that OA', async () => {
    const env = mockEnv(null);

    const plan = await PedagogicalEngine.buildPlan(
      env,
      '2° Básico',
      'Lenguaje',
      'Lectura comprensiva',
      {
        objectiveCode: 'LE02 OA 05',
        objectiveText: 'Demostrar comprensión de las narraciones leídas.',
        skills: ['Comprender', 'Comunicar'],
      },
    );

    expect(plan.objetivo_aprendizaje).toBe('LE02 OA 05: Demostrar comprensión de las narraciones leídas.');
    expect(plan.habilidades).toContain('Comprender');
    expect(plan.estructura_clase.desarrollo.descripcion).toContain('LE02 OA 05');
  });

  it('should throw when CORE_DB is not configured', async () => {
    const env = { CORE_DB: undefined } as unknown as PedagogicalEngineEnv;

    await expect(
      PedagogicalEngine.buildPlan(env, '1° Básico', 'Matemática', 'Suma'),
    ).rejects.toThrow('CORE_DB no está configurado');
  });

  it('should trim whitespace from nivel, asignatura and tema', async () => {
    const env = mockEnv();
    const plan = await PedagogicalEngine.buildPlan(env, '  2° Básico  ', '  Matemática  ', '  Números  ');

    expect(plan.tema).toBe('Números');
    expect(plan.curso).toBe('2° Básico');
    expect(plan.asignatura).toBe('Matemática');
    expect(env.CORE_DB.prepare).toHaveBeenCalled();
  });

  it('should throw when any required field is empty after trimming', async () => {
    const env = mockEnv();

    await expect(
      PedagogicalEngine.buildPlan(env, '', 'Matemática', 'Suma'),
    ).rejects.toThrow('nivel, asignatura y tema son obligatorios');

    await expect(
      PedagogicalEngine.buildPlan(env, '1° Básico', '', 'Suma'),
    ).rejects.toThrow('nivel, asignatura y tema son obligatorios');

    await expect(
      PedagogicalEngine.buildPlan(env, '1° Básico', 'Matemática', '  '),
    ).rejects.toThrow('nivel, asignatura y tema son obligatorios');
  });

  it('should bind normalized nivel and asignatura to D1 query', async () => {
    const env = mockEnv();
    await PedagogicalEngine.buildPlan(env, '3° Básico', 'Historia', 'Chile');

    expect(env.CORE_DB.prepare).toHaveBeenCalledWith(
      expect.stringContaining('FROM objetivos_aprendizaje'),
    );
    expect(env.CORE_DB.prepare).toHaveBeenCalledWith(
      expect.stringContaining('WHERE TRIM(n.nombre) = ?'),
    );
  });

  it('should try keyword search first, then fallback to default query', async () => {
    const bindMock = vi.fn()
      .mockReturnValueOnce({ first: vi.fn().mockResolvedValue(null) })
      .mockReturnValueOnce({ first: vi.fn().mockResolvedValue(MOCK_ROW) });
    const prepareMock = vi.fn().mockReturnValue({ bind: bindMock });

    const env = { CORE_DB: { prepare: prepareMock } } as unknown as PedagogicalEngineEnv;
    const plan = await PedagogicalEngine.buildPlan(env, '5° Básico', 'Ciencias Naturales', 'La célula');

    expect(prepareMock).toHaveBeenCalledTimes(2);
    expect(plan.tema).toBe('La célula');
  });

  it('should throw with D1 error message when query fails', async () => {
    const prepareMock = vi.fn().mockImplementation(() => {
      throw new Error('D1SqlConnectionError');
    });

    const env = { CORE_DB: { prepare: prepareMock } } as unknown as PedagogicalEngineEnv;

    await expect(
      PedagogicalEngine.buildPlan(env, '1° Básico', 'Matemática', 'Suma'),
    ).rejects.toThrow('Error al consultar CORE_DB');
  });

  it('should include curso and asignatura in returned plan', async () => {
    const env = mockEnv();
    const plan = await PedagogicalEngine.buildPlan(env, '4° Medio', 'Historia', 'Independencia');

    expect(plan.curso).toBe('4° Medio');
    expect(plan.asignatura).toBe('Historia');
  });
});
