-- Migration: Add isArchived and archivedAt columns to conversations table
-- Safe to run even if columns already exist (uses DO block with IF NOT EXISTS logic)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'isArchived'
  ) THEN
    ALTER TABLE "conversations" ADD COLUMN "isArchived" boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'archivedAt'
  ) THEN
    ALTER TABLE "conversations" ADD COLUMN "archivedAt" timestamp;
  END IF;
END $$;
