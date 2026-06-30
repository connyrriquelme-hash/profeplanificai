#!/usr/bin/env node
/**
 * link-objective-skills-d1.mjs
 * Vincula skills con objetivos en objective_skills basándose en subject_id.
 * NO borra vínculos existentes. NO inventa habilidades.
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
  } catch { return null; }
}

async function query(sql) {
  const token = getOAuthToken();
  if (!token) { console.error('No OAuth token'); return []; }
  try {
    const resp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
    });
    const data = await resp.json();
    if (data?.success && data?.result?.[0]?.results) return data.result[0].results;
    return [];
  } catch { return []; }
}

function execBatch(sql) {
  const tmpFile = join(PROJECT_ROOT, `.tmp-link-${Date.now()}.sql`);
  try {
    writeFileSync(tmpFile, sql, 'utf-8');
    const output = execSync(`npx wrangler d1 execute ${DB_NAME} --remote --file "${tmpFile}"`, { encoding: 'utf-8', cwd: PROJECT_ROOT, timeout: 60000 });
    try { unlinkSync(tmpFile); } catch {}
    return output.includes('success');
  } catch { try { unlinkSync(tmpFile); } catch {} return false; }
}

async function main() {
  const isApply = process.argv.includes('--apply');

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  VINCULAR OBJECTIVE_SKILLS');
  console.log(`  Modo: ${isApply ? 'APLICAR' : 'DRY RUN'}`);
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Load existing links
  const existingLinks = await query('SELECT objective_id, skill_id FROM objective_skills');
  const existingSet = new Set(existingLinks.map(r => `${r.objective_id}|||${r.skill_id}`));
  console.log(`Vínculos existentes: ${existingSet.size}`);

  // 2. Load skills grouped by subject_id
  const skills = await query('SELECT id, subject_id, code, official_text FROM skills');
  const skillsBySubject = new Map();
  for (const sk of skills) {
    if (!skillsBySubject.has(sk.subject_id)) skillsBySubject.set(sk.subject_id, []);
    skillsBySubject.get(sk.subject_id).push(sk);
  }
  console.log(`Skills cargadas: ${skills.length} en ${skillsBySubject.size} asignaturas`);

  // 3. Load objectives grouped by subject_id
  const objectives = await query('SELECT id, subject_id, code, official_text FROM objectives');
  const objsBySubject = new Map();
  for (const obj of objectives) {
    if (!objsBySubject.has(obj.subject_id)) objsBySubject.set(obj.subject_id, []);
    objsBySubject.get(obj.subject_id).push(obj);
  }
  console.log(`Objetivos cargados: ${objectives.length}\n`);

  // 4. Create links: one skill per objective matching by subject_id and code prefix
  const insertStatements = [];
  let totalCreated = 0;
  const perSubject = {};

  for (const [subjectId, objs] of objsBySubject) {
    const subjectSkills = skillsBySubject.get(subjectId) || [];
    if (subjectSkills.length === 0) continue;

    let created = 0;

    // Strategy: link skills to objectives when they share the same subject_id
    // Use skill code prefix to match objective code prefix
    // e.g., skill "CN02 OAH A" → objective "CN02 OA 01"
    for (const obj of objs) {
      const objPrefix = obj.code.split(' ')[0]; // e.g., "CN02", "LE01"
      const matchingSkills = subjectSkills.filter(sk => {
        const skPrefix = sk.code.split(' ')[0];
        return skPrefix === objPrefix;
      });

      if (matchingSkills.length > 0) {
        // Link matching skills to this objective
        for (const sk of matchingSkills) {
          const linkKey = `${obj.id}|||${sk.id}`;
          if (existingSet.has(linkKey)) continue;
          insertStatements.push(
            `INSERT OR IGNORE INTO objective_skills (objective_id, skill_id) VALUES ('${obj.id.replace(/'/g, "''")}', '${sk.id.replace(/'/g, "''")}')`
          );
          existingSet.add(linkKey);
          created++;
          totalCreated++;
        }
      } else {
        // No prefix match: link first skill as fallback (closest match by subject)
        // Only if objective has no skills yet
        const hasAnyLink = existingLinks.some(l => l.objective_id === obj.id);
        if (!hasAnyLink && subjectSkills.length > 0) {
          const sk = subjectSkills[0]; // first skill for this subject
          const linkKey = `${obj.id}|||${sk.id}`;
          if (!existingSet.has(linkKey)) {
            insertStatements.push(
              `INSERT OR IGNORE INTO objective_skills (objective_id, skill_id) VALUES ('${obj.id.replace(/'/g, "''")}', '${sk.id.replace(/'/g, "''")}')`
            );
            existingSet.add(linkKey);
            created++;
            totalCreated++;
          }
        }
      }
    }

    if (created > 0) {
      perSubject[subjectId] = { count: created, objCount: objs.length, skillCount: subjectSkills.length };
    }
  }

  console.log(`Vínculos a crear: ${totalCreated}`);

  if (totalCreated === 0) {
    console.log('\nNo hay vínculos nuevos que crear.');
    return;
  }

  // Show per-subject breakdown
  console.log('\nVínculos por asignatura:');
  for (const [subjId, info] of Object.entries(perSubject)) {
    console.log(`  ${subjId}: ${info.count} vínculos (${info.objCount} OA, ${info.skillCount} skills)`);
  }

  if (isApply && insertStatements.length > 0) {
    console.log(`\nEjecutando batch INSERT (${insertStatements.length} statements)...`);
    // Split into chunks of 100 to avoid timeout
    const CHUNK = 100;
    let success = true;
    for (let i = 0; i < insertStatements.length; i += CHUNK) {
      const chunk = insertStatements.slice(i, i + CHUNK);
      const batchSql = chunk.join(';\n') + ';\n';
      const ok = execBatch(batchSql);
      if (!ok) {
        console.error(`ERROR: Batch ${Math.floor(i/CHUNK)+1} falló.`);
        success = false;
        break;
      }
      console.log(`  Batch ${Math.floor(i/CHUNK)+1}: ${chunk.length} statements OK`);
    }
    if (success) {
      console.log(`\nBatch INSERT ejecutado exitosamente.`);
    }
  } else {
    console.log('\nDRY RUN — No se ejecutaron cambios.');
    console.log('Ejecuta con --apply para aplicar.');
  }

  // Verify
  const finalCount = await query('SELECT COUNT(*) as total FROM objective_skills');
  console.log(`\nVínculos totales en D1: ${finalCount[0]?.total ?? 0}`);
  console.log('\n═══════════════════════════════════════════════════\n');
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
