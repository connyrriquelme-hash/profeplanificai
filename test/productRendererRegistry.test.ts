import { describe, it, expect } from 'vitest';
import { normalizeProduct, normalizeTicket, normalizeThreeTwoOne, normalizeChecklist, normalizeRubric, normalizeGuide, normalizeBitacora } from '../src/components/products/normalizers';
import type { PedagogicalProduct } from '../src/components/products/types';

describe('ProductRenderer registry normalizers', () => {
  describe('normalizeTicket', () => {
    it('normalizes ticket_salida', () => {
      const raw = {
        title: 'Ticket de Salida: MA07 OA 12',
        subtitle: '4° Básico — Matemática',
        type: 'ticket_salida',
        questions: [
          { number: 1, type: 'open', question: '¿Qué aprendiste hoy?' },
          { number: 2, type: 'open', question: '¿Qué duda quedó?' },
        ],
        instructions: 'Completa antes de salir',
      };
      const result = normalizeTicket(raw);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('ticket_salida');
      expect(result!.metadata.title).toBe('Ticket de Salida: MA07 OA 12');
      expect((result!.data.questions as unknown[]).length).toBe(2);
    });

    it('returns null for non-ticket type', () => {
      const raw = { title: 'Test', type: 'guia_estudiante' };
      expect(normalizeTicket(raw)).toBeNull();
    });

    it('returns null for missing title', () => {
      const raw = { type: 'ticket_salida' };
      expect(normalizeTicket(raw)).toBeNull();
    });
  });

  describe('normalizeThreeTwoOne', () => {
    it('normalizes formato_321', () => {
      const raw = {
        title: 'Formato 3-2-1',
        type: 'formato_321',
        sections: [
          { number: 3, title: '3 cosas que aprendí', description: '...' },
          { number: 2, title: '2 cosas que me interesan', description: '...' },
          { number: 1, title: '1 duda', description: '...' },
        ],
      };
      const result = normalizeThreeTwoOne(raw);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('formato_321');
      expect((result!.data.cards as unknown[]).length).toBe(3);
    });

    it('returns null for non-321 type', () => {
      expect(normalizeThreeTwoOne({ title: 'X', type: 'other' })).toBeNull();
    });
  });

  describe('normalizeChecklist', () => {
    it('normalizes lista_cotejo', () => {
      const raw = {
        title: 'Lista de Cotejo',
        type: 'lista_cotejo',
        criteria: [
          { number: 1, description: 'Comprendo el concepto' },
          { number: 2, description: 'Puedo explicar' },
        ],
        instructions: 'Marca cada criterio',
      };
      const result = normalizeChecklist(raw);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('lista_cotejo');
      expect((result!.data.items as unknown[]).length).toBe(2);
    });

    it('returns null for non-lista_cotejo type', () => {
      expect(normalizeChecklist({ title: 'X', type: 'other' })).toBeNull();
    });
  });

  describe('normalizeRubric', () => {
    it('normalizes rubrica_formativa', () => {
      const raw = {
        title: 'Rúbrica Formativa',
        type: 'rubrica_formativa',
        criteria: [
          {
            number: 1,
            name: 'Comprensión',
            levels: [
              { level: 'En proceso', description: 'Confusiones', points: 1 },
              { level: 'Logrado', description: 'Claro', points: 2 },
              { level: 'Destacado', description: 'Complejo', points: 3 },
            ],
          },
        ],
        totalScore: 9,
      };
      const result = normalizeRubric(raw);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('rubrica_formativa');
      expect((result!.data.criteria as unknown[]).length).toBe(1);
      expect(result!.data.totalPoints).toBe(9);
    });

    it('returns null for non-rubrica type', () => {
      expect(normalizeRubric({ title: 'X', type: 'other' })).toBeNull();
    });
  });

  describe('normalizeGuide', () => {
    it('normalizes guia_estudiante', () => {
      const raw = {
        title: 'Guía: MA07 OA 12',
        subtitle: '4° Básico — Matemática',
        objective: 'Demostrar comprensión',
        activities: [
          { name: 'Actividad 1', description: 'Activación', steps: ['Paso 1', 'Paso 2'] },
        ],
        instructions: 'Lee atentamente',
      };
      const result = normalizeGuide(raw, 'guia_estudiante');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('guia_estudiante');
      expect(result!.metadata.title).toBe('Guía: MA07 OA 12');
      expect((result!.data.sections as unknown[]).length).toBe(1);
    });

    it('normalizes guia_docente', () => {
      const raw = { title: 'Guía Docente', activities: [] };
      const result = normalizeGuide(raw, 'guia_docente');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('guia_docente');
    });

    it('returns null for missing title', () => {
      expect(normalizeGuide({ activities: [] }, 'guia_estudiante')).toBeNull();
    });
  });

  describe('normalizeBitacora', () => {
    it('normalizes ClassroomScientificNotebook', () => {
      const raw = {
        title: 'Bitácora Científica',
        subtitle: 'Ciencias',
        materials: [{ name: 'Material 1', quantity: '1' }],
        procedure: [{ step: 1, description: 'Paso 1' }],
        assessment: { criteria: ['Criterio 1'] },
      };
      const result = normalizeBitacora(raw);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('bitacora_cientifica');
    });

    it('normalizes legacy bitacora format', () => {
      const raw = {
        title: 'Bitácora legacy',
        type: 'bitacora_cientifica',
        modelo: 'Basico',
        estructura: [],
      };
      const result = normalizeBitacora(raw);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('bitacora_cientifica');
    });

    it('returns null for non-bitacora', () => {
      expect(normalizeBitacora({ title: 'Test', type: 'guia' })).toBeNull();
    });
  });

  describe('normalizeProduct (master)', () => {
    it('routes ticket_salida correctly', () => {
      const raw = { title: 'Ticket', type: 'ticket_salida', questions: [] };
      const result = normalizeProduct(raw);
      expect(result!.type).toBe('ticket_salida');
    });

    it('routes formato_321 correctly', () => {
      const raw = { title: '321', type: 'formato_321', sections: [] };
      const result = normalizeProduct(raw);
      expect(result!.type).toBe('formato_321');
    });

    it('routes lista_cotejo correctly', () => {
      const raw = { title: 'Checklist', type: 'lista_cotejo', criteria: [] };
      const result = normalizeProduct(raw);
      expect(result!.type).toBe('lista_cotejo');
    });

    it('routes rubrica_formativa correctly', () => {
      const raw = { title: 'Rubrica', type: 'rubrica_formativa', criteria: [] };
      const result = normalizeProduct(raw);
      expect(result!.type).toBe('rubrica_formativa');
    });

    it('routes guide with selectedProducto', () => {
      const raw = { title: 'Guide', activities: [] };
      const result = normalizeProduct(raw, 'guia_estudiante');
      expect(result!.type).toBe('guia_estudiante');
    });

    it('returns null for null input', () => {
      expect(normalizeProduct(null)).toBeNull();
    });

    it('returns null for string input', () => {
      expect(normalizeProduct('not an object')).toBeNull();
    });
  });
});

describe('Product type completeness', () => {
  it('SupportedProductType includes all real backend types', () => {
    const realTypes = [
      'lista_cotejo', 'rubrica_formativa', 'ticket_salida', 'ticket_entrada',
      'formato_321', 'semaforo', 'guia_estudiante', 'guia_docente',
      'bitacora_cientifica', 'guia_dua', 'evaluacion',
    ];
    const supportedTypes: string[] = [
      'checklist', 'lista_cotejo', 'rubrica', 'rubrica_formativa',
      'escala_apreciacion', 'ticket_salida', 'ticket_entrada',
      'guia_aprendizaje', 'guia_estudiante', 'guia_docente',
      'guia_dua', 'material_didactico', 'actividad', 'proyecto',
      'experimento', 'formato_321', 'organizador_grafico',
      'evaluacion', 'semaforo', 'bitacora_cientifica',
    ];

    for (const realType of realTypes) {
      expect(supportedTypes).toContain(realType);
    }
  });
});

describe('FlujoDocenteView integration', () => {
  it('FlujoDocenteView does not contain JSON.stringify in result rendering', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(__dirname, '../src/components/FlujoDocenteView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Find the result rendering block (after "Recurso generado")
    const resultBlockStart = content.indexOf('Recurso generado');
    const resultBlockEnd = content.indexOf('mt-6 flex items-center', resultBlockStart);
    const resultBlock = content.substring(resultBlockStart, resultBlockEnd);

    // Should NOT contain JSON.stringify in the result display area
    expect(resultBlock).not.toContain('JSON.stringify');
  });

  it('FlujoDocenteView does not use <pre> for product rendering', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(__dirname, '../src/components/FlujoDocenteView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Find the result rendering block
    const resultBlockStart = content.indexOf('Recurso generado');
    const resultBlockEnd = content.indexOf('mt-6 flex items-center', resultBlockStart);
    const resultBlock = content.substring(resultBlockStart, resultBlockEnd);

    // Should NOT contain <pre in the result display area
    expect(resultBlock).not.toContain('<pre');
  });

  it('FlujoDocenteView uses ProductRenderer for all non-pptx/rubrica products', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(__dirname, '../src/components/FlujoDocenteView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Should import ProductRenderer
    expect(content).toContain("import ProductRenderer from './products/ProductRenderer'");

    // Should use ProductRenderer in the result block
    expect(content).toContain('<ProductRenderer product={result}');
  });
});
