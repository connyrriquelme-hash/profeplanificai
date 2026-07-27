#!/usr/bin/env node
/**
 * Siembra el schema de currículum en INGLÉS (courses / subjects / axes /
 * objectives / skills / attitudes / objective_skills) en la D1 LOCAL,
 * tirando los datos EN VIVO desde `planificaia-db` de PRODUCCIÓN vía
 * `wrangler d1 export --remote`.
 *
 * POR QUÉ EXISTE ESTE SCRIPT
 * `npm run local:setup` solo aplica migraciones — no puebla las tablas
 * objectives/courses/subjects/axes, porque en producción esas tablas se
 * llenan con un crawler en vivo contra curriculumnacional.cl
 * (functions/_lib/importer.ts), no con una migración. Sin este script,
 * la query primaria de functions/api/objectives.ts (y courses.ts /
 * subjects.ts / curriculum/indicators.ts) encuentra 0 filas localmente y
 * cae en silencio a un fallback legacy mucho más chico y desactualizado
 * (objetivos_aprendizaje / binding CORE_DB) — por eso el selector de OA
 * en Flujo Docente mostraba solo un puñado de objetivos en vez de los
 * ~2600 reales.
 *
 * ESTO NO ES UN SEED ESTÁTICO. No hay ningún .sql versionado en el repo:
 * cada corrida vuelve a exportar lo que HOY existe en producción. Hay
 * que volver a correrlo cuando:
 *   - reseteás tu D1 local (borrás .wrangler/state y corrés local:setup), o
 *   - sabés que el currículum de producción cambió y querés que tu
 *     selector local de OA lo refleje.
 *
 * Última verificación contra producción: 2026-07-26
 *   (2599 objectives, 114 subjects, 22 courses, 93 axes, 357 skills,
 *   460 attitudes, 16212 vínculos objective_skills).
 *
 * Requiere: wrangler autenticado con acceso de lectura a la D1 de
 * producción `planificaia-db` (verificar con `npx wrangler whoami`).
 *
 * Uso:
 *   node scripts/seed-objectives-en.mjs
 *   npm run seed:objectives:local
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TABLES = ['courses', 'subjects', 'axes', 'objectives', 'skills', 'attitudes', 'objective_skills'];

const wranglerToml = fs.readFileSync(path.join(process.cwd(), 'wrangler.toml'), 'utf-8');
const dbNameMatch = wranglerToml.match(/database_name\s*=\s*"([^"]+)"/);
const dbName = dbNameMatch ? dbNameMatch[1] : 'planificaia-db';

const tmpDir = path.join(process.cwd(), '.wrangler');
fs.mkdirSync(tmpDir, { recursive: true });
const tmpExportFile = path.join(tmpDir, 'tmp-seed-objectives-en.sql');
const tmpDeleteFile = path.join(tmpDir, 'tmp-clear-objectives-en.sql');

console.log(`\n🌐 Exportando schema de currículum inglés desde "${dbName}" (PRODUCCIÓN, solo lectura)...\n`);

try {
  const tableFlags = TABLES.map((t) => `--table ${t}`).join(' ');
  execSync(
    `npx wrangler d1 export ${dbName} --remote --no-schema ${tableFlags} --output="${tmpExportFile}" --skip-confirmation`,
    { stdio: 'inherit', cwd: process.cwd() },
  );

  console.log('\n🧹 Limpiando datos locales previos de estas tablas (evita duplicados al re-correr)...\n');
  const deleteSql = [
    'DELETE FROM objective_skills;',
    'DELETE FROM objective_attitudes;',
    'DELETE FROM objectives;',
    'DELETE FROM axes;',
    'DELETE FROM skills;',
    'DELETE FROM attitudes;',
    'DELETE FROM subjects;',
    'DELETE FROM courses;',
  ].join('\n');
  fs.writeFileSync(tmpDeleteFile, deleteSql);
  execSync(`npx wrangler d1 execute ${dbName} --local --file="${tmpDeleteFile}"`, { stdio: 'inherit', cwd: process.cwd() });

  console.log('\n⚡ Importando a la D1 local...\n');
  execSync(`npx wrangler d1 execute ${dbName} --local --file="${tmpExportFile}"`, { stdio: 'inherit', cwd: process.cwd() });

  console.log('\n✅ Listo. Conteos locales:\n');
  execSync(
    `npx wrangler d1 execute ${dbName} --local --command "SELECT (SELECT COUNT(*) FROM courses) as courses, (SELECT COUNT(*) FROM subjects) as subjects, (SELECT COUNT(*) FROM axes) as axes, (SELECT COUNT(*) FROM objectives) as objectives, (SELECT COUNT(*) FROM skills) as skills, (SELECT COUNT(*) FROM attitudes) as attitudes, (SELECT COUNT(*) FROM objective_skills) as objective_skills;"`,
    { stdio: 'inherit', cwd: process.cwd() },
  );
} catch (err) {
  console.error('\n❌ Error al sembrar el currículum en inglés:', err.message);
  process.exit(1);
} finally {
  try { fs.unlinkSync(tmpExportFile); } catch {}
  try { fs.unlinkSync(tmpDeleteFile); } catch {}
}
