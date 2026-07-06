-- Add active column to usuarios table (default 1 = active)
ALTER TABLE usuarios ADD COLUMN active INTEGER DEFAULT 1;
