import type { ReportConfig, ReportIndicator, StudentData, StudentScore, StudentReportResult } from '../types';

export async function exportStudentReportPDF(
  config: ReportConfig,
  student: StudentData,
  indicators: ReportIndicator[],
  scores: StudentScore,
  result: StudentReportResult,
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 15;

  const black: [number, number, number] = [0, 0, 0];
  const gray: [number, number, number] = [100, 100, 100];
  const indigo: [number, number, number] = [79, 70, 229];
  const white: [number, number, number] = [255, 255, 255];

  doc.setFont('helvetica', 'normal');

  // ── HEADER ──
  doc.setFillColor(...indigo);
  doc.rect(0, 0, pageW, 32, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...white);
  doc.text(config.schoolName.toUpperCase(), pageW / 2, 12, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('INFORME FINAL FORMATIVO', pageW / 2, 18, { align: 'center' });

  doc.setFontSize(8);
  doc.text(`${config.subject}  |  ${config.course}`, pageW / 2, 24, { align: 'center' });

  y = 40;

  // ── STUDENT INFO ──
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text('NOMBRE:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(student.name, margin + 22, y);

  doc.text('PROFESOR(A):', margin + 100, y);
  doc.setFont('helvetica', 'normal');
  doc.text(config.teacher, margin + 120, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('CURSO:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(config.course, margin + 22, y);

  doc.text('FECHA:', margin + 100, y);
  doc.text(config.reportDate, margin + 120, y);

  y += 10;

  // ── SCORE SUMMARY ──
  doc.setFillColor(240, 243, 255);
  doc.roundedRect(margin, y, contentW, 18, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`PUNTAJE TOTAL: ${result.totalScore}/${config.maxScore}`, margin + 5, y + 7);
  doc.text(`% LOGRO: ${result.percentage}%`, margin + 70, y + 7);
  doc.text(`NOTA: ${result.grade.toFixed(1)}`, margin + 120, y + 7);

  doc.setFontSize(10);
  const nivelColor = result.nivelLogro === 'Adecuado' ? [16, 185, 129] :
    result.nivelLogro === 'Elemental' ? [245, 158, 11] :
    result.nivelLogro === 'Insuficiente' ? [239, 68, 68] : gray;
  doc.setTextColor(...nivelColor as [number, number, number]);
  doc.text(`NIVEL: ${result.nivelLogro}`, margin + 5, y + 14);
  doc.setTextColor(...black);

  y += 24;

  // ── INDICATORS TABLE ──
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INDICADORES DE EVALUACION', margin, y);
  y += 6;

  // Table header
  doc.setFillColor(...indigo);
  doc.rect(margin, y, contentW, 7, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...white);
  doc.text('#', margin + 2, y + 5);
  doc.text('OA', margin + 8, y + 5);
  doc.text('INDICADOR', margin + 20, y + 5);
  doc.text('PTJE', margin + contentW - 30, y + 5);
  doc.text('OBT.', margin + contentW - 20, y + 5);
  doc.text('%', margin + contentW - 10, y + 5);
  y += 7;

  doc.setTextColor(...black);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  indicators.forEach((ind, idx) => {
    const score = scores.indicatorScores[ind.id] ?? 0;
    const pct = ind.maxPoints > 0 ? Math.round((score / ind.maxPoints) * 100) : 0;

    const rowH = 8;
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentW, rowH, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.text(`${idx + 1}`, margin + 2, y + 5);
    doc.text(ind.oaCode, margin + 8, y + 5);

    // Truncate description
    const maxDescW = contentW - 55;
    let desc = ind.description;
    while (doc.getTextWidth(desc) > maxDescW && desc.length > 0) {
      desc = desc.slice(0, -1);
    }
    if (desc !== ind.description) desc += '...';
    doc.text(desc, margin + 20, y + 5);

    doc.text(`${ind.maxPoints}`, margin + contentW - 30, y + 5);
    doc.text(`${score}`, margin + contentW - 20, y + 5);
    doc.text(`${pct}%`, margin + contentW - 10, y + 5);

    y += rowH;
  });

  y += 6;

  // ── OBSERVATIONS ──
  if (student.observations) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVACIONES', margin, y);
    y += 6;

    doc.setFillColor(248, 250, 252);
    const obsLines = doc.splitTextToSize(student.observations, contentW - 10);
    const obsH = obsLines.length * 4.5 + 8;
    doc.roundedRect(margin, y, contentW, obsH, 2, 2, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(obsLines, margin + 5, y + 6);
    doc.setTextColor(...black);
    y += obsH + 6;
  }

  // ── SIGNATURES ──
  y = Math.max(y + 20, 230);
  doc.setDrawColor(180, 180, 180);
  doc.line(margin + 20, y, margin + 80, y);
  doc.line(pageW - margin - 80, y, pageW - margin - 20, y);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Firma Profesor(a)', margin + 35, y + 5);
  doc.text('Visto Bueno Direccion', pageW - margin - 55, y + 5);

  // ── FOOTER ──
  doc.setFontSize(7);
  doc.setTextColor(...gray);
  doc.text('Generado por PlanificaIA Chile - ProfePlanificAI', pageW / 2, 265, { align: 'center' });
  doc.text(`Fecha emision: ${new Date().toLocaleDateString('es-CL')}`, pageW / 2, 269, { align: 'center' });

  doc.save(`Informe_${student.name.replace(/\s+/g, '_')}_${config.course.replace(/\s+/g, '_')}.pdf`);
}

export async function exportClassSummaryPDF(
  config: ReportConfig,
  indicators: ReportIndicator[],
  students: StudentData[],
  scores: StudentScore[],
  results: StudentReportResult[],
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;

  const black: [number, number, number] = [0, 0, 0];
  const white: [number, number, number] = [255, 255, 255];
  const indigo: [number, number, number] = [79, 70, 229];
  const gray: [number, number, number] = [100, 100, 100];

  let y = 12;

  // Header
  doc.setFillColor(...indigo);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...white);
  doc.text(config.schoolName.toUpperCase(), pageW / 2, 9, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`INFORME FORMATIVO  |  ${config.subject}  |  ${config.course}  |  Prof: ${config.teacher}  |  Fecha: ${config.reportDate}`, pageW / 2, 16, { align: 'center' });
  y = 28;

  // Table header
  const colNum = 8;
  const colName = 60;
  const colIndW = (contentW - colNum - colName - 40) / indicators.length;
  const colTotal = 14;
  const colPct = 12;
  const colGrade = 12;
  const colNivel = 18;

  doc.setFillColor(...indigo);
  doc.rect(margin, y, contentW, 8, 'F');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...white);

  let cx = margin;
  doc.text('#', cx + 1, y + 5.5); cx += colNum;
  doc.text('NOMBRE DEL ESTUDIANTE', cx + 1, y + 5.5); cx += colName;
  indicators.forEach((ind, i) => {
    doc.text(ind.oaCode, cx + 1, y + 3.5);
    doc.text(`Ind ${i + 1}`, cx + 1, y + 6.5);
    cx += colIndW;
  });
  doc.text('TOTAL', cx + 1, y + 5.5); cx += colTotal;
  doc.text('%', cx + 1, y + 5.5); cx += colPct;
  doc.text('NOTA', cx + 1, y + 5.5); cx += colGrade;
  doc.text('NIVEL', cx + 1, y + 5.5);
  y += 8;

  // Rows
  doc.setTextColor(...black);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);

  students.forEach((student, idx) => {
    if (y > pageH - 20) {
      doc.addPage();
      y = 15;
    }

    const result = results.find(r => r.studentId === student.id);
    const studentScore = scores.find(s => s.studentId === student.id);

    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentW, 6, 'F');
    }

    cx = margin;
    doc.text(`${idx + 1}`, cx + 1, y + 4); cx += colNum;

    let name = student.name;
    while (doc.getTextWidth(name) > colName - 3 && name.length > 0) name = name.slice(0, -1);
    if (name !== student.name) name += '...';
    doc.text(name, cx + 1, y + 4); cx += colName;

    indicators.forEach(ind => {
      const score = studentScore?.indicatorScores[ind.id] ?? 0;
      doc.text(`${score}`, cx + colIndW / 2, y + 4, { align: 'center' });
      cx += colIndW;
    });

    doc.text(`${result?.totalScore ?? 0}`, cx + 1, y + 4); cx += colTotal;
    doc.text(`${result?.percentage ?? 0}%`, cx + 1, y + 4); cx += colPct;
    doc.text(`${result?.grade.toFixed(1) ?? '-'}`, cx + 1, y + 4); cx += colGrade;

    const nivelColor = result?.nivelLogro === 'Adecuado' ? [16, 185, 129] :
      result?.nivelLogro === 'Elemental' ? [245, 158, 11] :
      result?.nivelLogro === 'Insuficiente' ? [239, 68, 68] : gray;
    doc.setTextColor(...nivelColor as [number, number, number]);
    doc.text(result?.nivelLogro ?? '-', cx + 1, y + 4);
    doc.setTextColor(...black);

    y += 6;
  });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(...gray);
  doc.text('PlanificaIA Chile - ProfePlanificAI', margin, pageH - 8);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, pageW - margin, pageH - 8, { align: 'right' });

  doc.save(`Resumen_${config.course.replace(/\s+/g, '_')}_${config.subject.replace(/\s+/g, '_')}.pdf`);
}
