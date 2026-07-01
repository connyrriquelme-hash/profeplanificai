-- Bloques no lectivos para el trabajo docente chileno.
-- Preparado para futuro sistema de recordatorios por correo.

CREATE TABLE IF NOT EXISTS non_teaching_blocks (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  school_year INTEGER NOT NULL DEFAULT (strftime('%Y', 'now')),

  block_type TEXT NOT NULL DEFAULT 'no_lectivo',
  non_teaching_type TEXT NOT NULL DEFAULT 'otro',

  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  block_date TEXT NOT NULL,
  start_time TEXT NOT NULL DEFAULT '08:00',
  end_time TEXT NOT NULL DEFAULT '09:00',

  location TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'media',

  course_name TEXT DEFAULT '',
  subject_name TEXT DEFAULT '',

  status TEXT NOT NULL DEFAULT 'pendiente',

  reminder_enabled INTEGER NOT NULL DEFAULT 0,
  reminder_minutes_before INTEGER NOT NULL DEFAULT 30,
  reminder_email TEXT DEFAULT '',
  reminder_status TEXT NOT NULL DEFAULT 'no_aplica',
  reminder_sent_at TEXT,

  requires_follow_up INTEGER NOT NULL DEFAULT 0,
  follow_up_notes TEXT DEFAULT '',

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ntb_teacher_date
  ON non_teaching_blocks(teacher_id, block_date);

CREATE INDEX IF NOT EXISTS idx_ntb_teacher_year
  ON non_teaching_blocks(teacher_id, school_year);
