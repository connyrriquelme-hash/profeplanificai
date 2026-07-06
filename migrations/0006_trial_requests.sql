-- 0006_trial_requests.sql
-- Tabla de solicitudes de prueba gratuita desde la landing pública

CREATE TABLE IF NOT EXISTS trial_requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  institution TEXT,
  role TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT DEFAULT 'public_landing',
  user_agent TEXT,
  ip_hash TEXT,
  email_sent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trial_requests_email ON trial_requests(email);
CREATE INDEX IF NOT EXISTS idx_trial_requests_status ON trial_requests(status);
CREATE INDEX IF NOT EXISTS idx_trial_requests_created_at ON trial_requests(created_at);
