// Audit de cobertura curricular — PlanificaIA Chile
// Uso: node scripts/curriculum/audit-curricular-coverage.mjs
//
// Requiere wrangler CLI autenticado con el proyecto remoto.
//
// Ejecutar desde la raíz del proyecto:
//   node scripts/curriculum/audit-curricular-coverage.mjs

import { execSync } from 'child_process';

function run(sql) {
  try {
    const out = execSync(
      `npx wrangler d1 execute planificaia-db --remote --command "${sql.replace(/"/g, '\\"')}"`,
      { encoding: 'utf8', timeout: 30000 }
    );
    return out;
  } catch (e) {
    console.error('Error ejecutando consulta:', e.message);
    return null;
  }
}

function parseTable(raw) {
  if (!raw) return [];
  const lines = raw.split('\n').filter(l => l.trim() && !l.startsWith('┼') && !l.startsWith('╪') && !l.startsWith('═') && !l.startsWith('║') && !l.includes('rows'));
  const data = [];
  let started = false;
  for (const line of lines) {
    if (line.includes('┌') || line.includes('╔') || line.includes('│')) continue;
    if (line.includes('├') || line.includes('╟')) { started = true; continue; }
    if (line.includes('└') || line.includes('╚') || line.includes('┴') || line.includes('╧')) break;
    if (!started || !line.trim()) continue;
    const cols = line.split('│').map(c => c.trim()).filter(Boolean);
    if (cols.length > 1) data.push(cols);
  }
  return data;
}

console.log('');
console.log('=== AUDIT DE COBERTURA CURRICULAR — PlanificaIA Chile ===');
console.log('');

console.log('--- Totales generales ---');
const totalOA = run("SELECT COUNT(*) as total FROM objectives WHERE type='OA';");
console.log(totalOA || 'No se pudo obtener.');

console.log('');
console.log('--- OA con y sin indicadores ---');
const coverage = run(`
  SELECT
    COUNT(*) AS total_oa,
    SUM(CASE WHEN i.cnt > 0 THEN 1 ELSE 0 END) AS con_indicadores,
    SUM(CASE WHEN i.cnt = 0 THEN 1 ELSE 0 END) AS sin_indicadores
  FROM (
    SELECT o.id, COUNT(oi.id) AS cnt
    FROM objectives o
    LEFT JOIN objective_indicators oi ON oi.objective_id = o.id
    WHERE o.type='OA'
    GROUP BY o.id
  ) i;
`);
console.log(coverage || 'No se pudo obtener.');

console.log('');
console.log('--- OA sin indicadores (primeros 30) ---');
const sinInd = run(`
  SELECT o.code, o.official_text AS texto, c.name AS curso, s.name AS asignatura
  FROM objectives o
  JOIN courses c ON c.id=o.course_id
  JOIN subjects s ON s.id=o.subject_id
  WHERE o.type='OA' AND o.id NOT IN (SELECT DISTINCT objective_id FROM objective_indicators)
  ORDER BY c.sort_order, s.name, o.code
  LIMIT 30;
`);
console.log(sinInd || 'No se pudo obtener.');

console.log('');
console.log('--- Cobertura por curso y asignatura ---');
const porCurso = run(`
  SELECT c.name AS curso, s.name AS asignatura,
         COUNT(o.id) AS total_oa,
         SUM(CASE WHEN oi.cnt > 0 THEN 1 ELSE 0 END) AS con_inds,
         ROUND(100.0 * SUM(CASE WHEN oi.cnt > 0 THEN 1 ELSE 0 END) / COUNT(o.id), 1) AS cobertura_pct
  FROM (
    SELECT o.id, o.course_id, o.subject_id, COUNT(oi.id) AS cnt
    FROM objectives o
    LEFT JOIN objective_indicators oi ON oi.objective_id = o.id
    WHERE o.type='OA'
    GROUP BY o.id
  ) oi
  JOIN courses c ON c.id=oi.course_id
  JOIN subjects s ON s.id=oi.subject_id
  GROUP BY c.name, s.name
  ORDER BY cobertura_pct ASC, c.sort_order, s.name;
`);
console.log(porCurso || 'No se pudo obtener.');

console.log('');
console.log('--- Cantidad de indicadores por OA (top 20 con más) ---');
const masInd = run(`
  SELECT o.code, c.name AS curso, s.name AS asignatura, COUNT(oi.id) AS n_indicadores
  FROM objectives o
  JOIN courses c ON c.id=o.course_id
  JOIN subjects s ON s.id=o.subject_id
  JOIN objective_indicators oi ON oi.objective_id = o.id
  WHERE o.type='OA'
  GROUP BY o.id
  ORDER BY n_indicadores DESC
  LIMIT 20;
`);
console.log(masInd || 'No se pudo obtener.');

console.log('');
console.log('--- Resumen ---');
console.log('Para generar indicadores de OA sin cobertura:');
console.log('  Ir a Evaluaciones > seleccionar OA > boton "Generar indicadores sugeridos"');
console.log('  O llamar POST /api/curriculum/generate-indicators con { objectiveCode, objectiveText, course, subject }');
console.log('');
console.log('Para verificar cobertura por endpoint:');
console.log('  GET /api/curriculum/diagnostics');
console.log('');
