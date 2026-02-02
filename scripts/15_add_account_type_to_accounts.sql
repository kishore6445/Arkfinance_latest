-- Add account_type column to accounts table to identify revenue accounts

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS account_type TEXT;

-- Set account_type for existing accounts based on slug
UPDATE accounts
SET account_type = CASE 
  WHEN slug = 'revenue' THEN 'revenue'
  WHEN slug IN ('operating', 'profit', 'tax', 'salary', 'emergency', 'growth') THEN 'allocation'
  ELSE 'other'
END
WHERE account_type IS NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_accounts_account_type ON accounts(account_type);
