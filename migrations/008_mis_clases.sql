PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS teacher_classes (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  school_year INTEGER NOT NULL,
  level_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  course_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#2563eb',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS teacher_weekly_schedules (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  name TEXT NOT NULL,
  school_year INTEGER NOT NULL,
  starts_on TEXT NOT NULL,
  ends_on TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS teacher_schedule_slots (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 5),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  repeats_weekly INTEGER NOT NULL DEFAULT 1,
  recurrence_rule TEXT,
  room TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (schedule_id) REFERENCES teacher_weekly_schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES teacher_classes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lesson_instances (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  schedule_slot_id TEXT,
  lesson_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('planificada','en_preparacion','realizada','pendiente')),
  title TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (class_id) REFERENCES teacher_classes(id) ON DELETE CASCADE,
  FOREIGN KEY (schedule_slot_id) REFERENCES teacher_schedule_slots(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS lesson_plans (
  id TEXT PRIMARY KEY,
  lesson_instance_id TEXT NOT NULL UNIQUE,
  teacher_id TEXT NOT NULL,
  title TEXT NOT NULL,
  objective_text TEXT,
  purpose_text TEXT,
  beginning_text TEXT,
  development_text TEXT,
  closure_text TEXT,
  challenge_question TEXT,
  abp_project_text TEXT,
  resources_text TEXT,
  evaluation_text TEXT,
  instruments_text TEXT,
  dua_adjustments_text TEXT,
  teacher_observations TEXT,
  ai_summary TEXT,
  autosave_version INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lesson_instance_id) REFERENCES lesson_instances(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lesson_plan_curriculum (
  id TEXT PRIMARY KEY,
  lesson_plan_id TEXT NOT NULL UNIQUE,
  level_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  axis_id TEXT,
  objective_id TEXT NOT NULL,
  indicator_ids_json TEXT NOT NULL DEFAULT '[]',
  skill_ids_json TEXT NOT NULL DEFAULT '[]',
  attitude_ids_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lesson_plan_methodologies (
  id TEXT PRIMARY KEY,
  lesson_plan_id TEXT NOT NULL,
  methodology_id TEXT NOT NULL,
  strategy_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE,
  UNIQUE (lesson_plan_id, methodology_id)
);

CREATE TABLE IF NOT EXISTS lesson_generated_resources (
  id TEXT PRIMARY KEY,
  lesson_plan_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content_json TEXT NOT NULL,
  file_url TEXT,
  source_context_json TEXT NOT NULL,
  ai_provider TEXT NOT NULL DEFAULT 'local',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lesson_generated_evaluations (
  id TEXT PRIMARY KEY,
  lesson_plan_id TEXT NOT NULL,
  evaluation_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content_json TEXT NOT NULL,
  rubric_json TEXT,
  answer_key_json TEXT,
  source_context_json TEXT NOT NULL,
  ai_provider TEXT NOT NULL DEFAULT 'local',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lesson_attachments (
  id TEXT PRIMARY KEY,
  lesson_plan_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lesson_comments (
  id TEXT PRIMARY KEY,
  lesson_plan_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lesson_autosave_events (
  id TEXT PRIMARY KEY,
  lesson_plan_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  saved_value_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_teacher_classes_teacher ON teacher_classes(teacher_id, school_year, is_active);
CREATE INDEX IF NOT EXISTS idx_teacher_slots_schedule ON teacher_schedule_slots(schedule_id, weekday);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_date ON lesson_instances(teacher_id, lesson_date, start_time);
CREATE INDEX IF NOT EXISTS idx_lessons_class ON lesson_instances(class_id, lesson_date);
CREATE INDEX IF NOT EXISTS idx_lesson_plan_curriculum_objective ON lesson_plan_curriculum(objective_id);
CREATE INDEX IF NOT EXISTS idx_lesson_resources_plan ON lesson_generated_resources(lesson_plan_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_evaluations_plan ON lesson_generated_evaluations(lesson_plan_id, created_at DESC);
