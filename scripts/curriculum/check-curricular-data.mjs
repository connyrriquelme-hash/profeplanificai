#!/usr/bin/env node

/**
 * Diagnóstico curricular — verifica el estado de las tablas D1
 *
 * Uso:
 *   node scripts/curriculum/check-curricular-data.mjs
 *
 * Requiere:
 *   - wrangler instalado y autenticado
 *   - D1 remoto configurado (planificaia-db)
 *
 * Genera comandos SQL ejecutables con wrangler.
 */

const WRANGLER_DB = 'planificaia-db';

const queries = [
  // Totals per table
  { label: 'Total objective_indicators', sql: "SELECT COUNT(*) AS total FROM objective_indicators;" },
  { label: 'Total textbook_references', sql: "SELECT COUNT(*) AS total FROM textbook_references;" },
  { label: 'Total teacher_guide_references', sql: "SELECT COUNT(*) AS total FROM teacher_guide_references;" },
  { label: 'Total curricular_resource_links', sql: "SELECT COUNT(*) AS total FROM curricular_resource_links;" },
  { label: 'Total lesson_sequence_recommendations', sql: "SELECT COUNT(*) AS total FROM lesson_sequence_recommendations;" },

  // OA stats
  { label: 'Total OA en objectives', sql: "SELECT COUNT(*) AS total FROM objectives WHERE type='OA';" },
  { label: 'OAs por curso', sql: `SELECT c.code AS course_code, c.name AS course_name, COUNT(*) AS total
    FROM objectives o JOIN courses c ON c.id = o.course_id
    WHERE o.type='OA' GROUP BY c.code ORDER BY c.sort_order;` },
  { label: 'OAs por asignatura', sql: `SELECT s.normalized_name AS subject, COUNT(*) AS total
    FROM objectives o JOIN subjects s ON s.id = o.subject_id
    WHERE o.type='OA' GROUP BY s.normalized_name ORDER BY s.normalized_name;` },
  { label: 'OAs por curso + asignatura', sql: `SELECT c.code AS course, s.normalized_name AS subject, COUNT(*) AS total
    FROM objectives o JOIN courses c ON c.id = o.course_id JOIN subjects s ON s.id = o.subject_id
    WHERE o.type='OA' GROUP BY c.code, s.normalized_name ORDER BY c.sort_order, s.normalized_name;` },
  { label: 'OAs con bloom_level', sql: "SELECT bloom_level, COUNT(*) AS total FROM objectives WHERE type='OA' AND bloom_level IS NOT NULL AND bloom_level != '' GROUP BY bloom_level ORDER BY total DESC;" },

  // Enrichment data joined with objectives
  { label: 'OAs con indicadores', sql: "SELECT COUNT(DISTINCT objective_id) AS total FROM objective_indicators;" },
  { label: 'Indicadores por OA (top 5)', sql: `SELECT o.code, COUNT(i.id) AS total
    FROM objectives o JOIN objective_indicators i ON i.objective_id = o.id
    GROUP BY o.code ORDER BY total DESC LIMIT 5;` },
  { label: 'Indicadores derivados vs oficiales', sql: `SELECT COALESCE(source_type, 'official') AS source_type, COUNT(*) AS total
    FROM objective_indicators GROUP BY COALESCE(source_type, 'official');` },
  { label: 'Recomendaciones por complejidad', sql: `SELECT complexity, COUNT(*) AS total
    FROM lesson_sequence_recommendations GROUP BY complexity ORDER BY total DESC;` },
  { label: 'Recomendaciones source_type', sql: `SELECT COALESCE(source_type, 'official') AS source_type, COUNT(*) AS total
    FROM lesson_sequence_recommendations GROUP BY COALESCE(source_type, 'official');` },
  { label: 'Recursos por tipo', sql: `SELECT type, COUNT(*) AS total
    FROM curricular_resource_links GROUP BY type ORDER BY total DESC;` },

  // Data quality checks
  { label: 'Indicadores sin source_type', sql: "SELECT COUNT(*) AS total FROM objective_indicators WHERE source_type IS NULL OR source_type = '';" },
  { label: 'Textos sin source_type', sql: "SELECT COUNT(*) AS total FROM textbook_references WHERE source_type IS NULL OR source_type = '';" },
  { label: 'Recomendaciones fuera de rango', sql: "SELECT COUNT(*) AS total FROM lesson_sequence_recommendations WHERE recommended_lessons < 1 OR recommended_lessons > 5;" },
];

function generateCommands() {
  console.log('=== DIAGNÓSTICO CURRICULAR D1 ===');
  console.log(`Base de datos: ${WRANGLER_DB}\n`);

  console.log('Para ejecutar todo el diagnóstico:');
  console.log('');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│  EJECUTAR EN PowerShell o bash                              │');
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log('');

  for (const q of queries) {
    const cmd = `wrangler d1 execute ${WRANGLER_DB} --remote --command "${q.sql.replace(/"/g, '\\"')}"`;
    console.log(`-- ${q.label}`);
    console.log(cmd);
    console.log('');
  }

  console.log('\n=== RESUMEN RÁPIDO (una sola consulta) ===');
  const unionParts = queries.slice(0, 5).map((q, i) => {
    const alias = `t${i + 1}`;
    return `SELECT '${q.label.replace(/'/g, "''")}' AS tabla, COUNT(*) AS total FROM ${q.sql.match(/FROM\s+(\w+)/)?.[1] || q.sql.match(/FROM\s+(\w+)/)?.[1] || 'objective_indicators'}`;
  });
  console.log(`wrangler d1 execute ${WRANGLER_DB} --remote --command "SELECT 'objective_indicators' AS tabla, COUNT(*) AS total FROM objective_indicators UNION ALL SELECT 'textbook_references', COUNT(*) FROM textbook_references UNION ALL SELECT 'teacher_guide_references', COUNT(*) FROM teacher_guide_references UNION ALL SELECT 'curricular_resource_links', COUNT(*) FROM curricular_resource_links UNION ALL SELECT 'lesson_sequence_recommendations', COUNT(*) FROM lesson_sequence_recommendations;"`);

  console.log('\n=== DIAGNÓSTICO COMPLETO (archivo SQL) ===');
  console.log(`wrangler d1 execute ${WRANGLER_DB} --remote --file=scripts/curriculum/diagnostic.sql`);
  console.log('');
}

// Optional: generate a standalone SQL diagnostic file
function generateDiagnosticSQL() {
  let sql = '-- Diagnóstico curricular D1\n-- Generado automáticamente\n\n';
  for (const q of queries) {
    sql += `-- ${q.label}\n${q.sql}\n\n`;
  }
  return sql;
}

// Main
const args = process.argv.slice(2);
if (args.includes('--sql')) {
  const fs = await import('fs');
  const path = await import('path');
  const sqlPath = path.join(import.meta.dirname, 'diagnostic.sql');
  fs.writeFileSync(sqlPath, generateDiagnosticSQL());
  console.log(`Archivo SQL de diagnóstico generado: ${sqlPath}`);
} else {
  generateCommands();
}
