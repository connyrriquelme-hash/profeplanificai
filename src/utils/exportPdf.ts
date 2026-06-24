import { mdToHtml } from './htmlUtils';

export async function exportToPDF(title: string, markdownContent: string): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const html = mdToHtml(markdownContent);

  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.cssText = `
    font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5;
    padding: 20px; color: #000; max-width: 190mm;
  `;
  container.querySelectorAll('h1, h2, h3').forEach((el) => {
    (el as HTMLElement).style.color = '#000';
    (el as HTMLElement).style.margin = '12px 0 6px';
  });
  container.querySelectorAll('ul').forEach((el) => {
    (el as HTMLElement).style.paddingLeft = '20px';
  });
  container.querySelectorAll('li').forEach((el) => {
    (el as HTMLElement).style.margin = '3px 0';
  });

  document.body.appendChild(container);

  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 190;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position + 10, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    pdf.save(`${title.replace(/[^a-zA-Z0-9áéíóúñ\s-]/g, '').trim()}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

export async function exportElementToPDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Elemento #${elementId} no encontrado`);

  const { default: html2canvas } = await import('html2canvas');
  const { default: jsPDF } = await import('jspdf');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 190;
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  const pdf = new jsPDF('p', 'mm', 'a4');
  pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
  heightLeft -= pageHeight - 20;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position + 10, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;
  }

  pdf.save(`${filename}.pdf`);
}
