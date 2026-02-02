-- Category to Account Mappings Table
-- Maps business categories to checking accounts for automatic fund allocation
CREATE TABLE IF NOT EXISTS public.category_account_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.transaction_categories(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  split_percentage DECIMAL(5,2) DEFAULT 100.00,
  -- 100 = all to this account, <100 = split across multiple accounts
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT category_account_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT valid_percentage CHECK (split_percentage > 0 AND split_percentage <= 100)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_category_mappings_category ON public.category_account_mappings(category_id);
CREATE INDEX IF NOT EXISTS idx_category_mappings_account ON public.category_account_mappings(account_id);
CREATE INDEX IF NOT EXISTS idx_category_mappings_active ON public.category_account_mappings(is_active);

-- Add classification status to transactions if not exists
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS classification_status VARCHAR(20) DEFAULT 'recorded';

-- Add accounting_type and accounting_subtype if not exists
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS accounting_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS accounting_subtype VARCHAR(100);

COMMENT ON TABLE public.category_account_mappings IS 'Maps business categories to checking accounts for automatic fund allocation based on Donald Miller philosophy';
COMMENT ON COLUMN public.category_account_mappings.split_percentage IS 'Percentage of transaction amount to allocate to this account. Multiple rows can exist for split allocations';
COMMENT ON COLUMN public.transactions.classification_status IS 'recorded = owner entry only, classified = CA assigned accounting type, needs_info = requires review';
