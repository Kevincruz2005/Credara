-- Add created_at column to references table
ALTER TABLE reference ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
