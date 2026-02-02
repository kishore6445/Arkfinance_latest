-- Add WhatsApp number to invoices table (stored from client_name field for now)
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- Create whatsapp_messages table to track all WhatsApp messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  recipient_number TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('invoice', 'reminder', 'payment_confirmation')),
  message_status TEXT NOT NULL DEFAULT 'pending' CHECK (message_status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  twilio_message_sid TEXT,
  message_body TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoice_reminders table for scheduled reminders
CREATE TABLE IF NOT EXISTS invoice_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('before_due', 'on_due', 'overdue_3', 'overdue_7', 'overdue_15')),
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  whatsapp_message_id UUID REFERENCES whatsapp_messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_messages
CREATE POLICY "Users can view their own WhatsApp messages"
  ON whatsapp_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WhatsApp messages"
  ON whatsapp_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp messages"
  ON whatsapp_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WhatsApp messages"
  ON whatsapp_messages FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for invoice_reminders
CREATE POLICY "Users can view their own invoice reminders"
  ON invoice_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoice reminders"
  ON invoice_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoice reminders"
  ON invoice_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoice reminders"
  ON invoice_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_whatsapp_messages_invoice_id ON whatsapp_messages(invoice_id);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(message_status);
CREATE INDEX idx_whatsapp_messages_user_id ON whatsapp_messages(user_id);
CREATE INDEX idx_invoice_reminders_invoice_id ON invoice_reminders(invoice_id);
CREATE INDEX idx_invoice_reminders_scheduled_date ON invoice_reminders(scheduled_date, status);
CREATE INDEX idx_invoice_reminders_user_id ON invoice_reminders(user_id);
