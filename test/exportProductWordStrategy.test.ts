import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportElementToWord } from '../src/utils/exportProductWord';

function blobToText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsText(blob);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('exportElementToWord strategy', () => {
  it('keeps premium section button headings and excludes export toolbars', async () => {
    document.body.innerHTML = `
      <article id="product">
        <h1>Guía DUA</h1>
        <section class="product-section">
          <button type="button">Principios DUA</button>
          <p>Opciones de representación y expresión.</p>
        </section>
        <div class="print:hidden">
          <button type="button">Imprimir</button>
        </div>
      </article>
    `;

    let capturedBlob: Blob | null = null;
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((blob: Blob) => {
      capturedBlob = blob as Blob;
      return 'blob:docx';
      }),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    exportElementToWord('product', 'guia-dua');

    expect(capturedBlob).not.toBeNull();
    const zipText = await blobToText(capturedBlob!);

    expect(zipText).toContain('Guía DUA');
    expect(zipText).toContain('Principios DUA');
    expect(zipText).toContain('Opciones de representación y expresión.');
    expect(zipText).not.toContain('Imprimir');
  });
});
