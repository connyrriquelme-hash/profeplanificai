#!/usr/bin/env node
/**
 * audit-curriculum-coverage.mjs
 * Auditoría completa de cobertura curricular en D1.
 */

import { execSync } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DB_NAME = 'planificaia-db';

function queryD1(sql) {
  const tmpFile = join(PROJECT_ROOT, `.tmp-audit-${Date.now()}.sql`);
  try {
    const { writeFileSync, unlinkSync } = await import('fs');
    writeFileSync(tmpFile, sql, 'utf-8');
    const output = execSync(`npx wrangler d1 execute ${DB_NAME} --remote --file "${tmpFile}"`, { encoding: 'utf-8', cwd: PROJECT_ROOT, timeout: 30000 });
    try { unlinkSync(tmpFile); } catch {}
    const match = output.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed?.[0]?.results) return parsed[0].results;
    }
    return [];
  } catch { return []; }
}

// Use sync version for simplicity
function q(sql) {
  const tmpFile = join(PROJECT_ROOT, `.tmp-audit-${Date.now()}-${Math.random().toString(36).slice(2)}.sql`);
  try {
    const { writeFileSync, unlinkSync } = await import('fs');
    writeFileSync(tmpFile, sql, 'utf-8');
    const output = execSync(`npx wrangler d1 execute ${DB_NAME} --remote --file "${tmpFile}"`, { encoding: 'utf-8', cwd: PROJECT_ROOT, timeout: 30000 });
    try { unlinkSync(tmpFile); } catch {}
    const match = output.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed?.[0]?.results) return parsed[0].results;
    }
    return [];
  } catch { return []; }
}

async function main() {
  const { writeFileSync, unlinkSync } = await import('fs');

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  AUDITORÍA CURRICULAR — D1');
  console.log('═══════════════════════════════════════════════════\n');

  // Helper to query
  function query(sql) {
    const tmpFile = join(PROJECT_ROOT, `.tmp-audit-${Date.now()}-${Math.random().toString(36).slice(2)}.sql`);
    try {
      writeFileSync(tmpFile, sql, 'utf-8');
      const output = execSync(`npx wrangler d1 execute ${DB_NAME} --remote --file "${tmpFile}"`, { encoding: 'utf-8', cwd: PROJECT_ROOT, timeout: 30000 });
      try { unlinkSync(tmpFile); } catch {}
      const match = output.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed?.[0]?.results) return parsed[0].results;
      }
      return [];
    } catch { return []; }
  }

  // 1. Totals
  console.log('1. TOTALES:');
  const tables = ['courses', 'subjects', 'objectives', 'skills', 'attitudes', 'objective_skills', 'curriculum_indicators'];
  for (const t of tables) {
    const r = query(`SELECT COUNT(*) as total FROM ${t}`);
    console.log(`   ${t}: ${r[0]?.total ?? 0}`);
  }

  // 2. Objectives per course
  console.log('\n2. OBJETIVOS POR CURSO:');
  const objByCourse = query('SELECT c.name, COUNT(o.id) as count FROM courses c LEFT JOIN objectives o ON o.course_id = c.id GROUP BY c.id ORDER BY count DESC');
  for (const r of objByCourse) {
    console.log(`   ${r.name}: ${r.count} OA`);
  }

  // 3. Objectives per subject
  console.log('\n3. ASIGNATURAS CON OBJETIVOS (top 15):');
  const objBySubject = query('SELECT s.name, COUNT(o.id) as count FROM subjects s JOIN objectives o ON o.subject_id = s.id GROUP BY s.id ORDER BY count DESC LIMIT 15');
  for (const r of objBySubject) {
    console.log(`   ${r.name}: ${r.count} OA`);
  }

  // 4. Skills per subject
  console.log('\n4. SKILLS POR ASIGNATURA:');
  const skBySubject = query('SELECT s.name, COUNT(sk.id) as count FROM skills sk JOIN subjects s ON s.id = sk.subject_id GROUP BY s.id ORDER BY count DESC');
  if (skBySubject.length === 0) {
    console.log('   (ninguna)');
  } else {
    for (const r of skBySubject) {
      console.log(`   ${r.name}: ${r.count}`);
    }
  }

  // 5. Objective_skills links
  console.log('\n5. VÍNCULOS objective_skills:');
  const osCount = query('SELECT COUNT(*) as total FROM objective_skills');
  console.log(`   Total: ${osCount[0]?.total ?? 0}`);

  // 6. Indicators per subject
  console.log('\n6. INDICADORES POR ASIGNATURA:');
  const indBySubject = query('SELECT subject, COUNT(*) as count FROM curriculum_indicators GROUP BY subject ORDER BY count DESC');
  for (const r of indBySubject) {
    console.log(`   ${r.subject}: ${r.count}`);
  }

  // 7. Objectives without indicators
  console.log('\n7. OBJETIVOS SIN INDICADORES:');
  const objWithoutInd = query(`
    SELECT COUNT(DISTINCT o.id) as total
    FROM objectives o
    LEFT JOIN curriculum_indicators ci ON ci.oa_code = o.code
    WHERE ci.id IS NULL
  `);
  console.log(`   Sin indicadores: ${objWithoutInd[0]?.total ?? 0}`);

  // 8. Objectives without skills
  console.log('\n8. OBJETIVOS SIN SKILLS VINCULADAS:');
  const objWithoutSk = query(`
    SELECT COUNT(DISTINCT o.id) as total
    FROM objectives o
    LEFT JOIN objective_skills os ON os.objective_id = o.id
    WHERE os.skill_id IS NULL
  `);
  console.log(`   Sin skills vinculadas: ${objWithoutSk[0]?.total ?? 0}`);

  // 9. Subjects without indicators
  console.log('\n9. ASIGNATURAS SIN INDICADORES:');
  const subWithoutInd = query(`
    SELECT s.name
    FROM subjects s
    JOIN objectives o ON o.subject_id = s.id
    LEFT JOIN curriculum_indicators ci ON ci.oa_code = o.code
    GROUP BY s.id
    HAVING COUNT(ci.id) = 0
    ORDER BY s.name
  `);
  console.log(`   Cantidad: ${subWithoutInd.length}`);
  for (const r of subWithoutInd.slice(0, 10)) {
    console.log(`   - ${r.name}`);
  }
  if (subWithoutInd.length > 10) console.log(`   ... y ${subWithoutInd.length - 10} más`);

  // 10. Subjects without skills
  console.log('\n10. ASIGNATURAS SIN SKILLS:');
  const subWithoutSk = query(`
    SELECT s.name
    FROM subjects s
    JOIN objectives o ON o.subject_id = s.id
    LEFT JOIN skills sk ON sk.subject_id = s.id
    GROUP BY s.id
    HAVING COUNT(sk.id) = 0
    ORDER BY s.name
    LIMIT 15
  `);
  console.log(`   Cantidad: ${subWithoutSk.length}`);
  for (const r of subWithoutSk) {
    console.log(`   - ${r.name}`);
  }

  console.log('\n═══════════════════════════════════════════════════\n');
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
