import * as XLSX from 'xlsx';

export interface ParentStudentReport {
  id: string;
  studentName: string;
  score: number;
  maxScore: number;
  achievementPercent: number;
  grade: number;
  achievementLevel: string;
  objectives: string[];
  achievedIndicators: string[];
  needsSupportIndicators: string[];
  strengths: string[];
  needsSupport: string[];
  familySuggestions: string[];
  aiFeedbackForParents: string;
  teacherObservation: string;
  finalParentReport: string;
  status: 'pendiente' | 'generando' | 'generado' | 'editado' | 'error';
}

export interface ParentReportSheet {
  sheetNumber: number;
  students: ParentStudentReport[];
}

export interface ParentReportBatch {
  id: string;
  school: string;
  teacher: string;
  course: string;
  subject: string;
  evaluationName: string;
  reportDate: string;
  maxScore: number;
  maxStudentsPerSheet: number;
  sheets: ParentReportSheet[];
}

function generateId(): string {
  return `rpt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

function cleanText(val: any): string {
  if (val == null) return '';
  return String(val).trim().replace(/\s+/g, ' ');
}

function parseNumber(val: any): number {
  if (val == null) return 0;
  const n = Number(String(val).replace(',', '.').replace('%', '').trim());
  return Number.isFinite(n) ? n : 0;
}

function detectHeaderRow(rows: any[][]): number {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    if (!row) continue;
    const text = row.map(c => String(c || '').toLowerCase()).join(' ');
    if (text.includes('nombre') && (text.includes('puntaje') || text.includes('nota') || text.includes('logro') || text.includes('%'))) {
      return i;
    }
  }
  return -1;
}

function mapHeaders(row: any[]): Record<string, number> {
  const map: Record<string, number> = {};
  row.forEach((cell, idx) => {
    const lower = String(cell || '').toLowerCase().trim();
    if (lower.includes('nombre') && lower.includes('estudiante')) map.studentName = idx;
    else if (lower.includes('nombre')) map.studentName = idx;
    else if (lower.includes('puntaje') && (lower.includes('total') || lower.includes('obtenido'))) map.score = idx;
    else if (lower.includes('puntaje')) map.score = idx;
    else if (lower.includes('%') && lower.includes('logro')) map.achievementPercent = idx;
    else if (lower.includes('porcentaje')) map.achievementPercent = idx;
    else if (lower === 'nota' || lower.includes('nota final') || lower.includes('calificacion')) map.grade = idx;
    else if (lower.includes('logro') && !lower.includes('%')) map.achievementLevel = idx;
    else if (lower.includes('nivel')) map.achievementLevel = idx;
    else if (lower.includes('observacion')) map.observation = idx;
    else if (lower.includes('fortaleza') || lower.includes('logrado')) map.strengths = idx;
    else if (lower.includes('reforz') || lower.includes('descend') || lower.includes('mejorar')) map.needsSupport = idx;
  });
  return map;
}

function detectMetadata(rows: any[][], headerRow: number): Partial<ParentReportBatch> {
  const meta: Partial<ParentReportBatch> = {};
  for (let i = 0; i < headerRow; i++) {
    const row = rows[i];
    if (!row) continue;
    const text = row.map(c => String(c || '')).join(' ').toLowerCase();
    if (text.includes('colegio') || text.includes('institucion')) {
      const val = row.find(c => String(c || '').toLowerCase().includes('colegio') || String(c || '').toLowerCase().includes('institucion'));
      meta.school = cleanText(val) || cleanText(row[row.length - 1]);
    }
    if (text.includes('docente') || text.includes('profesor')) {
      const val = row.find(c => String(c || '').toLowerCase().includes('docente') || String(c || '').toLowerCase().includes('profesor'));
      meta.teacher = cleanText(val) || cleanText(row[row.length - 1]);
    }
    if (text.includes('curso') || text.includes('seccion')) {
      const val = row.find(c => String(c || '').toLowerCase().includes('curso') || String(c || '').toLowerCase().includes('seccion'));
      meta.course = cleanText(val) || cleanText(row[row.length - 1]);
    }
    if (text.includes('asignatura') || text.includes('materia')) {
      const val = row.find(c => String(c || '').toLowerCase().includes('asignatura') || String(c || '').toLowerCase().includes('materia'));
      meta.subject = cleanText(val) || cleanText(row[row.length - 1]);
    }
    if (text.includes('evaluacion') || text.includes('prueba') || text.includes('examen')) {
      const val = row.find(c => String(c || '').toLowerCase().includes('evaluacion') || String(c || '').toLowerCase().includes('prueba'));
      meta.evaluationName = cleanText(val) || cleanText(row[row.length - 1]);
    }
    if (text.includes('fecha')) {
      const val = row.find(c => String(c || '').toLowerCase().includes('fecha'));
      meta.reportDate = cleanText(val) || cleanText(row[row.length - 1]);
    }
    if (text.includes('puntaje ideal') || text.includes('puntaje maximo') || text.includes('puntaje max')) {
      const num = row.find(c => typeof c === 'number' || (typeof c === 'string' && /^\d+$/.test(c.trim())));
      meta.maxScore = parseNumber(num);
    }
  }
  return meta;
}

export function importParentReportExcel(file: File): Promise<ParentReportBatch> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const sheetName = workbook.SheetNames.find(n =>
          /reporte|observacion|informe|bd|re|resultado/i.test(n)
        ) || workbook.SheetNames[0];

        const sheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (rows.length < 2) {
          reject(new Error('El archivo no contiene datos suficientes.'));
          return;
        }

        const headerIdx = detectHeaderRow(rows);
        if (headerIdx < 0) {
          reject(new Error('No se detectaron encabezados de evaluación. Asegúrese de que la planilla tenga columnas como "Nombre del Estudiante", "Puntaje", "Nota", etc.'));
          return;
        }

        const headers = rows[headerIdx];
        const headerMap = mapHeaders(headers);
        const meta = detectMetadata(rows, headerIdx);

        if (headerMap.studentName == null) {
          reject(new Error('No se detectó la columna "Nombre del Estudiante".'));
          return;
        }

        const students: ParentStudentReport[] = [];
        const dataRows = rows.slice(headerIdx + 1);

        for (const row of dataRows) {
          const name = cleanText(row[headerMap.studentName]);
          if (!name || name.length < 2) continue;

          const score = parseNumber(row[headerMap.score]);
          const maxScore = meta.maxScore || 24;
          const pct = headerMap.achievementPercent != null
            ? parseNumber(row[headerMap.achievementPercent])
            : maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 0;
          const grade = headerMap.grade != null ? parseNumber(row[headerMap.grade]) : Math.round((pct / 100) * 7 * 10) / 10;
          const level = cleanText(row[headerMap.achievementLevel]) || (pct >= 90 ? 'Adecuado' : pct >= 60 ? 'Elemental' : 'Insuficiente');

          const obs = headerMap.observation != null ? cleanText(row[headerMap.observation]) : '';
          const strengths = headerMap.strengths != null ? cleanText(row[headerMap.strengths]).split(/[,;]\s*/) : [];
          const needs = headerMap.needsSupport != null ? cleanText(row[headerMap.needsSupport]).split(/[,;]\s*/) : [];

          students.push({
            id: generateId(),
            studentName: name,
            score,
            maxScore,
            achievementPercent: pct,
            grade,
            achievementLevel: level,
            objectives: [],
            achievedIndicators: strengths.filter(Boolean),
            needsSupportIndicators: needs.filter(Boolean),
            strengths: strengths.filter(Boolean),
            needsSupport: needs.filter(Boolean),
            familySuggestions: [],
            aiFeedbackForParents: '',
            teacherObservation: obs,
            finalParentReport: '',
            status: 'pendiente',
          });
        }

        if (students.length === 0) {
          reject(new Error('No se encontraron estudiantes válidos en la planilla.'));
          return;
        }

        const maxPerSheet = 40;
        const sheets: ParentReportSheet[] = [];
        for (let i = 0; i < students.length; i += maxPerSheet) {
          sheets.push({
            sheetNumber: sheets.length + 1,
            students: students.slice(i, i + maxPerSheet),
          });
        }

        resolve({
          id: generateId(),
          school: meta.school || '',
          teacher: meta.teacher || '',
          course: meta.course || '',
          subject: meta.subject || '',
          evaluationName: meta.evaluationName || '',
          reportDate: meta.reportDate || new Date().toISOString().split('T')[0],
          maxScore: meta.maxScore || 24,
          maxStudentsPerSheet: maxPerSheet,
          sheets,
        });
      } catch (err: any) {
        reject(new Error(`Error al leer el archivo: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsArrayBuffer(file);
  });
}
