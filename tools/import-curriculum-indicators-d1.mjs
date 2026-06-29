#!/usr/bin/env node
/**
 * import-curriculum-indicators-d1.mjs
 *
 * Importa indicadores curriculares desde archivos JSON a Cloudflare D1.
 * Verifica inserción real con SELECT COUNT post-batch.
 *
 * Uso:
 *   node tools/import-curriculum-indicators-d1.mjs --file <path.json>
 *   node tools/import-curriculum-indicators-d1.mjs --all
 *   node tools/import-curriculum-indicators-d1.mjs --dry-run --file <path.json>
 *
 * Requiere: wrangler CLI autenticado, DB name = planificaia-db
 */

import { readFileSync, readdirSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DB_NAME = 'planificaia-db';
const CURRICULUM_DIR = join(PROJECT_ROOT, 'data', 'curriculum', 'chile');

const REQUIRED_FIELDS = ['level', 'grade', 'track', 'subject', 'oa_code', 'indicator_text'];
const VALID_TRACKS = ['parvularia', 'basica', 'humanista_cientifico', 'tecnico_profesional'];
const VALID_EVAL_TYPES = ['formativa', 'sumativa', 'diagnostica', 'autoevaluacion', 'coevaluacion'];
const VALID_EVIDENCE = ['oral', 'escrita', 'practica', 'proyecto', 'desempeno', 'portfolio', 'observacion', 'rúbrica'];

// ─── Helpers ───────────────────────────────────────────────

let tempCounter = 0;

function execWrangler(sql) {
  const tmpFile = join(PROJECT_ROOT, `.tmp-sql-${++tempCounter}.sql`);
  try {
    writeFileSync(tmpFile, sql, 'utf-8');
    const cmd = `npx wrangler d1 execute ${DB_NAME} --remote --file "${tmpFile}"`;
    const output = execSync(cmd, { encoding: 'utf-8', cwd: PROJECT_ROOT, timeout: 60000 });
    // Parse wrangler JSON output
    const match = output.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];
        return {
          success: first.success === true,
          rows_written: first.meta?.rows_written ?? 0,
          rows_read: first.meta?.rows_read ?? 0,
          changes: first.meta?.changes ?? 0,
          raw: output,
        };
      }
    }
    return { success: false, rows_written: 0, rows_read: 0, changes: 0, raw: output };
  } catch (err) {
    return { success: false, rows_written: 0, rows_read: 0, changes: 0, raw: err.message };
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

function queryD1Count(sql) {
  // --file does NOT return SELECT result data, only summary metadata.
  // --command DOES return result data but requires shell-safe quoting.
  // Strategy: use --command, escape single quotes for the shell.
  const escaped = sql.replace(/'/g, "''");
  const cmd = `npx wrangler d1 execute ${DB_NAME} --remote --command "${escaped}"`;
  try {
    const output = execSync(cmd, { encoding: 'utf-8', cwd: PROJECT_ROOT, timeout: 30000 });
    // Parse JSON array from wrangler --command output
    const match = output.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.results) {
        return parsed[0].results;
      }
    }
    return [];
  } catch {
    return [];
  }
}

function generateId(prefix) {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${ts}-${rand}`;
}

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

// ─── Validation ────────────────────────────────────────────

function validateIndicator(ind, index) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (!ind[field] || String(ind[field]).trim() === '') {
      errors.push(`Campo requerido faltante: "${field}"`);
    }
  }
  if (ind.track && !VALID_TRACKS.includes(ind.track)) {
    errors.push(`Track inválido: "${ind.track}". Válidos: ${VALID_TRACKS.join(', ')}`);
  }
  if (ind.evaluation_type && !VALID_EVAL_TYPES.includes(ind.evaluation_type)) {
    errors.push(`evaluation_type inválido: "${ind.evaluation_type}"`);
  }
  if (ind.evidence_type && !VALID_EVIDENCE.includes(ind.evidence_type)) {
    errors.push(`evidence_type inválido: "${ind.evidence_type}"`);
  }
  return errors;
}

// ─── Main ──────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isAll = args.includes('--all');
  const fileIdx = args.indexOf('--file');
  const filePath = fileIdx >= 0 ? args[fileIdx + 1] : null;

  if (!isAll && !filePath) {
    console.error('Uso:');
    console.error('  node tools/import-curriculum-indicators-d1.mjs --file <path.json>');
    console.error('  node tools/import-curriculum-indicators-d1.mjs --all');
    console.error('  node tools/import-curriculum-indicators-d1.mjs --dry-run --file <path.json>');
    process.exit(1);
  }

  let files = [];
  if (isAll) {
    const subdirs = readdirSync(CURRICULUM_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    for (const sub of subdirs) {
      const dirPath = join(CURRICULUM_DIR, sub);
      const jsonFiles = readdirSync(dirPath).filter(f => f.endsWith('.json'));
      for (const f of jsonFiles) {
        files.push(join(dirPath, f));
      }
    }
  } else {
    files = [filePath.startsWith('/') || filePath.startsWith('C:') ? filePath : join(PROJECT_ROOT, filePath)];
  }

  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`  Importador de Indicadores Curriculares a D1`);
  console.log(`  Modo: ${isDryRun ? 'DRY RUN (solo validación)' : 'IMPORTACIÓN'}`);
  console.log(`  Archivos: ${files.length}`);
  console.log(`═══════════════════════════════════════════════════\n`);

  // 1. Count indicators BEFORE import
  console.log('1. Estado de D1 ANTES de importar:');
  const countBeforeResults = queryD1Count("SELECT COUNT(*) as total FROM curriculum_indicators");
  const countBefore = countBeforeResults[0]?.total ?? 0;
  console.log(`   Indicadores en D1: ${countBefore}`);

  // 2. Build OA lookup map (code → id) from D1
  console.log('\n2. Consultando OA existentes en D1...');
  const existingOAs = queryD1Count("SELECT id, code FROM objectives");
  const oaCodes = new Set(existingOAs.map(r => r.code));
  const oaIdMap = new Map(existingOAs.map(r => [r.code, r.id]));
  console.log(`   OA existentes: ${oaCodes.size}`);

  // 3. Build skills lookup map (code → id) from D1
  const existingSkills = queryD1Count("SELECT id, code FROM skills");
  const skillCodes = new Set(existingSkills.map(r => r.code));
  const skillIdMap = new Map(existingSkills.map(r => [r.code, r.id]));
  console.log(`   Habilidades existentes: ${skillCodes.size}`);

  // 4. Check existing indicators to avoid duplicates
  const existingIndicators = queryD1Count("SELECT oa_code, indicator_text FROM curriculum_indicators");
  const existingSet = new Set(existingIndicators.map(r => `${r.oa_code}|||${r.indicator_text}`));
  console.log(`   Indicadores existentes: ${existingSet.size}\n`);

  // 5. Build INSERT statements
  console.log('3. Construyendo statements INSERT...');
  let totalRead = 0;
  let totalToInsert = 0;
  let totalDuplicates = 0;
  let totalMissingOA = 0;
  let totalMissingSkill = 0;
  let totalPending = 0;
  let totalErrors = 0;

  const insertStatements = [];

  for (const file of files) {
    console.log(`─── Procesando: ${file.replace(PROJECT_ROOT, '.')} ───`);

    let data;
    try {
      const raw = readFileSync(file, 'utf-8');
      data = JSON.parse(raw);
    } catch (err) {
      console.error(`  ERROR: No se pudo leer/parsear: ${err.message}`);
      totalErrors++;
      continue;
    }

    if (!Array.isArray(data)) {
      console.error(`  ERROR: El archivo no contiene un array`);
      totalErrors++;
      continue;
    }

    for (let i = 0; i < data.length; i++) {
      const ind = data[i];
      totalRead++;

      const errors = validateIndicator(ind, i);
      if (errors.length > 0) {
        console.error(`  [${i + 1}] ERRORES: ${errors.join('; ')}`);
        totalErrors++;
        continue;
      }

      const dupKey = `${ind.oa_code}|||${ind.indicator_text}`;
      if (existingSet.has(dupKey)) {
        totalDuplicates++;
        continue;
      }

      const hasOA = oaCodes.has(ind.oa_code);
      const hasSkill = ind.skill ? skillCodes.has(ind.skill) : false;

      let status = ind.status || 'pendiente_revision';
      if (!hasOA) {
        status = 'pendiente_revision';
        totalMissingOA++;
      }
      if (ind.skill && !hasSkill) {
        totalMissingSkill++;
      }

      if (!isDryRun) {
        const id = generateId('ci');
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        // Lookup actual objective_id and skill_id from D1 tables
        const realObjId = hasOA ? oaIdMap.get(ind.oa_code) : null;
        const realSkillId = hasSkill ? skillIdMap.get(ind.skill) : null;
        const objIdSql = realObjId ? escapeSql(realObjId) : 'NULL';
        const skillIdSql = realSkillId ? escapeSql(realSkillId) : 'NULL';
        const sql = `INSERT OR IGNORE INTO curriculum_indicators (id, objective_id, skill_id, level, grade, track, subject, oa_code, indicator_text, observable_action, evaluation_type, evidence_type, difficulty_level, source, status, created_at, updated_at) VALUES (${escapeSql(id)}, ${objIdSql}, ${skillIdSql}, ${escapeSql(ind.level)}, ${escapeSql(ind.grade)}, ${escapeSql(ind.track)}, ${escapeSql(ind.subject)}, ${escapeSql(ind.oa_code)}, ${escapeSql(ind.indicator_text)}, ${escapeSql(ind.observable_action || null)}, ${escapeSql(ind.evaluation_type || 'formativa')}, ${escapeSql(ind.evidence_type || null)}, ${escapeSql(ind.difficulty_level || null)}, ${escapeSql(ind.source || 'MINEDUC')}, ${escapeSql(status)}, '${now}', '${now}')`;
        insertStatements.push(sql);
      }

      totalToInsert++;
      existingSet.add(dupKey);

      if (status === 'pendiente_revision') {
        totalPending++;
      }
    }
  }

  console.log(`\n   Statements generados: ${insertStatements.length}`);
  console.log(`   Duplicados omitidos: ${totalDuplicates}`);
  console.log(`   Errores de validación: ${totalErrors}`);

  if (isDryRun) {
    console.log(`\n═══════════════════════════════════════════════════`);
    console.log(`  DRY RUN — No se insertaron datos`);
    console.log(`═══════════════════════════════════════════════════\n`);
    return;
  }

  if (insertStatements.length === 0) {
    console.log('\n   No hay statements para insertar.');
    return;
  }

  // 6. Execute batch INSERT
  console.log(`\n4. Ejecutando ${insertStatements.length} INSERT en D1...`);
  const batchSql = insertStatements.join(';\n') + ';\n';
  const batchResult = execWrangler(batchSql);

  console.log(`   Éxito wrangler: ${batchResult.success ? 'SÍ' : 'NO'}`);
  console.log(`   Filas escritas (wrangler): ${batchResult.rows_written}`);
  console.log(`   Cambios reportados: ${batchResult.changes}`);

  if (!batchResult.success) {
    console.error(`\n   ERROR: El batch INSERT falló.`);
    console.error(`   Output: ${batchResult.raw.substring(0, 200)}`);
    console.log(`\n═══════════════════════════════════════════════════`);
    console.log(`  RESUMEN: IMPORTACIÓN FALLIDA`);
    console.log(`═══════════════════════════════════════════════════\n`);
    process.exit(1);
  }

  // 7. VERIFY: Count indicators AFTER import
  console.log(`\n5. Verificando inserción en D1...`);
  const countAfterResults = queryD1Count("SELECT COUNT(*) as total FROM curriculum_indicators");
  const countAfter = countAfterResults[0]?.total ?? 0;
  const rowsActuallyInserted = countAfter - countBefore;

  console.log(`   Indicadores en D1 ANTES: ${countBefore}`);
  console.log(`   Indicadores en D1 DESPUÉS: ${countAfter}`);
  console.log(`   Filas realmente insertadas: ${rowsActuallyInserted}`);
  console.log(`   Statements generados: ${insertStatements.length}`);

  // 8. Save batch metadata
  const batchId = generateId('batch');
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const track = files.length > 0 ? 'mixed' : 'unknown';
  const metaSql = `INSERT INTO curriculum_import_batches (id, filename, track, indicators_read, indicators_imported, duplicates_skipped, missing_oa, missing_skill, pending_revision, status, created_at) VALUES (${escapeSql(batchId)}, ${escapeSql(files.join(','))}, ${escapeSql(track)}, ${totalRead}, ${rowsActuallyInserted}, ${totalDuplicates}, ${totalMissingOA}, ${totalMissingSkill}, ${totalPending}, 'completed', '${now}')`;
  execWrangler(metaSql);

  // 9. Final summary
  const success = rowsActuallyInserted > 0;
  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`  RESUMEN DE IMPORTACIÓN`);
  console.log(`═══════════════════════════════════════════════════`);
  console.log(`  Indicadores leídos:          ${totalRead}`);
  console.log(`  Statements generados:        ${insertStatements.length}`);
  console.log(`  Filas realmente insertadas:  ${rowsActuallyInserted}`);
  console.log(`  Duplicados omitidos:         ${totalDuplicates}`);
  console.log(`  Sin OA en D1:                ${totalMissingOA}`);
  console.log(`  Sin habilidad en D1:         ${totalMissingSkill}`);
  console.log(`  Pendientes de revisión:      ${totalPending}`);
  console.log(`  Errores de validación:       ${totalErrors}`);
  console.log(`  Total en D1 post-import:     ${countAfter}`);
  console.log(`  Estado:                      ${success ? 'IMPORTACIÓN EXITOSA' : 'IMPORTACIÓN FALLIDA — No se insertaron filas'}`);
  console.log(`═══════════════════════════════════════════════════\n`);

  if (!success) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
