-- Accounting Types table (system-defined)
CREATE TABLE IF NOT EXISTS public.accounting_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    statement_type VARCHAR(20) NOT NULL CHECK (statement_type IN ('P&L', 'Balance Sheet')),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Accounting Sub-Types table (managed by admin)
CREATE TABLE IF NOT EXISTS public.accounting_subtypes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    accounting_type_id UUID REFERENCES accounting_types(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert system-defined Accounting Types
INSERT INTO public.accounting_types (name, statement_type, sort_order) VALUES
('Revenue', 'P&L', 1),
('Expense', 'P&L', 2),
('Asset', 'Balance Sheet', 3),
('Liability', 'Balance Sheet', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert predefined sub-types
INSERT INTO public.accounting_subtypes (name, accounting_type_id, sort_order)
SELECT 'Fixed Asset', id, 1 FROM accounting_types WHERE name = 'Asset'
UNION ALL
SELECT 'Current Asset', id, 2 FROM accounting_types WHERE name = 'Asset'
UNION ALL
SELECT 'Inventory', id, 3 FROM accounting_types WHERE name = 'Asset'
UNION ALL
SELECT 'Advances', id, 4 FROM accounting_types WHERE name = 'Asset'
UNION ALL
SELECT 'ITC Receivable', id, 5 FROM accounting_types WHERE name = 'Asset'
UNION ALL
SELECT 'Loan Payable', id, 1 FROM accounting_types WHERE name = 'Liability'
UNION ALL
SELECT 'GST Payable', id, 2 FROM accounting_types WHERE name = 'Liability'
UNION ALL
SELECT 'TDS Payable', id, 3 FROM accounting_types WHERE name = 'Liability'
UNION ALL
SELECT 'Salary Payable', id, 4 FROM accounting_types WHERE name = 'Liability'
UNION ALL
SELECT 'Vendor Payable', id, 5 FROM accounting_types WHERE name = 'Liability'
UNION ALL
SELECT 'Operating Expense', id, 1 FROM accounting_types WHERE name = 'Expense'
UNION ALL
SELECT 'Administrative Expense', id, 2 FROM accounting_types WHERE name = 'Expense'
UNION ALL
SELECT 'Marketing Expense', id, 3 FROM accounting_types WHERE name = 'Expense'
UNION ALL
SELECT 'Finance Cost', id, 4 FROM accounting_types WHERE name = 'Expense'
UNION ALL
SELECT 'Operating Revenue', id, 1 FROM accounting_types WHERE name = 'Revenue'
UNION ALL
SELECT 'Other Income', id, 2 FROM accounting_types WHERE name = 'Revenue';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_accounting_subtypes_type ON accounting_subtypes(accounting_type_id);
CREATE INDEX IF NOT EXISTS idx_accounting_subtypes_active ON accounting_subtypes(is_active);
