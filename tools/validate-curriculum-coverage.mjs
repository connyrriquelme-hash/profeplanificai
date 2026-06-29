#!/usr/bin/env node
/**
 * validate-curriculum-coverage.mjs
 *
 * Genera un reporte de cobertura de indicadores curriculares en D1.
 * Muestra: totales, por nivel, por asignatura, pendientes, duplicados.
 *
 * Uso:
 *   node tools/validate-curriculum-coverage.mjs
 *   node tools/validate-curriculum-coverage.mjs --json (salida JSON)
 *
 * Requiere: wrangler CLI autenticado, DB name = planificaia-db
 */

import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DB_NAME = 'planificaia-db';
const DB_ID = '19c4fea3-444e-4094-8c66-610704c674be';
const ACCOUNT_ID = '101de09c721aefae66ad7997e9bb9383';

function getOAuthToken() {
  try {
    const configPath = join(process.env.USERPROFILE || process.env.HOME, '.wrangler', 'config', 'default.toml');
    const config = readFileSync(configPath, 'utf-8');
    const match = config.match(/oauth_token\s*=\s*"([^"]+)"/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function queryD1REST(sql) {
  const token = getOAuthToken();
  if (!token) return [];
  try {
    const resp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
    });
    const data = await resp.json();
    if (data?.success && data?.result?.[0]?.results) {
      return data.result[0].results;
    }
    return [];
  } catch {
    return [];
  }
}

async function queryD1SingleREST(sql) {
  const results = await queryD1REST(sql);
  return results[0] || null;
}

async function main() {
  const isJson = process.argv.includes('--json');

  const lines = [];
  const log = (msg) => { if (!isJson) console.log(msg); lines.push(msg); };

  log('');
  log('═══════════════════════════════════════════════════');
  log('  REPORTE DE COBERTURA — Indicadores Curriculares');
  log('═══════════════════════════════════════════════════');
  log('');

  // 1. Total indicators
  const totalRow = await queryD1SingleREST("SELECT COUNT(*) as total FROM curriculum_indicators");
  const total = totalRow?.total || 0;
  log(`  Indicadores totales:        ${total}`);

  if (total === 0) {
    log('\n  No hay indicadores en D1. Ejecuta la importación primero.\n');
    if (isJson) {
      console.log(JSON.stringify({ total: 0, by_level: {}, by_subject: {}, by_status: {} }));
    }
    return;
  }

  // 2. By status
  const statusRows = await queryD1REST("SELECT status, COUNT(*) as count FROM curriculum_indicators GROUP BY status ORDER BY count DESC");
  log('');
  log('  Por estado:');
  for (const row of statusRows) {
    log(`    ${row.status}: ${row.count}`);
  }

  // 3. By level
  const levelRows = await queryD1REST("SELECT level, COUNT(*) as count FROM curriculum_indicators GROUP BY level ORDER BY count DESC");
  log('');
  log('  Por nivel:');
  for (const row of levelRows) {
    log(`    ${row.level}: ${row.count}`);
  }

  // 4. By subject
  const subjectRows = await queryD1REST("SELECT subject, COUNT(*) as count FROM curriculum_indicators GROUP BY subject ORDER BY count DESC");
  log('');
  log('  Por asignatura:');
  for (const row of subjectRows) {
    log(`    ${row.subject}: ${row.count}`);
  }

  // 5. By track
  const trackRows = await queryD1REST("SELECT track, COUNT(*) as count FROM curriculum_indicators GROUP BY track ORDER BY count DESC");
  log('');
  log('  Por track:');
  for (const row of trackRows) {
    log(`    ${row.track}: ${row.count}`);
  }

  // 6. Missing OA (no objective_id linked)
  const missingOARow = await queryD1SingleREST("SELECT COUNT(*) as count FROM curriculum_indicators WHERE objective_id IS NULL OR objective_id = ''");
  log('');
  log(`  Sin OA asociado:            ${missingOARow?.count || 0}`);

  // 7. Missing skill
  const missingSkillRow = await queryD1SingleREST("SELECT COUNT(*) as count FROM curriculum_indicators WHERE skill_id IS NULL OR skill_id = ''");
  log(`  Sin habilidad asociada:     ${missingSkillRow?.count || 0}`);

  // 8. Pending revision
  const pendingRow = await queryD1SingleREST("SELECT COUNT(*) as count FROM curriculum_indicators WHERE status = 'pendiente_revision'");
  log(`  Pendientes de revisión:     ${pendingRow?.count || 0}`);

  // 9. Validated
  const validatedRow = await queryD1SingleREST("SELECT COUNT(*) as count FROM curriculum_indicators WHERE status = 'validado'");
  log(`  Validados:                  ${validatedRow?.count || 0}`);

  // 10. Duplicates check (same oa_code + indicator_text)
  const dupRows = await queryD1REST("SELECT oa_code, indicator_text, COUNT(*) as count FROM curriculum_indicators GROUP BY oa_code, indicator_text HAVING count > 1");
  log('');
  log(`  Duplicados exactos:         ${dupRows.length}`);

  // 11. Coverage by level + subject
  log('');
  log('  Cobertura por nivel + asignatura:');
  const coverageRows = await queryD1REST(`
    SELECT level, subject, 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'validado' THEN 1 ELSE 0 END) as validados,
      SUM(CASE WHEN status = 'pendiente_revision' THEN 1 ELSE 0 END) as pendientes
    FROM curriculum_indicators 
    GROUP BY level, subject 
    ORDER BY level, subject
  `);
  for (const row of coverageRows) {
    log(`    ${row.level} / ${row.subject}: ${row.total} total (${row.validados} validados, ${row.pendientes} pendientes)`);
  }

  // 12. Import batches
  const batchRows = await queryD1REST(`
    SELECT filename, track, indicators_read, indicators_imported, 
           duplicates_skipped, missing_oa, missing_skill, pending_revision, status, created_at
    FROM curriculum_import_batches 
    ORDER BY created_at DESC 
    LIMIT 10
  `);
  if (batchRows.length > 0) {
    log('');
    log('  Lotes de importación recientes:');
    for (const row of batchRows) {
      log(`    ${row.filename} (${row.track}): ${row.indicators_imported} importados, ${row.missing_oa} sin OA, ${row.missing_skill} sin habilidad — ${row.status}`);
    }
  }

  log('');
  log('═══════════════════════════════════════════════════');

  if (isJson) {
    const byLevel = {};
    for (const r of levelRows) byLevel[r.level] = r.count;
    const bySubject = {};
    for (const r of subjectRows) bySubject[r.subject] = r.count;
    const byTrack = {};
    for (const r of trackRows) byTrack[r.track] = r.count;
    const byStatus = {};
    for (const r of statusRows) byStatus[r.status] = r.count;

    console.log(JSON.stringify({
      total,
      by_level: byLevel,
      by_subject: bySubject,
      by_track: byTrack,
      by_status: byStatus,
      missing_oa: missingOARow?.count || 0,
      missing_skill: missingSkillRow?.count || 0,
      pending_revision: pendingRow?.count || 0,
      validated: validatedRow?.count || 0,
      duplicates: dupRows.length,
    }, null, 2));
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
