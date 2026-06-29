-- Migration 003: Shared documents & collaboration schema
-- D1 database: planificaia-db

CREATE TABLE IF NOT EXISTS shared_documents (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  owner_name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT '',
  source_id TEXT NOT NULL DEFAULT '',
  share_token TEXT UNIQUE NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'shared',
  permission TEXT NOT NULL DEFAULT 'view',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shared_document_collaborators (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (document_id) REFERENCES shared_documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shared_document_comments (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (document_id) REFERENCES shared_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shared_document_versions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  content TEXT NOT NULL,
  edited_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (document_id) REFERENCES shared_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (edited_by) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shared_docs_owner ON shared_documents(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_docs_token ON shared_documents(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_docs_collab_doc ON shared_document_collaborators(document_id);
CREATE INDEX IF NOT EXISTS idx_shared_docs_comments_doc ON shared_document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_shared_docs_versions_doc ON shared_document_versions(document_id);
