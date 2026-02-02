-- Add completed_at column to track when allocation was executed

ALTER TABLE allocations
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add index for faster queries on completed allocations
CREATE INDEX IF NOT EXISTS idx_allocations_completed_at ON allocations(completed_at);

-- Update existing completed allocations to have a timestamp
UPDATE allocations
SET completed_at = updated_at
WHERE status = 'completed' AND completed_at IS NULL;
