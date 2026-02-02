-- Update allocations table to support automatic allocations from transactions

-- Add new columns to track allocation details
ALTER TABLE allocations
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS from_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS to_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed'));

-- Rename existing columns for clarity
ALTER TABLE allocations
RENAME COLUMN account_id TO to_account_id;

-- Update the unique constraint
ALTER TABLE allocations
DROP CONSTRAINT IF EXISTS allocations_user_id_account_id_key;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_allocations_transaction_id ON allocations(transaction_id);
CREATE INDEX IF NOT EXISTS idx_allocations_status ON allocations(status);
CREATE INDEX IF NOT EXISTS idx_allocations_user_id ON allocations(user_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own allocations" ON allocations;
DROP POLICY IF EXISTS "Users can insert their own allocations" ON allocations;
DROP POLICY IF EXISTS "Users can update their own allocations" ON allocations;
DROP POLICY IF EXISTS "Users can delete their own allocations" ON allocations;

CREATE POLICY "Users can view their own allocations"
  ON allocations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own allocations"
  ON allocations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own allocations"
  ON allocations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own allocations"
  ON allocations FOR DELETE
  USING (auth.uid() = user_id);
