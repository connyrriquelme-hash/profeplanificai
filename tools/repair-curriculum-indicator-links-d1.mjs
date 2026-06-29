#!/usr/bin/env node
/**
 * repair-curriculum-indicator-links-d1.mjs
 *
 * Repara los objective_id y skill_id en curriculum_indicators
 * que fueron importados con oa_code strings o descripciones
 * en vez de IDs reales de las tablas objectives y skills.
 *
 * Modos:
 *   --dry-run (default): solo analiza, no modifica
 *   --apply: ejecuta los UPDATEs
 *
 * Uso:
 *   node tools/repair-curriculum-indicator-links-d1.mjs
 *   node tools/repair-curriculum-indicator-links-d1.mjs --apply
 *
 * Requiere: wrangler CLI autenticado, DB name = planificaia-db
 */

import { writeFileSync, unlinkSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DB_NAME = 'planificaia-db';
const DB_ID = '19c4fea3-444e-4094-8c66-610704c674be';
const ACCOUNT_ID = '101de09c721aefae66ad7997e9bb9383';

let tempCounter = 0;

// ─── D1 Helpers ──────────────────────────────────────────

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

async function queryD1(sql) {
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

async function execWrangler(sql) {
  const tmpFile = join(PROJECT_ROOT, `.tmp-sql-${++tempCounter}.sql`);
  try {
    writeFileSync(tmpFile, sql, 'utf-8');
    const cmd = `npx wrangler d1 execute ${DB_NAME} --remote --file "${tmpFile}"`;
    const output = execSync(cmd, { encoding: 'utf-8', cwd: PROJECT_ROOT, timeout: 60000 });
    const match = output.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { success: parsed[0].success, rows_written: parsed[0].meta?.rows_written ?? 0 };
      }
    }
    return { success: false, rows_written: 0 };
  } catch {
    return { success: false, rows_written: 0 };
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  const isApply = process.argv.includes('--apply');

  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`  Reparador de Links en curriculum_indicators`);
  console.log(`  Modo: ${isApply ? 'APLICAR CAMBIOS' : 'DRY RUN (solo análisis)'}`);
  console.log(`═══════════════════════════════════════════════════\n`);

  // 1. Load all indicators
  console.log('1. Cargando indicadores desde D1...');
  const indicators = await queryD1("SELECT id, objective_id, skill_id, level, grade, track, subject, oa_code, indicator_text, status FROM curriculum_indicators");
  console.log(`   Total indicadores: ${indicators.length}`);

  // 2. Load all objectives (id, code)
  console.log('\n2. Cargando objectives desde D1...');
  const objectives = await queryD1("SELECT id, code, official_text, course_id, subject_id FROM objectives");
  console.log(`   Total objectives: ${objectives.length}`);

  // Build lookup: code → {id, official_text, course_id, subject_id}
  const objByCode = new Map();
  for (const obj of objectives) {
    if (!objByCode.has(obj.code)) {
      objByCode.set(obj.code, []);
    }
    objByCode.get(obj.code).push(obj);
  }

  // 3. Load all skills (id, code, official_text)
  console.log('\n3. Cargando skills desde D1...');
  const skills = await queryD1("SELECT id, code, official_text, subject_id FROM skills");
  console.log(`   Total skills: ${skills.length}`);

  // Build lookup: code → {id, official_text, subject_id}
  const skillByCode = new Map();
  for (const sk of skills) {
    if (!skillByCode.has(sk.code)) {
      skillByCode.set(sk.code, []);
    }
    skillByCode.get(sk.code).push(sk);
  }

  // 4. Analyze each indicator
  console.log('\n4. Analizando indicadores...\n');

  let totalReviewed = 0;
  let objRepaired = 0;
  let objSkippedAmbiguous = 0;
  let objSkippedNotFound = 0;
  let objAlreadyValid = 0;
  let skillRepaired = 0;
  let skillSkippedAmbiguous = 0;
  let skillSkippedNotFound = 0;
  let skillAlreadyValid = 0;
  let validated = 0;
  let pending = 0;

  const updates = [];

  for (const ind of indicators) {
    totalReviewed++;

    // --- objective_id repair ---
    let newObjectiveId = null;
    let objAction = 'none'; // none, repaired, ambiguous, not_found, already_valid

    // Check if current objective_id is valid
    const currentObjIsValid = ind.objective_id && objectives.some(o => o.id === ind.objective_id);

    if (currentObjIsValid) {
      newObjectiveId = ind.objective_id;
      objAction = 'already_valid';
      objAlreadyValid++;
    } else {
      // Try to find objective by oa_code
      const candidates = objByCode.get(ind.oa_code) || [];

      if (candidates.length === 1) {
        newObjectiveId = candidates[0].id;
        objAction = 'repaired';
        objRepaired++;
      } else if (candidates.length > 1) {
        objAction = 'ambiguous';
        objSkippedAmbiguous++;
      } else {
        objAction = 'not_found';
        objSkippedNotFound++;
      }
    }

    // --- skill_id repair ---
    let newSkillId = null;
    let skillAction = 'none';

    const currentSkillIsValid = ind.skill_id && skills.some(s => s.id === ind.skill_id);

    if (currentSkillIsValid) {
      newSkillId = ind.skill_id;
      skillAction = 'already_valid';
      skillAlreadyValid++;
    } else if (ind.skill_id && !currentSkillIsValid) {
      // Current skill_id exists but is invalid (probably a description string)
      // Try to find by code match
      const skillCandidates = skillByCode.get(ind.skill_id) || [];
      if (skillCandidates.length === 1) {
        newSkillId = skillCandidates[0].id;
        skillAction = 'repaired';
        skillRepaired++;
      } else if (skillCandidates.length > 1) {
        skillAction = 'ambiguous';
        skillSkippedAmbiguous++;
      } else {
        skillAction = 'not_found';
        skillSkippedNotFound++;
      }
    } else {
      // skill_id is NULL
      skillAction = 'not_found';
      skillSkippedNotFound++;
    }

    // Determine new status
    let newStatus = ind.status;
    if (objAction === 'repaired' && skillAction !== 'ambiguous') {
      newStatus = 'pendiente_revision'; // Will be validated if both are set
      if (newObjectiveId && newSkillId) {
        newStatus = 'validado';
        validated++;
      }
    } else if (objAction === 'not_found' || objAction === 'ambiguous') {
      newStatus = 'pendiente_revision';
      pending++;
    }

    // Build update if anything changed
    const needsObjUpdate = objAction === 'repaired' && newObjectiveId !== ind.objective_id;
    const needsSkillUpdate = skillAction === 'repaired';
    const needsStatusUpdate = newStatus !== ind.status;

    if (needsObjUpdate || needsSkillUpdate || needsStatusUpdate) {
      const setClauses = [];
      if (needsObjUpdate) {
        setClauses.push(`objective_id = ${escapeSql(newObjectiveId)}`);
      }
      if (needsSkillUpdate) {
        setClauses.push(`skill_id = ${escapeSql(newSkillId)}`);
      }
      if (needsStatusUpdate) {
        setClauses.push(`status = ${escapeSql(newStatus)}`);
      }
      setClauses.push(`updated_at = datetime('now')`);

      updates.push({
        id: ind.id,
        oa_code: ind.oa_code,
        objAction,
        skillAction,
        newObjectiveId,
        newSkillId,
        newStatus,
        sql: `UPDATE curriculum_indicators SET ${setClauses.join(', ')} WHERE id = ${escapeSql(ind.id)}`,
      });
    }

    // Log details
    const objMsg = objAction === 'repaired' ? `REPARADO → ${newObjectiveId}` :
                   objAction === 'already_valid' ? 'VÁLIDO' :
                   objAction === 'ambiguous' ? 'AMBIGUO (múltiples candidatos)' :
                   'NO ENCONTRADO';
    const skillMsg = skillAction === 'repaired' ? `REPARADO → ${newSkillId}` :
                     skillAction === 'already_valid' ? 'VÁLIDO' :
                     skillAction === 'ambiguous' ? 'AMBIGUO' :
                     'SIN SKILL';

    if (objAction !== 'already_valid' || skillAction !== 'already_valid') {
      console.log(`  [${ind.id}] ${ind.oa_code}`);
      console.log(`    objective_id: ${objMsg}`);
      console.log(`    skill_id:     ${skillMsg}`);
      console.log(`    status:       ${ind.status} → ${newStatus}`);
    }
  }

  // 5. Summary
  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`  RESUMEN DE ANÁLISIS`);
  console.log(`═══════════════════════════════════════════════════`);
  console.log(`  Indicadores revisados:         ${totalReviewed}`);
  console.log(`  objective_id válidos:          ${objAlreadyValid}`);
  console.log(`  objective_id reparados:        ${objRepaired}`);
  console.log(`  objective_id ambiguos:         ${objSkippedAmbiguous}`);
  console.log(`  objective_id no encontrados:   ${objSkippedNotFound}`);
  console.log(`  skill_id válidos:              ${skillAlreadyValid}`);
  console.log(`  skill_id reparados:            ${skillRepaired}`);
  console.log(`  skill_id ambiguos:             ${skillSkippedAmbiguous}`);
  console.log(`  skill_id no encontrados:       ${skillSkippedNotFound}`);
  console.log(`  Updates a ejecutar:            ${updates.length}`);
  console.log(`  Status → validado:             ${validated}`);
  console.log(`  Status → pendiente_revision:   ${pending}`);
  console.log(`═══════════════════════════════════════════════════\n`);

  if (updates.length === 0) {
    console.log('  No hay cambios que aplicar.\n');
    return;
  }

  // 6. Apply updates
  if (!isApply) {
    console.log('  MODO DRY RUN — No se ejecutaron cambios.');
    console.log(`  Para aplicar: node tools/repair-curriculum-indicator-links-d1.mjs --apply\n`);
    return;
  }

  console.log(`5. Ejecutando ${updates.length} UPDATEs en D1...`);

  // Build batch SQL
  const batchSql = updates.map(u => u.sql).join(';\n') + ';\n';
  const result = await execWrangler(batchSql);
  if (result.success) {
    console.log(`  Batch UPDATE ejecutado exitosamente.`);
    console.log(`  Filas escritas: ${result.rows_written}`);
  } else {
    console.error(`  ERROR: Batch UPDATE falló.`);
  }

  // 7. Verify post-apply
  console.log('\n6. Verificando post-apply...');
  const countAfter = await queryD1("SELECT COUNT(*) as total FROM curriculum_indicators");
  console.log(`   Indicadores totales: ${countAfter[0]?.total ?? 'N/A'}`);

  const validCount = await queryD1("SELECT COUNT(*) as total FROM curriculum_indicators WHERE status = 'validado'");
  console.log(`   Validados: ${validCount[0]?.total ?? 'N/A'}`);

  const pendingCount = await queryD1("SELECT COUNT(*) as total FROM curriculum_indicators WHERE status = 'pendiente_revision'");
  console.log(`   Pendientes: ${pendingCount[0]?.total ?? 'N/A'}`);

  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`  REPARACIÓN COMPLETADA`);
  console.log(`═══════════════════════════════════════════════════\n`);
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
