-- Phase 1: Dashboard Enhancement - Database Schema
-- Migration: Add compliance deadlines tracking and enhance invoice status tracking

-- 1. Add paid_date and paid_amount columns to invoices table for payment tracking
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS paid_date DATE,
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN DEFAULT false;

-- 2. Create compliance_deadlines table for tracking tax, audit, and other compliance dates
CREATE TABLE IF NOT EXISTS compliance_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  deadline_date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('gst', 'income_tax', 'audit', 'filing', 'other')),
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_date DATE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  reminder_days INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create expense_alert_thresholds table for configurable expense alert rules
CREATE TABLE IF NOT EXISTS expense_alert_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  threshold_type TEXT NOT NULL CHECK (threshold_type IN ('percentage_change', 'absolute_amount', 'budget_exceeded')),
  category TEXT,
  threshold_value DECIMAL(10, 2) NOT NULL,
  alert_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, threshold_type, category)
);

-- Enable RLS for new tables
ALTER TABLE compliance_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_alert_thresholds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for compliance_deadlines
CREATE POLICY "Users can view their own compliance deadlines"
  ON compliance_deadlines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own compliance deadlines"
  ON compliance_deadlines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own compliance deadlines"
  ON compliance_deadlines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own compliance deadlines"
  ON compliance_deadlines FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for expense_alert_thresholds
CREATE POLICY "Users can view their own expense alert thresholds"
  ON expense_alert_thresholds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own expense alert thresholds"
  ON expense_alert_thresholds FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_compliance_deadlines_user_id ON compliance_deadlines(user_id);
CREATE INDEX idx_compliance_deadlines_category ON compliance_deadlines(category);
CREATE INDEX idx_compliance_deadlines_deadline ON compliance_deadlines(deadline_date);
CREATE INDEX idx_expense_alert_thresholds_user_id ON expense_alert_thresholds(user_id);
CREATE INDEX idx_invoices_status_paid ON invoices(status) WHERE status != 'paid';
CREATE INDEX idx_invoices_overdue ON invoices(is_overdue) WHERE is_overdue = true;
