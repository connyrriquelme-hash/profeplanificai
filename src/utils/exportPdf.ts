/**
 * Estrategia PDF premium: window.print() nativo del navegador.
 * - Texto seleccionable, vectores, CSS moderno (oklch) sin problemas
 * - Fallback textual solo cuando getElementById falla o excepción severa
 */

export async function exportToPdf(elementId: string, filename: string, fallbackText?: string): Promise<boolean> {
  try {
    const targetElement = document.getElementById(elementId);
    if (!targetElement) {
      console.warn('Elemento no encontrado para PDF. Usando fallback textual.');
      return triggerTextFallback(filename, fallbackText);
    }

    const originalTitle = document.title;
    document.title = filename;

    document.body.classList.add('premium-pdf-print-mode');
    targetElement.classList.add('premium-pdf-target');

    window.print();

    document.title = originalTitle;
    document.body.classList.remove('premium-pdf-print-mode');
    targetElement.classList.remove('premium-pdf-target');

    return true;
  } catch (error) {
    console.error('Error al generar PDF premium nativo. Usando fallback textual:', error);
    return triggerTextFallback(filename, fallbackText);
  }
}

function triggerTextFallback(filename: string, content?: string): boolean {
  if (!content) return false;
  try {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-fallback.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error('Fallback textual falló', e);
    return false;
  }
}

export async function exportElementToPDF(elementId: string, filename: string): Promise<boolean> {
  return exportToPdf(elementId, filename);
}

export async function exportToPDF(title: string, markdownContent: string): Promise<void> {
  const fallbackContent = `# ${title}\n\n${markdownContent}`;
  triggerTextFallback(title, fallbackContent);
}
