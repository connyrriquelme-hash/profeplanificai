import type { ParentReportBatch, ParentStudentReport } from '../services/reportImportService';

async function loadJsPDF() {
  const { default: jsPDF } = await import('jspdf');
  return jsPDF;
}

function drawHeader(doc: any, batch: ParentReportBatch, pageW: number) {
  doc.setFillColor(139, 92, 246);
  doc.rect(0, 0, pageW, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Informe de Resultados de Aprendizaje', 15, 13);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${batch.subject} — ${batch.course}`, 15, 21);
  doc.text(`${batch.evaluationName || 'Evaluación'} — ${batch.reportDate || new Date().toLocaleDateString('es-CL')}`, 15, 27);
  doc.setFontSize(8);
  doc.text(`${batch.school || ''} · ${batch.teacher || ''}`, 15, 31);
}

function drawStudentReport(doc: any, student: ParentStudentReport, batch: ParentReportBatch, yStart: number, pageW: number, pageH: number): number {
  let y = yStart;

  // Student name with achievement level badge
  const levelColors: Record<string, [number, number, number]> = {
    'Adecuado': [16, 185, 129], 'Elemental': [245, 158, 11], 'Insuficiente': [239, 68, 68], 'No evaluado': [148, 163, 184],
  };
  const lvlColor = levelColors[student.achievementLevel] || [148, 163, 184];
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(10, y, pageW - 20, 10, 2, 2, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(student.studentName, 15, y + 7);
  // Level badge
  doc.setFillColor(...lvlColor);
  doc.roundedRect(pageW - 60, y + 1, 48, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(student.achievementLevel.toUpperCase(), pageW - 56, y + 7);
  y += 14;

  // Info grid
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const col1 = 15;
  const col2 = pageW / 2 + 5;
  const lineH = 4.5;

  const info = [
    ['Curso:', batch.course, 'Asignatura:', batch.subject],
    ['Evaluación:', batch.evaluationName || '-', 'Docente:', batch.teacher || '-'],
    ['Puntaje:', `${student.score}/${student.maxScore}`, 'Porcentaje:', `${student.achievementPercent}%`],
    ['Nota:', `${student.grade}`, 'Nivel:', student.achievementLevel],
  ];

  for (const [l1, v1, l2, v2] of info) {
    doc.setFont('helvetica', 'bold');
    doc.text(l1, col1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(v1).substring(0, 40), col1 + 22, y);
    if (l2) {
      doc.setFont('helvetica', 'bold');
      doc.text(l2, col2, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(v2).substring(0, 40), col2 + 22, y);
    }
    y += lineH;
  }
  y += 3;

  // Achieved indicators
  if (student.achievedIndicators.length > 0 && student.achievedIndicators[0]) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129);
    doc.text('Indicadores logrados:', col1, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    for (const ind of student.achievedIndicators.slice(0, 4)) {
      if (y > pageH - 20) break;
      doc.text(`  • ${String(ind).substring(0, 80)}`, col1, y);
      y += 3.5;
    }
    y += 2;
  }

  // Needs support
  if (student.needsSupportIndicators.length > 0 && student.needsSupportIndicators[0]) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(245, 158, 11);
    doc.text('Indicadores por reforzar:', col1, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    for (const ind of student.needsSupportIndicators.slice(0, 4)) {
      if (y > pageH - 20) break;
      doc.text(`  • ${String(ind).substring(0, 80)}`, col1, y);
      y += 3.5;
    }
    y += 2;
  }

  // AI Feedback
  const feedback = student.finalParentReport || student.aiFeedbackForParents || student.teacherObservation || '';
  if (feedback) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(139, 92, 246);
    doc.text('Retroalimentación para la familia:', col1, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(feedback, pageW - 30);
    for (const line of lines) {
      if (y > pageH - 25) break;
      doc.text(line, col1, y);
      y += 3.5;
    }
    y += 3;
  }

  // Family suggestions
  if (student.familySuggestions.length > 0 && student.familySuggestions[0]) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(139, 92, 246);
    doc.text('Sugerencias para apoyar en casa:', col1, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(8);
    for (const sug of student.familySuggestions.slice(0, 4)) {
      if (y > pageH - 25) break;
      doc.text(`  • ${String(sug).substring(0, 80)}`, col1, y);
      y += 3.5;
    }
    y += 5;
  }

  // Signature
  if (y < pageH - 25) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('_________________________', col1, y);
    doc.text('Firma Docente', col1 + 15, y + 4);
    y += 10;
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generado por PlanificaIA Chile — ${new Date().toLocaleDateString('es-CL')}`, 15, pageH - 8);

  return y;
}

export async function exportParentReportIndividualPDF(batch: ParentReportBatch, student: ParentStudentReport): Promise<void> {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  drawHeader(doc, batch, pageW);
  drawStudentReport(doc, student, batch, 35, pageW, pageH);

  const safeName = student.studentName.replace(/[^a-zA-Z0-9ñÑ]/g, '_').substring(0, 30);
  doc.save(`Informe_${safeName}_${batch.course}.pdf`);
}

export async function exportParentReportMassivePDF(batch: ParentReportBatch): Promise<void> {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Cover page
  doc.setFillColor(139, 92, 246);
  doc.rect(0, 0, pageW, pageH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Informes de Aprendizaje', pageW / 2, 55, { align: 'center' });
  doc.setFontSize(16);
  doc.text(`${batch.subject} — ${batch.course}`, pageW / 2, 68, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${batch.evaluationName || 'Evaluación'}`, pageW / 2, 80, { align: 'center' });
  doc.text(`Fecha: ${batch.reportDate || new Date().toLocaleDateString('es-CL')}`, pageW / 2, 88, { align: 'center' });
  doc.text(`Docente: ${batch.teacher || '-'}`, pageW / 2, 96, { align: 'center' });

  const totalStudents = batch.sheets.reduce((sum, s) => sum + s.students.length, 0);
  doc.setFontSize(10);
  doc.text(`Total estudiantes: ${totalStudents}`, pageW / 2, 110, { align: 'center' });
  doc.setFontSize(9);
  doc.text(`Colegio: ${batch.school || '-'}`, pageW / 2, 120, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Generado por PlanificaIA Chile — Currículum Nacional MINEDUC', pageW / 2, pageH - 15, { align: 'center' });

  // Student reports
  for (const sheet of batch.sheets) {
    for (const student of sheet.students) {
      doc.addPage();
      drawHeader(doc, batch, pageW);
      drawStudentReport(doc, student, batch, 35, pageW, pageH);
    }
  }

  doc.save(`Informes_${batch.course}_${batch.subject}.pdf`);
}
