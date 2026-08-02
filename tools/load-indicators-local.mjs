import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';

const DB_NAME = 'planificaia-db';
const PARSED_FILE = 'tmp/indicators-parsed.json';
const COMPARISON_FILE = 'tmp/comparacion-26-existentes.json';
const BATCH_SIZE = 50;

// URL matcheada en Fase 1 resulto ser una pagina que NO es una ficha de OA
// ("Sumo Primero 3 Basico"), confirmado en el parseo (sin_texto_oa, sin indicadores).
const KNOWN_BAD_CODES = new Set(['MA03 OA 01']);

function esc(s) {
  return String(s).replace(/'/g, "''");
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function sqlList(codes) {
  return codes.map((c) => `'${esc(c)}'`).join(',');
}

function runCommand(sql, { local }) {
  const flag = local ? '--local' : '--remote';
  const cmd = `npx wrangler d1 execute ${DB_NAME} ${flag} --command "${sql.replace(/"/g, '\\"')}" --json`;
  const output = execSync(cmd, { encoding: 'utf-8', timeout: 120000, maxBuffer: 1024 * 1024 * 100 });
  const match = output.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`No se pudo parsear salida de wrangler:\n${output.slice(0, 500)}`);
  return JSON.parse(match[0]);
}

function runFile(sqlContent, { local }) {
  const flag = local ? '--local' : '--remote';
  const dir = mkdtempSync(join(tmpdir(), 'd1-batch-'));
  const file = join(dir, 'batch.sql');
  writeFileSync(file, sqlContent, 'utf-8');
  const cmd = `npx wrangler d1 execute ${DB_NAME} ${flag} --file "${file}" --json`;
  execSync(cmd, { encoding: 'utf-8', timeout: 120000, maxBuffer: 1024 * 1024 * 100 });
}

function fetchProtectedCodes() {
  console.log('Consultando codigos ya existentes en D1 REMOTO (solo lectura, para no duplicar)...');
  const parsed = runCommand('SELECT DISTINCT oa_code FROM curriculum_indicators;', { local: false });
  const rows = parsed[0]?.results ?? [];
  return new Set(rows.map((r) => r.oa_code));
}

function fetchLocalObjectiveMapping(codes) {
  const map = new Map();
  const chunks = chunk(codes, 150);
  for (let i = 0; i < chunks.length; i++) {
    const sql = `SELECT o.code, o.id AS objective_id, co.cycle, co.name AS grade, s.name AS subject FROM objectives o JOIN courses co ON co.id = o.course_id JOIN subjects s ON s.id = o.subject_id WHERE o.code IN (${sqlList(chunks[i])});`;
    const parsed = runCommand(sql, { local: true });
    for (const row of parsed[0]?.results ?? []) map.set(row.code, row);
    console.log(`  mapping objective/course/subject: lote ${i + 1}/${chunks.length}`);
  }
  return map;
}

function trackFromCycle(cycle) {
  if (cycle === 'Educación Básica') return 'basica';
  if (cycle === 'Educación Media') return 'humanista_cientifico'; // en este dataset solo aparecen 1M/2M (comun, sin diferenciar HC/TP)
  if (cycle === 'Educación Parvularia') return 'parvularia';
  return null;
}

function main() {
  const parsed = JSON.parse(readFileSync(PARSED_FILE, 'utf-8'));
  const eligible = parsed.filter((r) => r.indicatorCount > 0 && !KNOWN_BAD_CODES.has(r.code));

  const protectedCodes = fetchProtectedCodes();
  console.log(`Codigos ya existentes en curriculum_indicators (cualquier status): ${protectedCodes.size}`);

  const toImport = eligible.filter((r) => !protectedCodes.has(r.code));
  const toCompare = eligible.filter((r) => protectedCodes.has(r.code));

  console.log(`OA elegibles con indicadores: ${eligible.length}`);
  console.log(`  -> a importar (no existen todavia): ${toImport.length}`);
  console.log(`  -> excluidos por ya existir (se comparan aparte, NO se tocan): ${toCompare.length}`);
  console.log(`  -> excluidos por URL invalida conocida: ${KNOWN_BAD_CODES.size}`);

  writeFileSync(COMPARISON_FILE, JSON.stringify(toCompare, null, 2), 'utf-8');
  console.log(`Comparacion escrita en ${COMPARISON_FILE} (no se cargo nada de esto a D1)`);

  console.log('Consultando mapping objective/course/subject en D1 LOCAL...');
  const mapping = fetchLocalObjectiveMapping(toImport.map((r) => r.code));

  const rows = [];
  const importedAt = new Date().toISOString();
  const skipped = [];

  for (const rec of toImport) {
    const m = mapping.get(rec.code);
    if (!m) {
      skipped.push({ code: rec.code, reason: 'sin_mapping_en_objectives' });
      continue;
    }
    const track = trackFromCycle(m.cycle);
    if (!track) {
      skipped.push({ code: rec.code, reason: `cycle_desconocido:${m.cycle}` });
      continue;
    }
    for (const ind of rec.indicators) {
      rows.push({
        id: `mineduc-${randomUUID()}`,
        objective_id: m.objective_id,
        level: m.cycle,
        grade: m.grade,
        track,
        subject: m.subject,
        oa_code: rec.code,
        indicator_text: ind.text,
        source_url: rec.url,
        imported_at: importedAt,
      });
    }
  }

  if (skipped.length) {
    console.log(`\nOA omitidos por falta de mapping (${skipped.length}):`);
    for (const s of skipped) console.log(' -', s.code, s.reason);
  }

  console.log(`\nFilas a insertar: ${rows.length}`);

  const batches = chunk(rows, BATCH_SIZE);
  let inserted = 0;
  for (let i = 0; i < batches.length; i++) {
    const values = batches[i]
      .map(
        (r) =>
          `('${r.id}', '${esc(r.objective_id)}', '${esc(r.level)}', '${esc(r.grade)}', '${r.track}', '${esc(r.subject)}', '${esc(r.oa_code)}', '${esc(r.indicator_text)}', 'MINEDUC', '${esc(r.source_url)}', '${r.imported_at}', 'importado_oficial')`
      )
      .join(',\n');
    const sql = `INSERT INTO curriculum_indicators (id, objective_id, level, grade, track, subject, oa_code, indicator_text, source, source_url, imported_at, status) VALUES\n${values};`;
    runFile(sql, { local: true });
    inserted += batches[i].length;
    console.log(`  lote ${i + 1}/${batches.length} insertado (${inserted}/${rows.length} acumulado)`);
  }

  console.log(`\nCarga a D1 LOCAL completa: ${inserted} indicadores insertados en ${toImport.length} OA.`);
}

main();
