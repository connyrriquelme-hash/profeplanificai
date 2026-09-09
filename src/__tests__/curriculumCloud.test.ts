import { describe, expect, it } from 'vitest';
import { assertCurriculumUrl, parseCurriculumPage } from '../../functions/_lib/curriculum';

describe('curriculum server parser', () => {
  it('extracts official OA with course, subject and axis', () => {
    const html = `<main><h1>Lenguaje y Comunicación 1° Básico</h1><h3>Lectura - Comprensión</h3>
      <h4>Objetivo de aprendizaje LE01 OA 01</h4><p>Reconocer que los textos escritos transmiten mensajes.</p>
      <a href="/curriculum/1o-6o-basico/lenguaje-comunicacion/1-basico/le01-oa-01">Ver actividades</a></main>`;
    const result = parseCurriculumPage(html, 'https://www.curriculumnacional.cl/curriculum/1o-6o-basico/lenguaje-comunicacion/1-basico');
    expect(result.objectives).toHaveLength(1);
    expect(result.objectives[0]).toMatchObject({ code: 'LE01 OA 01', courseCode: '1B', subject: 'Lenguaje y Comunicación', axis: 'Lectura - Comprensión' });
    expect(result.objectives[0].officialText).toContain('transmiten mensajes');
  });

  it('rejects domains outside the allowlist', () => {
    expect(() => assertCurriculumUrl('https://example.com/curriculum')).toThrow(/allowlist/);
  });
});
