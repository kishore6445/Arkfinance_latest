-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('current', 'savings', 'business', 'cash')),
  account_number VARCHAR(50),
  ifsc_code VARCHAR(20),
  balance DECIMAL(15, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bucket_bank_mappings table
CREATE TABLE IF NOT EXISTS bucket_bank_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  allocation_percentage DECIMAL(5, 2) DEFAULT 0,
  allocation_amount DECIMAL(15, 2) DEFAULT 0,
  allocation_type VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (allocation_type IN ('percentage', 'fixed')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, account_id, bank_account_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX idx_bucket_bank_mappings_user_id ON bucket_bank_mappings(user_id);
CREATE INDEX idx_bucket_bank_mappings_account_id ON bucket_bank_mappings(account_id);
CREATE INDEX idx_bucket_bank_mappings_bank_account_id ON bucket_bank_mappings(bank_account_id);

-- Enable RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_bank_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bank_accounts
CREATE POLICY "Users can view their own bank accounts"
  ON bank_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank accounts"
  ON bank_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank accounts"
  ON bank_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank accounts"
  ON bank_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for bucket_bank_mappings
CREATE POLICY "Users can view their own bucket bank mappings"
  ON bucket_bank_mappings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bucket bank mappings"
  ON bucket_bank_mappings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bucket bank mappings"
  ON bucket_bank_mappings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bucket bank mappings"
  ON bucket_bank_mappings FOR DELETE
  USING (auth.uid() = user_id);
