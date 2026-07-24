import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const html2canvasMock = vi.fn();
const saveMock = vi.fn();
const addImageMock = vi.fn();
const addPageMock = vi.fn();
const textMock = vi.fn();
const splitTextToSizeMock = vi.fn((text: string) => [text]);

vi.mock('html2canvas', () => ({
  default: html2canvasMock,
}));

vi.mock('jspdf', () => ({
  default: vi.fn(),
}));

function mountProduct() {
  document.body.innerHTML = `
    <style>.premium-card{color:oklch(0.21 0.034 264.665);}</style>
    <article id="product" class="premium-card">
      <h1>Guía DUA</h1>
      <p>OA 05 Comprensión lectora</p>
      <section class="product-section"><button>Principios DUA</button></section>
      <div class="print-toolbar"><button>Exportar PDF</button></div>
    </article>
  `;
}

beforeEach(async () => {
  const { default: jsPDF } = await import('jspdf');
  vi.mocked(jsPDF).mockImplementation(() => ({
    addImage: addImageMock,
    addPage: addPageMock,
    save: saveMock,
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    splitTextToSize: splitTextToSizeMock,
    text: textMock,
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

describe('exportElementToPDF strategy', () => {
  it('uses browser print first and does not load canvas when print window opens', async () => {
    mountProduct();
    const printMock = vi.fn();
    const writeMock = vi.fn();
    const fakeWindow = {
      document: {
        close: vi.fn(),
        open: vi.fn(),
        write: writeMock,
      },
      focus: vi.fn(),
      print: printMock,
      setTimeout: (callback: () => void) => callback(),
    } as unknown as Window;
    vi.spyOn(window, 'open').mockReturnValue(fakeWindow);

    const { exportElementToPDF } = await import('../src/utils/exportPdf');
    await exportElementToPDF('product', 'guia-dua');

    expect(window.open).toHaveBeenCalled();
    expect(writeMock).toHaveBeenCalledWith(expect.stringContaining('@page'));
    expect(writeMock).toHaveBeenCalledWith(expect.stringContaining('.product-header svg'));
    expect(writeMock).toHaveBeenCalledWith(expect.stringContaining('Principios DUA'));
    expect(writeMock).toHaveBeenCalledWith(expect.not.stringContaining('Exportar PDF'));
    expect(printMock).toHaveBeenCalled();
    expect(html2canvasMock).not.toHaveBeenCalled();
  });

  it('uses A4 landscape print layout for rubric products with wide tables', async () => {
    document.body.innerHTML = `
      <article id="rubric">
        <div class="rubric-renderer"><table><tbody><tr><td>Criterio</td></tr></tbody></table></div>
      </article>
    `;
    const writeMock = vi.fn();
    const fakeWindow = {
      document: {
        close: vi.fn(),
        open: vi.fn(),
        write: writeMock,
      },
      focus: vi.fn(),
      print: vi.fn(),
      setTimeout: (callback: () => void) => callback(),
    } as unknown as Window;
    vi.spyOn(window, 'open').mockReturnValue(fakeWindow);

    const { exportElementToPDF } = await import('../src/utils/exportPdf');
    await exportElementToPDF('rubric', 'rubrica');

    expect(writeMock).toHaveBeenCalledWith(expect.stringContaining('size: A4 landscape'));
    expect(writeMock).toHaveBeenCalledWith(expect.stringContaining('max-width: 273mm'));
    expect(html2canvasMock).not.toHaveBeenCalled();
  });

  it('uses html2canvas compatibility only when browser print is unavailable', async () => {
    mountProduct();
    vi.spyOn(window, 'open').mockReturnValue(null);
    html2canvasMock.mockResolvedValue({
      height: 200,
      toDataURL: () => 'data:image/png;base64,ok',
      width: 100,
    });

    const { exportElementToPDF } = await import('../src/utils/exportPdf');
    await exportElementToPDF('product', 'guia-dua');

    expect(html2canvasMock).toHaveBeenCalled();
    expect(addImageMock).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalledWith('guia-dua.pdf');
  });

  it('uses textual PDF fallback only when print and canvas both fail', async () => {
    mountProduct();
    vi.spyOn(window, 'open').mockReturnValue(null);
    const warnMock = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    html2canvasMock.mockRejectedValue(new Error('canvas failed'));

    const { exportElementToPDF } = await import('../src/utils/exportPdf');
    await exportElementToPDF('product', 'guia-dua');

    expect(html2canvasMock).toHaveBeenCalled();
    expect(warnMock).toHaveBeenCalledWith(
      expect.stringContaining('PDF textual'),
      expect.any(Error),
    );
    expect(textMock).toHaveBeenCalledWith(expect.stringContaining('ProfePlanificAI'), 16, 16);
    expect(saveMock).toHaveBeenCalledWith('guia-dua.pdf');
  });
});
