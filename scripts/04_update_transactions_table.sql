-- Add title and account_id columns to transactions table
-- Run this if you already have the transactions table created

-- Add new columns if they don't exist
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
