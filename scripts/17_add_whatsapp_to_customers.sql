-- Add WhatsApp number column to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Add index for faster WhatsApp number searches
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_number ON customers(whatsapp_number);
