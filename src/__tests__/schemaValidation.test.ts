import { describe, expect, it } from 'vitest';

type SchemaValidator = {
  requiredTables: readonly string[];
  futureOrAlternateTables: { spanishMigration004: readonly string[] };
  validateTables: (actualTables: string[], requiredTables?: readonly string[]) => {
    valid: boolean;
    found: string[];
    missing: string[];
  };
  spanishMigration004TablesAreUnused: (requiredTables?: readonly string[]) => boolean;
  parseWranglerTableOutput: (output: string) => string[];
};

async function loadValidator(): Promise<SchemaValidator> {
  return await import('../../scripts/validate-d1-schema.mjs') as SchemaValidator;
}

describe('D1 schema validator', () => {
  it('passes when all required active English-schema tables exist', async () => {
    const validator = await loadValidator();
    const actualTables = [...validator.requiredTables];
    const result = validator.validateTables(actualTables);

    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.found).toHaveLength(validator.requiredTables.length);
  });

  it('fails when a required active table is missing', async () => {
    const validator = await loadValidator();
    const actualTables = validator.requiredTables.filter((table) => table !== 'objectives');
    const result = validator.validateTables(actualTables);

    expect(result.valid).toBe(false);
    expect(result.missing).toContain('objectives');
  });

  it('requires the active Mis Clases teacher workflow tables', async () => {
    const validator = await loadValidator();

    expect(validator.requiredTables).toEqual(expect.arrayContaining([
      'teacher_classes',
      'teacher_weekly_schedules',
      'teacher_schedule_slots',
      'lesson_instances',
      'lesson_plans',
      'lesson_plan_curriculum',
      'lesson_generated_resources',
      'lesson_generated_evaluations',
      'lesson_autosave_events',
    ]));
  });

  it('documents Spanish migration 004 tables as unused by active schema validation', async () => {
    const validator = await loadValidator();

    expect(validator.spanishMigration004TablesAreUnused()).toBe(true);
    for (const spanishTable of validator.futureOrAlternateTables.spanishMigration004) {
      expect(validator.requiredTables).not.toContain(spanishTable);
    }
  });

  it('parses wrangler JSON table output', async () => {
    const validator = await loadValidator();
    const output = JSON.stringify([{ results: [{ name: 'courses' }, { name: 'objectives' }] }]);

    expect(validator.parseWranglerTableOutput(output)).toEqual(['courses', 'objectives']);
  });
});
