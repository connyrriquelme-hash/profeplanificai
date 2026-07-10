/**
 * Export Formative Evaluation to Word (.docx) using HTML-based approach
 * Generates a .doc file that can be opened by Word
 */

export interface EvaluationExportOptions {
  evaluation: any;
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  topic: string;
  studentName?: string;
  date?: string;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

function generateExitTicketHtml(evaluation: any, opts: EvaluationExportOptions): string {
  const { level, subject, objectiveCode, topic } = opts;
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; line-height: 1.6; color: #1f2937; }
  .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #db2777; }
  .header h1 { color: #db2777; margin: 0 0 10px 0; font-size: 28px; }
  .header .subtitle { color: #6b7280; margin: 0; font-size: 16px; }
  .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; padding: 15px; background: #fdf2f8; border-radius: 8px; border: 1px solid #fce7f3; }
  .meta-item { display: flex; flex-direction: column; }
  .meta-label { font-size: 11px; text-transform: uppercase; color: #9d174d; font-weight: 600; letter-spacing: 0.5px; }
  .meta-value { font-size: 14px; color: #1f2937; font-weight: 500; }
  .section { margin-bottom: 25px; }
  .section-title { background: #fdf2f8; border-left: 4px solid #db2777; padding: 10px 15px; font-weight: 600; color: #9d174d; margin-bottom: 15px; border-radius: 0 8px 8px 0; }
  .instructions { background: #fef7f0; border: 1px solid #fde8d6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
  .instructions-title { font-weight: 600; color: #c2410c; margin-bottom: 5px; }
  .question { margin-bottom: 20px; padding: 15px; background: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; }
  .question-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .question-number { background: #db2777; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
  .question-text { font-weight: 500; color: #1f2937; }
  .answer-area { margin-top: 15px; padding: 15px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; min-height: 80px; }
  .traffic-light-options { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
  .traffic-option { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
  .traffic-option:hover { border-color: #db2777; background: #fdf2f8; }
  .traffic-option input { accent-color: #db2777; }
  .footer-fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  .field { display: flex; flex-direction: column; gap: 5px; }
  .field-label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .field-input { padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
  .curricular-info { margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 12px; color: #4b5563; }
  .curricular-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .curricular-item { display: flex; flex-direction: column; gap: 2px; }
  .curricular-label { font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px; }
  .curricular-value { font-weight: 500; color: #1f2937; }
  @media print {
    body { margin: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="header">
    <h1>🎫 ${escapeHtml(evaluation.title || 'Ticket de Salida')}</h1>
    <p class="subtitle">${escapeHtml(evaluation.subtitle || '')}</p>
  </div>

  <div class="meta">
    <div class="meta-item"><span class="meta-label">Nivel</span><span class="meta-value">${escapeHtml(opts.level)}</span></div>
    <div class="meta-item"><span class="meta-label">Asignatura</span><span class="meta-value">${escapeHtml(opts.subject)}</span></div>
    <div class="meta-item"><span class="meta-label">OA</span><span class="meta-value">${escapeHtml(opts.objectiveCode)}</span></div>
    <div class="meta-item"><span class="meta-label">Tema</span><span class="meta-value">${escapeHtml(opts.topic)}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Instrucciones</div>
    <div class="instructions">
      <div class="instructions-title">Instrucciones:</div>
      ${escapeHtml(evaluation.instructions || 'Completa antes de salir de clase. Responde con honestidad.')}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Preguntas</div>
    ${evaluation.questions?.map((q: any, i: number) => `
      <div class="question">
        <div class="question-header">
          <span class="question-number">${q.number || i + 1}</span>
          <span class="question-text">${escapeHtml(q.question)}</span>
        </div>
        ${q.type === 'traffic_light' && q.options ? `
          <div class="traffic-light-options">
            ${q.options.map((opt: string) => `
              <label class="traffic-option">
                <input type="radio" name="q${i}" />
                <span>${escapeHtml(opt)}</span>
              </label>
            `).join('')}
          </div>
        ` : `
          <div class="answer-area"></div>
        `}
      </div>
    `).join('') || '<p class="text-gray-500">Sin preguntas definidas</p>'}
  </div>

  <div class="footer-fields">
    <div class="field">
      <span class="field-label">Nombre</span>
      <input type="text" class="field-input" placeholder="Tu nombre" />
    </div>
    <div class="field">
      <span class="field-label">Fecha</span>
      <input type="date" class="field-input" />
    </div>
  </div>

  <div class="curricular-info">
    <strong>Datos curriculares:</strong>
    <div class="curricular-grid">
      <div class="curricular-item"><span class="curricular-label">Nivel</span><span class="curricular-value">${escapeHtml(opts.level)}</span></div>
      <div class="curricular-item"><span class="curricular-label">Asignatura</span><span class="curricular-value">${escapeHtml(opts.subject)}</span></div>
      <div class="curricular-item"><span class="curricular-label">OA</span><span class="curricular-value">${escapeHtml(opts.objectiveCode)}</span></div>
      <div class="curricular-item"><span class="curricular-label">Tema</span><span class="curricular-value">${escapeHtml(opts.topic)}</span></div>
    </div>
  </div>
</body>
</html>`;
}

function generate321Html(evaluation: any, opts: EvaluationExportOptions): string {
  const { level, subject, objectiveCode, topic } = opts;
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; line-height: 1.6; color: #1f2937; }
  .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #7c3aed; }
  .header h1 { color: #7c3aed; margin: 0 0 10px 0; font-size: 28px; }
  .header .subtitle { color: #6b7280; margin: 0; font-size: 16px; }
  .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; padding: 15px; background: #f5f3ff; border-radius: 8px; border: 1px solid #ddd6fe; }
  .meta-item { display: flex; flex-direction: column; }
  .meta-label { font-size: 11px; text-transform: uppercase; color: #5b21b6; font-weight: 600; letter-spacing: 0.5px; }
  .meta-value { font-size: 14px; color: #1f2937; font-weight: 500; }
  .section { margin-bottom: 25px; }
  .section-title { background: #f5f3ff; border-left: 4px solid #7c3aed; padding: 10px 15px; font-weight: 600; color: #5b21b6; margin-bottom: 15px; border-radius: 0 8px 8px 0; }
  .instructions { background: #faf5ff; border: 1px solid #e9d5ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
  .instructions-title { font-weight: 600; color: #7c3aed; margin-bottom: 5px; }
  .section-block { margin-bottom: 25px; padding: 20px; background: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; }
  .block-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb; }
  .block-number { background: #7c3aed; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; }
  .block-title { font-weight: 600; color: #1f2937; font-size: 18px; }
  .block-description { font-size: 14px; color: #6b7280; margin: 5px 0 15px 46px; }
  .lines { display: flex; flex-direction: column; gap: 12px; margin-left: 46px; }
  .line { border: none; border-bottom: 2px solid #d1d5db; padding: 8px 0; font-size: 16px; font-family: inherit; background: transparent; outline: none; transition: border-color 0.2s; }
  .line:focus { border-bottom-color: #7c3aed; outline: none; }
  .footer-fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  .field { display: flex; flex-direction: column; gap: 5px; }
  .field-label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .field-input { padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
  .curricular-info { margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 12px; color: #4b5563; }
  .curricular-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .curricular-item { display: flex; flex-direction: column; gap: 2px; }
  .curricular-label { font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px; }
  .curricular-value { font-weight: 500; color: #1f2937; }
  @media print { body { margin: 0; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="header">
    <h1>3️⃣ ${escapeHtml(evaluation.title || 'Formato 3-2-1')}</h1>
    <p class="subtitle">${escapeHtml(evaluation.subtitle || '')}</p>
  </div>

  <div class="meta">
    <div class="meta-item"><span class="meta-label">Nivel</span><span class="meta-value">${escapeHtml(opts.level)}</span></div>
    <div class="meta-item"><span class="meta-label">Asignatura</span><span class="meta-value">${escapeHtml(opts.subject)}</span></div>
    <div class="meta-item"><span class="meta-label">OA</span><span class="meta-value">${escapeHtml(opts.objectiveCode)}</span></div>
    <div class="meta-item"><span class="meta-label">Tema</span><span class="meta-value">${escapeHtml(opts.topic)}</span></div>
  </meta>

  <div class="section">
    <div class="section-title">Instrucciones</div>
    <div class="instructions">
      <div class="instructions-title">Instrucciones:</div>
      ${escapeHtml(evaluation.instructions || 'Completa cada sección con tus propias palabras.')}
    </div>
  </div>

  ${evaluation.sections?.map((s: any) => `
    <div class="section">
      <div class="section-title">${s.number} — ${escapeHtml(s.title)}</div>
      <div class="section-block">
        <div class="block-header">
          <span class="block-number">${s.number}</span>
          <span class="block-title">${escapeHtml(s.title)}</span>
        </div>
        <p class="block-description">${escapeHtml(s.description)}</p>
        <div class="lines">
          ${Array.from({ length: s.lines || 3 }, (_, i) => `
            <input type="text" class="line" placeholder="Escribe aquí..." />
          `).join('')}
        </div>
      </div>
    </div>
  `).join('') || '<p class="text-gray-500">Sin secciones definidas</p>'}

  <div class="footer-fields">
    <div class="field"><span class="field-label">Nombre</span><input type="text" class="field-input" placeholder="Tu nombre" /></div>
    <div class="field"><span class="field-label">Fecha</span><input type="date" class="field-input" /></div>
  </div>

  <div class="curricular-info">
    <strong>Datos curriculares:</strong>
    <div class="curricular-grid">
      <div class="curricular-item"><span class="curricular-label">Nivel</span><span class="curricular-value">${escapeHtml(opts.level)}</span></div>
      <div class="curricular-item"><span class="curricular-label">Asignatura</span><span class="curricular-value">${escapeHtml(opts.subject)}</span></div>
      <div class="curricular-item"><span class="curricular-label">OA</span><span class="curricular-value">${escapeHtml(opts.objectiveCode)}</span></div>
      <div class="curricular-item"><span class="curricular-label">Tema</span><span class="curricular-value">${escapeHtml(opts.topic)}</span></div>
    </div>
  </div>
</body>
</html>`;
}

function generateChecklistHtml(evaluation: any, opts: EvaluationExportOptions): string {
  const { level, subject, objectiveCode, topic } = opts;
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; line-height: 1.6; color: #1f2937; }
  .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #059669; }
  .header h1 { color: #059669; margin: 0 0 10px 0; font-size: 28px; }
  .header .subtitle { color: #6b7280; margin: 0; font-size: 16px; }
  .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; padding: 15px; background: #f0fdf4; border-radius: 8px; border: 1px solid #d1fae5; }
  .meta-item { display: flex; flex-direction: column; }
  .meta-label { font-size: 11px; text-transform: uppercase; color: #065f46; font-weight: 600; letter-spacing: 0.5px; }
  .meta-value { font-size: 14px; color: #1f2937; font-weight: 500; }
  .instructions { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
  .instructions-title { font-weight: 600; color: #166534; margin-bottom: 5px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
  th { background: #ecfdf5; color: #065f46; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #a7f3d0; }
  th.center, td.center { text-align: center; }
  td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
  tr:hover { background: #f0fdf4; }
  .response-options { display: flex; gap: 8px; justify-content: center; }
  .response-option { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 2px solid #e5e7eb; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
  .response-option:hover { border-color: #059669; background: #f0fdf4; }
  .response-option input { accent-color: #059669; }
  .summary { padding: 15px; background: #d1fae5; border: 1px solid #a7f3d0; border-radius: 8px; margin-bottom: 20px; font-weight: 500; color: #065f46; }
  .footer-fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  .field { display: flex; flex-direction: column; gap: 5px; }
  .field-label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .field-input { padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
  .curricular-info { margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 12px; color: #4b5563; }
  .curricular-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .curricular-item { display: flex; flex-direction: column; gap: 2px; }
  .curricular-label { font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px; }
  .curricular-value { font-weight: 500; color: #1f2937; }
  @media print { body { margin: 0; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="header">
    <h1>✅ ${escapeHtml(evaluation.title || 'Lista de Cotejo / Autoevaluación')}</h1>
    <p class="subtitle">${escapeHtml(evaluation.subtitle || '')}</p>
  </div>

  <div class="meta">
    <div class="meta-item"><span class="meta-label">Nivel</span><span class="meta-value">${escapeHtml(opts.level)}</span></div>
    <div class="meta-item"><span class="meta-label">Asignatura</span><span class="meta-value">${escapeHtml(opts.subject)}</span></div>
    <div class="meta-item"><span class="meta-label">OA</span><span class="meta-value">${escapeHtml(opts.objectiveCode)}</span></div>
    <div class="meta-item"><span class="meta-label">Tema</span><span class="meta-value">${escapeHtml(opts.topic)}</span></div>
  </meta>

  <div class="instructions">
    <div class="instructions-title">Instrucciones:</div>
    ${escapeHtml(evaluation.instructions || 'Marca cada criterio según tu desempeño: Sí / No / En proceso')}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px;">#</th>
        <th>Criterio</th>
        <th class="center" style="width: 80px;">✅ Sí</th>
        <th class="center" style="width: 100px;">⚠️ En proceso</th>
        <th class="center" style="width: 80px;">❌ No</th>
      </tr>
    </thead>
    <tbody>
      ${evaluation.criteria?.map((c: any) => `
        <tr>
          <td style="font-weight: 500; color: #6b7280;">${c.number}</td>
          <td>${escapeHtml(c.description)}</td>
          <td class="center"><input type="radio" name="c${c.number}" /></td>
          <td class="center"><input type="radio" name="c${c.number}" /></td>
          <td class="center"><input type="radio" name="c${c.number}" /></td>
        </tr>
      `).join('') || '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #9ca3af;">Sin criterios definidos</td></tr>'}
    </tbody>
  </table>

  ${evaluation.summaryRow ? `
    <div style="padding: 15px; background: #d1fae5; border: 1px solid #a7f3d0; border-radius: 8px; margin-bottom: 20px; font-weight: 500; color: #065f46;">
      Resumen: Cuenta tus respuestas para ver tu progreso
    </div>
  ` : ''}

  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <div style="display: flex; flex-direction: column; gap: 5px;">
      <label style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Nombre</label>
      <input type="text" style="padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" placeholder="Tu nombre" />
    </div>
    <div style="display: flex; flex-direction: column; gap: 5px;">
      <label style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Fecha</label>
      <input type="date" style="padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
    </div>
  </div>

  <div style="margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 12px; color: #4b5563;">
    <strong>Datos curriculares:</strong>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 10px;">
      <div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px;">Nivel</span><span style="font-weight: 500; color: #1f2937;">${escapeHtml(opts.level)}</span></div>
      <div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px;">Asignatura</span><span style="font-weight: 500; color: #1f2937;">${escapeHtml(opts.subject)}</span></div>
      <div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px;">OA</span><span style="font-weight: 500; color: #1f2937;">${escapeHtml(opts.objectiveCode)}</span></div>
      <div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px;">Tema</span><span style="font-weight: 500; color: #1f2937;">${escapeHtml(opts.topic)}</span></div>
    </div>
  </div>
</body>
</html>`;
}

function generateFormativeRubricHtml(evaluation: any, opts: EvaluationExportOptions): string {
  const { level, subject, objectiveCode, topic } = opts;
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; line-height: 1.6; color: #1f2937; }
  .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #dc2626; }
  .header h1 { color: #dc2626; margin: 0 0 10px 0; font-size: 28px; }
  .header .subtitle { color: #6b7280; margin: 0; font-size: 16px; }
  .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; padding: 15px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; }
  .meta-item { display: flex; flex-direction: column; }
  .meta-label { font-size: 11px; text-transform: uppercase; color: #991b1b; font-weight: 600; letter-spacing: 0.5px; }
  .meta-value { font-size: 14px; color: #1f2937; font-weight: 500; }
  .instructions { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
  .instructions-title { font-weight: 600; color: #991b1b; margin-bottom: 5px; }
  .criteria { margin-bottom: 25px; }
  .criterion { margin-bottom: 25px; padding: 20px; background: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; }
  .criterion-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .criterion-number { background: #dc2626; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
  .criterion-title { font-weight: 600; color: #1f2937; font-size: 18px; }
  .criterion-indicator { font-size: 13px; color: #6b7280; margin: 5px 0 15px 42px; }
  .levels { display: flex; flex-direction: column; gap: 10px; margin-left: 42px; }
  .level { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: white; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
  .level:hover { border-color: #dc2626; background: #fef2f2; }
  .level input { accent-color: #dc2626; flex-shrink: 0; }
  .level-info { flex: 1; }
  .level-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  .level-name { font-weight: 600; color: #1f2937; }
  .level-points { font-size: 12px; color: #6b7280; background: #fef2f2; padding: 2px 8px; border-radius: 4px; }
  .level-desc { font-size: 13px; color: #4b5563; margin-top: 4px; }
  .feedback-area { margin-top: 15px; }
  .feedback-label { display: block; font-size: 12px; font-weight: 600; color: #4b5563; margin-bottom: 5px; }
  .feedback-area textarea { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; font-family: inherit; resize: vertical; min-height: 60px; }
  .total-score { padding: 15px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-top: 20px; font-weight: 600; color: #991b1b; text-align: right; }
  .footer-fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  .field { display: flex; flex-direction: column; gap: 5px; }
  .field-label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .field-input { padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
  .curricular-info { margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 12px; color: #4b5563; }
  .curricular-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .curricular-item { display: flex; flex-direction: column; gap: 2px; }
  .curricular-label { font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px; }
  .curricular-value { font-weight: 500; color: #1f2937; }
  @media print { body { margin: 0; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="header">
    <h1>📊 ${escapeHtml(evaluation.title || 'Rúbrica Analítica Formativa')}</h1>
    <p class="subtitle">${escapeHtml(evaluation.subtitle || '')}</p>
  </div>

  <div class="meta">
    <div class="meta-item"><span class="meta-label">Nivel</span><span class="meta-value">${escapeHtml(opts.level)}</span></div>
    <div class="meta-item"><span class="meta-label">Asignatura</span><span class="meta-value">${escapeHtml(opts.subject)}</span></div>
    <div class="meta-item"><span class="meta-label">OA</span><span class="meta-value">${escapeHtml(opts.objectiveCode)}</span></div>
    <div class="meta-item"><span class="meta-label">Tema</span><span class="meta-value">${escapeHtml(opts.topic)}</span></div>
  </meta>

  <div style="padding: 15px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 20px;">
    <div style="font-weight: 600; color: #991b1b; margin-bottom: 5px;">Instrucciones:</div>
    ${escapeHtml(evaluation.instructions || 'Evalúa cada criterio marcando el nivel alcanzado. Escribe retroalimentación específica.')}
  </div>

  ${evaluation.criteria?.map((c: any) => `
    <div class="criteria">
      <div class="criterion">
        <div class="criterion-header">
          <span class="criterion-number">${c.number}</span>
          <h4 class="criterion-title">${escapeHtml(c.name)}</h4>
        </div>
        <p class="criterion-indicator">${escapeHtml(c.indicator)} — ${escapeHtml(c.skill)}</p>
        <div class="levels">
          ${c.levels?.map((l: any) => `
            <label class="level">
              <input type="radio" name="c${c.number}" />
              <div class="level-info">
                <div class="level-header">
                  <span class="level-name">${escapeHtml(l.level)}</span>
                  <span class="level-points">${l.points} pt</span>
                </div>
                <p class="level-desc">${escapeHtml(l.description)}</p>
              </div>
            </label>
          `).join('')}
        </div>
        ${c.feedbackRequired ? `
          <div class="feedback-area">
            <label class="feedback-label">Retroalimentación obligatoria:</label>
            <textarea placeholder="Escribe retroalimentación específica para este criterio..." rows="2"></textarea>
          </div>
        ` : ''}
      </div>
    </div>
  `).join('') || '<p style="text-align: center; color: #9ca3af; padding: 40px;">Sin criterios definidos</p>'}

  <div class="total-score">Total máximo: ${evaluation.totalScore || 9} puntos</div>

  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <div style="display: flex; flex-direction: column; gap: 5px;">
      <label style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Nombre</label>
      <input type="text" style="padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" placeholder="Tu nombre" />
    </div>
    <div style="display: flex; flex-direction: column; gap: 5px;">
      <label style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Fecha</label>
      <input type="date" style="padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
    </div>
  </div>

  <div style="margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 12px; color: #4b5563;">
    <strong>Datos curriculares:</strong>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 10px;">
      <div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px;">Nivel</span><span style="font-weight: 500; color: #1f2937;">${escapeHtml(opts.level)}</span></div>
      <div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px;">Asignatura</span><span style="font-weight: 500; color: #1f2937;">${escapeHtml(opts.subject)}</span></div>
      <div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px;">OA</span><span style="font-weight: 500; color: #1f2937;">${escapeHtml(opts.objectiveCode)}</span></div>
      <div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px;">Tema</span><span style="font-weight: 500; color: #1f2937;">${escapeHtml(opts.topic)}</span></div>
    </div>
  </div>
</body>
</html>`;
}

function generateTrafficLightHtml(evaluation: any, opts: EvaluationExportOptions): string {
  const { level, subject, objectiveCode, topic } = opts;
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; line-height: 1.6; color: #1f2937; }
  .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #ea580c; }
  .header h1 { color: #ea580c; margin: 0 0 10px 0; font-size: 28px; }
  .header .subtitle { color: #6b7280; margin: 0; font-size: 16px; }
  .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; padding: 15px; background: #fff7ed; border-radius: 8px; border: 1px solid #fed7aa; }
  .meta-item { display: flex; flex-direction: column; }
  .meta-label { font-size: 11px; text-transform: uppercase; color: #9a3412; font-weight: 600; letter-spacing: 0.5px; }
  .meta-value { font-size: 14px; color: #1f2937; font-weight: 500; }
  .instructions { background: #fff7ed; border: 1px solid #fed7aa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
  .instructions-title { font-weight: 600; color: #c2410c; margin-bottom: 5px; }
  .aspect { margin-bottom: 30px; padding: 20px; background: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; }
  .aspect-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .aspect-number { background: #ea580c; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; }
  .aspect-title { font-weight: 600; color: #1f2937; font-size: 18px; }
  .aspect-indicator { font-size: 13px; color: #6b7280; margin: 5px 0 15px 48px; }
  .colors-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 15px; }
  .color-option { display: flex; flex-direction: column; align-items: center; padding: 16px; border: 2px solid #e5e7eb; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
  .color-option:hover { border-color: #ea580c; background: #fff7ed; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(234, 88, 12, 0.15); }
  .color-option input { accent-color: #ea580c; margin-bottom: 8px; width: 20px; height: 20px; }
  .color-badge { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
  .color-meaning { font-size: 12px; color: #6b7280; text-align: center; margin-top: 4px; }
  .meaning-box { margin-top: 15px; padding: 12px; background: #fef3c7; border-radius: 8px; font-size: 12px; color: #92400e; }
  .meaning-box strong { color: #92400e; }
  .footer-fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  .field { display: flex; flex-direction: column; gap: 5px; }
  .field-label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .field-input { padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
  .curricular-info { margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 12px; color: #4b5563; }
  .curricular-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .curricular-item { display: flex; flex-direction: column; gap: 2px; }
  .curricular-label { font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px; }
  .curricular-value { font-weight: 500; color: #1f2937; }
  @media print { body { margin: 0; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="header">
    <h1>🚦 ${escapeHtml(evaluation.title || 'Semáforo de Comprensión')}</h1>
    <p class="subtitle">${escapeHtml(evaluation.subtitle || '')}</p>
  </div>

  <div class="meta">
    <div class="meta-item"><span class="meta-label">Nivel</span><span class="meta-value">${escapeHtml(opts.level)}</span></div>
    <div class="meta-item"><span class="meta-label">Asignatura</span><span class="meta-value">${escapeHtml(opts.subject)}</span></div>
    <div class="meta-item"><span class="meta-label">OA</span><span class="meta-value">${escapeHtml(opts.objectiveCode)}</span></div>
    <div class="meta-item"><span class="meta-label">Tema</span><span class="meta-value">${escapeHtml(opts.topic)}</span></div>
  </meta>

  <div style="padding: 15px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; margin-bottom: 20px;">
    <div style="font-weight: 600; color: #c2410c; margin-bottom: 5px;">Instrucciones:</div>
    ${escapeHtml(evaluation.instructions || 'Marca el color que representa tu nivel de comprensión para cada aspecto.')}
  </div>

  ${evaluation.aspects?.map((a: any) => `
    <div class="aspect">
      <div class="aspect-header">
        <span class="aspect-number">${a.number}</span>
        <h4 class="aspect-title">${escapeHtml(a.description)}</h4>
      </div>
      <p class="aspect-indicator">${escapeHtml(a.indicator)}</p>
      <div class="colors-grid">
        ${evaluation.colors?.map((col: any) => `
          <label class="color-option">
            <input type="radio" name="a${a.number}" />
            <span class="color-badge">${escapeHtml(col.color)}</span>
            <span class="color-meaning">${escapeHtml(col.meaning)}</span>
          </label>
        `).join('')}
      </div>
      <div class="meaning-box">
        <strong>Significado:</strong> ${evaluation.colors?.map((col: any) => `${col.color}: ${col.meaning} — ${col.action}`).join(' | ')}
      </div>
    </div>
  `).join('') || '<p style="text-align: center; color: #9ca3af; padding: 40px;">Sin aspectos definidos</p>'}

  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <div style="display: flex; flex-direction: column; gap: 5px;">
      <label style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Nombre</label>
      <input type="text" style="padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" placeholder="Tu nombre" />
    </div>
    <div style="display: flex; flex-direction: column; gap: 5px;">
      <label style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Fecha</label>
      <input type="date" style="padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
    </div>
  </div>

  <div style="margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 12px; color: #4b5563;">
    <strong>Datos curriculares:</strong>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 10px;">
      <div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px;">Nivel</span><span style="font-weight: 500; color: #1f2937;">${escapeHtml(opts.level)}</span></div>
      <div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px;">Asignatura</span><span style="font-weight: 500; color: #1f2937;">${escapeHtml(opts.subject)}</span></div>
      <div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px;">OA</span><span style="font-weight: 500; color: #1f2937;">${escapeHtml(opts.objectiveCode)}</span></div>
      <div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px;">Tema</span><span style="font-weight: 500; color: #1f2937;">${escapeHtml(opts.topic)}</span></div>
    </div>
  </div>
</body>
</html>`;
}

function generateDefaultHtml(evaluation: any, opts: EvaluationExportOptions): string {
  const { level, subject, objectiveCode, topic } = opts;
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; line-height: 1.6; color: #1f2937; }
  .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #6b7280; }
  .header h1 { color: #374151; margin: 0 0 10px 0; font-size: 28px; }
  .header .subtitle { color: #6b7280; margin: 0; font-size: 16px; }
  .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; border: 1px solid #e5e7eb; }
  .meta-item { display: flex; flex-direction: column; }
  .meta-label { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600; letter-spacing: 0.5px; }
  .meta-value { font-size: 14px; color: #1f2937; font-weight: 500; }
  .section { margin-bottom: 25px; }
  .section-title { background: #f3f4f6; border-left: 4px solid #6b7280; padding: 10px 15px; font-weight: 600; color: #374151; margin-bottom: 15px; border-radius: 0 8px 8px 0; }
  .instructions { background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
  .instructions-title { font-weight: 600; color: #374151; margin-bottom: 5px; }
  .footer-fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  .field { display: flex; flex-direction: column; gap: 5px; }
  .field-label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .field-input { padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
  .curricular-info { margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 12px; color: #4b5563; }
  .curricular-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .curricular-item { display: flex; flex-direction: column; gap: 2px; }
  .curricular-label { font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px; }
  .curricular-value { font-weight: 500; color: #1f2937; }
  @media print { body { margin: 0; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(evaluation.title || 'Evaluación Formativa')}</h1>
    <p class="subtitle">${escapeHtml(evaluation.subtitle || '')}</p>
  </div>

  <div class="meta">
    <div class="meta-item"><span class="meta-label">Nivel</span><span class="meta-value">${escapeHtml(opts.level)}</span></div>
    <div class="meta-item"><span class="meta-label">Asignatura</span><span class="meta-value">${escapeHtml(opts.subject)}</span></div>
    <div class="meta-item"><span class="meta-label">OA</span><span class="meta-value">${escapeHtml(opts.objectiveCode)}</span></div>
    <div class="meta-item"><span class="meta-label">Tema</span><span class="meta-value">${escapeHtml(opts.topic)}</span></div>
  </meta>

  <div class="section">
    <div class="section-title">Instrucciones</div>
    <div class="instructions">
      <div class="instructions-title">Instrucciones:</div>
      ${escapeHtml(evaluation.instructions || 'Completa la evaluación según las indicaciones.')}
    </div>
  </div>

  <pre style="white-space: pre-wrap; font-family: inherit; background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">${JSON.stringify(evaluation, null, 2)}</pre>

  <div class="footer-fields">
    <div class="field"><span class="field-label">Nombre</span><input type="text" class="field-input" placeholder="Tu nombre" /></div>
    <div class="field"><span class="field-label">Fecha</span><input type="date" class="field-input" /></div>
  </div>

  <div style="margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 12px; color: #4b5563;">
    <strong>Datos curriculares:</strong>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 10px;">
      <div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px;">Nivel</span><span style="font-weight: 500; color: #1f2937;">${escapeHtml(opts.level)}</span></div>
      <div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px;">Asignatura</span><span style="font-weight: 500; color: #1f2937;">${escapeHtml(opts.subject)}</span></div>
      <div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px;">OA</span><span style="font-weight: 500; color: #1f2937;">${escapeHtml(opts.objectiveCode)}</span></div>
      <div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px;">Tema</span><span style="font-weight: 500; color: #1f2937;">${escapeHtml(opts.topic)}</span></div>
    </div>
  </div>
</body>
</html>`;
}

export function exportEvaluationToWord(opts: EvaluationExportOptions): void {
  const { evaluation } = opts;
  const subType = evaluation?.evaluationSubType;

  let html = '';

  switch (subType) {
    case 'evaluation_exit_ticket':
      html = generateExitTicketHtml(evaluation, opts);
      break;
    case 'evaluation_321':
      html = generate321Html(evaluation, opts);
      break;
    case 'evaluation_checklist':
      html = generateChecklistHtml(evaluation, opts);
      break;
    case 'evaluation_formative_rubric':
      html = generateFormativeRubricHtml(evaluation, opts);
      break;
    case 'evaluation_traffic_light':
      html = generateTrafficLightHtml(evaluation, opts);
      break;
    default:
      html = generateDefaultHtml(evaluation, opts);
  }

  const blob = new Blob([html], { type: 'application/msword' });
  const filename = `${subType || 'evaluacion'}-${opts.subject.replace(/\s+/g, '-')}-${opts.level.replace(/\s+/g, '-')}.doc`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadEvaluationHtml(opts: EvaluationExportOptions): void {
  const { evaluation } = opts;
  const subType = evaluation?.evaluationSubType;

  let html = '';

  switch (subType) {
    case 'evaluation_exit_ticket':
      html = generateExitTicketHtml(evaluation, opts);
      break;
    case 'evaluation_321':
      html = generate321Html(evaluation, opts);
      break;
    case 'evaluation_checklist':
      html = generateChecklistHtml(evaluation, opts);
      break;
    case 'evaluation_formative_rubric':
      html = generateFormativeRubricHtml(evaluation, opts);
      break;
    case 'evaluation_traffic_light':
      html = generateTrafficLightHtml(evaluation, opts);
      break;
    default:
      html = generateDefaultHtml(evaluation, opts);
  }

  const blob = new Blob([html], { type: 'text/html' });
  const filename = `${evaluation.evaluationSubType || 'evaluacion'}-${opts.subject.replace(/\s+/g, '-')}-${opts.level.replace(/\s+/g, '-')}.html`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}