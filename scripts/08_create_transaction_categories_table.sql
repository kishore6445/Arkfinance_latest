-- Create transaction_categories table
CREATE TABLE IF NOT EXISTS transaction_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_type ON transaction_categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON transaction_categories(is_active);

-- Insert default revenue categories
INSERT INTO transaction_categories (name, type, sort_order) VALUES
  ('Services', 'revenue', 1),
  ('Product Sales', 'revenue', 2),
  ('Consulting', 'revenue', 3),
  ('Subscription', 'revenue', 4),
  ('Commission', 'revenue', 5),
  ('Other Income', 'revenue', 6);

-- Insert default expense categories
INSERT INTO transaction_categories (name, type, sort_order) VALUES
  ('Rent', 'expense', 1),
  ('Salary', 'expense', 2),
  ('Marketing', 'expense', 3),
  ('Software', 'expense', 4),
  ('Travel', 'expense', 5),
  ('Utilities', 'expense', 6),
  ('Professional Fees', 'expense', 7),
  ('GST / Tax', 'expense', 8);
