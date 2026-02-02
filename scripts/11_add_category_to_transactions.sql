-- Add category_id column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES transaction_categories(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);

-- Make category column nullable since we're moving to category_id
ALTER TABLE transactions ALTER COLUMN category DROP NOT NULL;
