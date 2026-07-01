/**
 * Validate the actual D1 schema used by the current Cloudflare Pages Functions.
 *
 * This is intentionally plain JavaScript ESM. Do not add TypeScript syntax here.
 *
 * Usage:
 *   node scripts/validate-d1-schema.mjs
 *   node scripts/validate-d1-schema.mjs --remote
 */

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const TABLE_QUERY = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;";

/**
 * Required by active API routes/importer/agents in the current backend.
 * Spanish migration 004 tables are deliberately excluded because no active
 * Function or importer route queries them.
 */
export const requiredTables = Object.freeze([
  // Current English curriculum schema and importer
  'courses',
  'subjects',
  'axes',
  'units',
  'objectives',
  'skills',
  'attitudes',
  'objective_skills',
  'objective_attitudes',
  'resources',
  'questions',
  'generated_activities',
  'generation_logs',
  'import_logs',

  // Pedagogical enrichment and agents
  'curriculum_indicators',
  'evaluation_indicators',
  'objective_indicators',
  'methodologies',
  'methodology_strategies',
  'methodology_subject_fit',
  'resource_templates',
  'generated_resources',
  'generated_presentations',
  'curriculum_sources',
  'search_documents',
  'agent_runs',

  // Current curriculum v2 API routes
  'education_levels',
  'curriculum_axes',
  'learning_objectives',
  'curricular_skills',
  'curricular_attitudes',

  // App/auth/library data used by active routes
  'usuarios',
  'sessions',
  'planes',
  'recursos',
  'evaluaciones',
  'drive_items',
  'drive_folders',
  'cursos',
  'estudiantes',
  'colaboracion_posts',
  'colaboracion_comentarios',
  'oa_favoritos',

  // Image generation/cache
  'image_cache',

  // Mis Clases active teacher workflow
  'teacher_classes',
  'teacher_weekly_schedules',
  'teacher_schedule_slots',
  'lesson_instances',
  'lesson_plans',
  'lesson_plan_curriculum',
  'lesson_plan_methodologies',
  'lesson_generated_resources',
  'lesson_generated_evaluations',
  'lesson_attachments',
  'lesson_comments',
  'lesson_autosave_events',
]);

export const futureOrAlternateTables = Object.freeze({
  spanishMigration004: Object.freeze([
    'niveles',
    'asignaturas',
    'nivel_asignatura',
    'objetivos_aprendizaje',
    'indicadores_evaluacion',
    'habilidades',
  ]),
});

export function getProjectRoot() {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..');
}

export function readDatabaseName(projectRoot = process.cwd()) {
  const wranglerPath = resolve(projectRoot, 'wrangler.toml');
  if (!existsSync(wranglerPath)) {
    throw new Error(`wrangler.toml not found at ${wranglerPath}`);
  }

  const toml = readFileSync(wranglerPath, 'utf8');
  const match = toml.match(/database_name\s*=\s*"([^"]+)"/);
  if (!match) {
    throw new Error('database_name was not found in wrangler.toml');
  }
  return match[1];
}

function collectNamesFromJson(value, names) {
  if (Array.isArray(value)) {
    for (const item of value) collectNamesFromJson(item, names);
    return;
  }
  if (!value || typeof value !== 'object') return;

  if (typeof value.name === 'string') {
    names.add(value.name);
  }
  for (const nested of Object.values(value)) {
    collectNamesFromJson(nested, names);
  }
}

export function parseWranglerTableOutput(output) {
  const text = String(output || '').trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    const names = new Set();
    collectNamesFromJson(parsed, names);
    return [...names].filter(isLikelyTableName).sort();
  } catch {
    // Fall through to text/table parsing.
  }

  const names = new Set();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || /wrangler|Resource location|Use --remote|Executing on|Database|\u2500|\u250C|\u2514|\u251C|\u2524|name\s*$/i.test(trimmed)) {
      continue;
    }

    const boxMatch = trimmed.match(/^[\u2502|]\s*([A-Za-z_][A-Za-z0-9_]*)\s*[\u2502|]$/u);
    if (boxMatch && isLikelyTableName(boxMatch[1])) {
      names.add(boxMatch[1]);
      continue;
    }

    const plainMatch = trimmed.match(/^["']?([A-Za-z_][A-Za-z0-9_]*)["']?$/);
    if (plainMatch && isLikelyTableName(plainMatch[1])) {
      names.add(plainMatch[1]);
    }
  }

  return [...names].sort();
}

function isLikelyTableName(value) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value)
    && value !== 'name'
    && !value.startsWith('_cf_')
    && value !== 'sqlite_sequence';
}

export function queryD1Tables(options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const dbName = options.dbName || readDatabaseName(projectRoot);
  const isRemote = Boolean(options.isRemote);
  const modeFlag = isRemote ? '--remote' : '--local';
  if (!/^[A-Za-z0-9_.-]+$/.test(dbName)) {
    throw new Error(`Unsafe database name in wrangler.toml: ${dbName}`);
  }
  const baseCommand = `npx.cmd wrangler d1 execute ${dbName} ${modeFlag} --command "${TABLE_QUERY}"`;

  let output = '';
  try {
    output = execSync(`${baseCommand} --json`, {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (jsonError) {
    try {
      output = execSync(baseCommand, {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch (textError) {
      const jsonMessage = jsonError instanceof Error ? jsonError.message : String(jsonError);
      const textMessage = textError instanceof Error ? textError.message : String(textError);
      throw new Error(`Could not query D1 with wrangler. JSON attempt: ${jsonMessage}. Text attempt: ${textMessage}`);
    }
  }

  const tables = parseWranglerTableOutput(output);
  if (tables.length === 0) {
    throw new Error('D1 query returned no table names. Validation cannot continue.');
  }
  return tables;
}

export function validateTables(actualTables, required = requiredTables) {
  const actual = new Set(actualTables);
  const found = [];
  const missing = [];

  for (const table of required) {
    if (actual.has(table)) found.push(table);
    else missing.push(table);
  }

  return {
    valid: missing.length === 0,
    found,
    missing,
    actualTables: [...actual].sort(),
    requiredTables: [...required],
  };
}

export function spanishMigration004TablesAreUnused(required = requiredTables) {
  return futureOrAlternateTables.spanishMigration004.every((table) => !required.includes(table));
}

export function formatValidationReport(validation, options = {}) {
  const lines = [];
  lines.push('D1 schema validation');
  lines.push(`Mode: ${options.isRemote ? 'remote' : 'local'}`);
  lines.push(`Database: ${options.dbName || '(unknown)'}`);
  lines.push(`Actual tables: ${validation.actualTables.length}`);
  lines.push(`Required tables: ${validation.requiredTables.length}`);
  lines.push(`Found required: ${validation.found.length}`);
  lines.push(`Missing required: ${validation.missing.length}`);
  lines.push(`Spanish migration 004 required: ${spanishMigration004TablesAreUnused(validation.requiredTables) ? 'no' : 'yes'}`);

  if (validation.missing.length > 0) {
    lines.push('');
    lines.push('Missing tables:');
    for (const table of validation.missing) lines.push(`- ${table}`);
  }

  lines.push('');
  lines.push(validation.valid ? 'SCHEMA VALIDATION PASSED' : 'SCHEMA VALIDATION FAILED');
  return lines.join('\n');
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const isRemote = argv.includes('--remote') || env.VALIDATE_D1_REMOTE === 'true';
  const projectRoot = process.cwd();
  const dbName = readDatabaseName(projectRoot);
  const actualTables = queryD1Tables({ projectRoot, dbName, isRemote });
  const validation = validateTables(actualTables);
  console.log(formatValidationReport(validation, { dbName, isRemote }));
  if (!validation.valid) {
    process.exitCode = 1;
  }
  return validation;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`D1 schema validation failed: ${message}`);
    process.exitCode = 1;
  });
}
