import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function mountProduct() {
  document.body.innerHTML = `
    <style>.premium-card{color:#7c3aed;}</style>
    <article id="product" class="premium-card">
      <h1>Guía DUA</h1>
      <p>OA 05 Comprensión lectora</p>
      <section class="product-section"><button>Principios DUA</button></section>
      <div class="print-toolbar"><button>Exportar PDF</button></div>
    </article>
  `;
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  document.body.innerHTML = '';
  document.body.classList.remove('premium-pdf-print-mode');
  document.title = '';
});

describe('exportElementToPDF strategy', () => {
  it('uses window.print() as primary strategy', async () => {
    mountProduct();
    const printMock = vi.fn();
    vi.spyOn(window, 'print').mockImplementation(printMock);

    const { exportElementToPDF } = await import('../src/utils/exportPdf');
    await exportElementToPDF('product', 'guia-dua');

    expect(printMock).toHaveBeenCalled();
    expect(document.body.classList.contains('premium-pdf-print-mode')).toBe(false);
    expect(document.getElementById('product')?.classList.contains('premium-pdf-target')).toBe(false);
  });

  it('adds premium-pdf-target class during print and removes after', async () => {
    mountProduct();
    let classesDuringPrint: string[] = [];
    vi.spyOn(window, 'print').mockImplementation(() => {
      classesDuringPrint = Array.from(document.getElementById('product')?.classList || []);
    });

    const { exportElementToPDF } = await import('../src/utils/exportPdf');
    await exportElementToPDF('product', 'guia-dua');

    expect(classesDuringPrint).toContain('premium-pdf-target');
    expect(document.getElementById('product')?.classList.contains('premium-pdf-target')).toBe(false);
  });

  it('sets document.title to filename during print', async () => {
    mountProduct();
    const originalTitle = document.title;
    let titleDuringPrint = '';
    vi.spyOn(window, 'print').mockImplementation(() => {
      titleDuringPrint = document.title;
    });

    const { exportElementToPDF } = await import('../src/utils/exportPdf');
    await exportElementToPDF('product', 'guia-dua');

    expect(titleDuringPrint).toBe('guia-dua');
    expect(document.title).toBe(originalTitle);
  });

  it('triggers textual fallback when element not found', async () => {
    document.body.innerHTML = '';
    const warnMock = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { exportElementToPDF } = await import('../src/utils/exportPdf');
    const result = await exportElementToPDF('nonexistent', 'test');

    expect(result).toBe(false);
    expect(warnMock).toHaveBeenCalledWith(
      expect.stringContaining('Elemento no encontrado'),
    );
  });

  it('returns true on successful print', async () => {
    mountProduct();
    vi.spyOn(window, 'print').mockImplementation(() => undefined);

    const { exportElementToPDF } = await import('../src/utils/exportPdf');
    const result = await exportElementToPDF('product', 'guia-dua');

    expect(result).toBe(true);
  });
});
