import { describe, it, expect } from 'vitest';
import { normalizeProductContent, buildNormalizedProduct } from '../src/utils/productNormalizer';

describe('normalizeProductContent', () => {
  it('parses JSON string and removes technical fields', () => {
    const input = JSON.stringify({
      title: 'Material para apoderados',
      action: 'material_apoderados',
      kind: 'resource',
      aiGenerated: true,
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      warnings: ['test warning'],
      detailed: { some: 'data' },
      generatedAt: '2026-07-05T00:00:00Z',
      chileContext: true,
      content: ['## Propósito\nApoyar a su hijo en casa'],
      lesson: { course: '7° Básico', subject: 'Matemática' },
    });

    const result = normalizeProductContent(input, 'material_apoderados');

    expect(result.title).toBe('Material para apoderados');
    expect(result.type).toBe('material_apoderados');
    expect(result.level).toBe('7° Básico');
    expect(result.subject).toBe('Matemática');
    expect(result.sections.length).toBeGreaterThan(0);
    const allContent = result.sections.map(s => s.content).join(' ');
    expect(allContent).toContain('Apoyar a su hijo');
  });

  it('fixes unicode/encoding issues', () => {
    const input = JSON.stringify({
      title: 'Material',
      content: ['7° Básico is great'],
    });

    const result = normalizeProductContent(input, 'material_apoderados');
    const allContent = result.sections.map(s => s.content).join(' ');
    expect(allContent).toContain('°');
    expect(allContent).toContain('á');
  });

  it('handles plain text content', () => {
    const input = '## Inicio\nActivar conocimientos previos\n\n## Desarrollo\nExplicar conceptos';
    const result = normalizeProductContent(input, 'planificacion_clase');

    expect(result.sections.length).toBe(2);
    expect(result.sections[0].title).toBe('Inicio');
    expect(result.sections[1].title).toBe('Desarrollo');
  });

  it('handles non-JSON content gracefully', () => {
    const input = 'This is plain text content without any structure.';
    const result = normalizeProductContent(input, 'guia_aprendizaje');

    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.rawMarkdown).toContain('plain text');
  });

  it('extracts tables from structured content', () => {
    const input = JSON.stringify({
      title: 'Evaluación',
      tablas: [{
        title: 'Rúbrica',
        columns: ['Criterio', 'Nivel'],
        rows: [['Comprensión', 'Logrado']],
      }],
    });

    const result = normalizeProductContent(input, 'evaluacion');
    expect(result.tables.length).toBe(1);
    expect(result.tables[0].title).toBe('Rúbrica');
    expect(result.tables[0].columns).toEqual(['Criterio', 'Nivel']);
  });

  it('extracts callouts from structured content', () => {
    const input = JSON.stringify({
      title: 'Guía',
      callouts: [{
        tipo: 'familia',
        texto: 'Apoye a su hijo en casa',
      }],
    });

    const result = normalizeProductContent(input, 'guia_aprendizaje');
    expect(result.callouts.length).toBe(1);
    expect(result.callouts[0].type).toBe('familia');
    expect(result.callouts[0].text).toBe('Apoye a su hijo en casa');
  });

  it('extracts charts from structured content', () => {
    const input = JSON.stringify({
      title: 'Planificación',
      graficos: [{
        tipo: 'bar',
        titulo: 'Distribución del tiempo',
        datos: [
          { label: 'Inicio', value: 15 },
          { label: 'Desarrollo', value: 60 },
        ],
      }],
    });

    const result = normalizeProductContent(input, 'planificacion_clase');
    expect(result.charts.length).toBe(1);
    expect(result.charts[0].data.length).toBe(2);
  });

  it('corrects escaped backslash-n to real newlines', () => {
    const input = JSON.stringify({
      title: 'Test',
      content: ['Line one\\nLine two'],
    });

    const result = normalizeProductContent(input, 'guia_aprendizaje');
    const allContent = result.sections.map(s => s.content).join(' ');
    expect(allContent).toContain('Line one');
    expect(allContent).toContain('Line two');
  });

  it('returns fallback when content is empty', () => {
    const result = normalizeProductContent('', 'guia_aprendizaje');
    expect(result.sections.length).toBe(0);
    expect(result.displayType).toBe('Guía de Aprendizaje');
  });
});

describe('buildNormalizedProduct', () => {
  it('builds from bank resource with metadata_json', () => {
    const resource = {
      id: 'abc-123',
      title: 'Material para apoderados - MA07',
      type: 'material_apoderados',
      source: 'mis_clases',
      content: JSON.stringify({
        title: 'Material para apoderados',
        content: ['## Propósito\nApoyar en casa'],
      }),
      level: '7° Básico',
      subject: 'Matemática',
      objective_code: 'MA07 OA 12',
      objective_text: 'Demostrar comprensión',
      skill: '',
      metadata_json: JSON.stringify({
        sourceTab: 'recursos_ia',
        classTitle: 'Clase de Matemática',
      }),
      created_at: '2026-07-05T00:00:00Z',
      updated_at: '2026-07-05T00:00:00Z',
    };

    const result = buildNormalizedProduct(resource);
    expect(result.id).toBe('abc-123');
    expect(result.level).toBe('7° Básico');
    expect(result.subject).toBe('Matemática');
    expect(result.oaCode).toBe('MA07 OA 12');
    expect(result.sourceTab).toBe('recursos_ia');
    expect(result.classTitle).toBe('Clase de Matemática');
    expect(result.createdAt).toBe('2026-07-05T00:00:00Z');
  });

  it('handles missing metadata_json gracefully', () => {
    const resource = {
      id: 'xyz',
      title: 'Test',
      type: 'guia_aprendizaje',
      source: 'mis_clases',
      content: '## Test content',
      level: '',
      subject: '',
      objective_code: '',
      objective_text: '',
      skill: '',
      metadata_json: '',
      created_at: '',
      updated_at: '',
    };

    const result = buildNormalizedProduct(resource);
    expect(result.id).toBe('xyz');
    expect(result.sourceTab).toBe('');
  });
});
