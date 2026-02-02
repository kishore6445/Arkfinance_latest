-- Create allocation_settings table to store global allocation rules
CREATE TABLE IF NOT EXISTS allocation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  sweep_frequency TEXT NOT NULL CHECK (sweep_frequency IN ('monthly', 'quarterly')) DEFAULT 'monthly',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, account_id)
);

-- Enable Row Level Security
ALTER TABLE allocation_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for allocation_settings
CREATE POLICY "Users can view their own allocation settings"
  ON allocation_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own allocation settings"
  ON allocation_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own allocation settings"
  ON allocation_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own allocation settings"
  ON allocation_settings FOR DELETE
  USING (auth.uid() = user_id);
