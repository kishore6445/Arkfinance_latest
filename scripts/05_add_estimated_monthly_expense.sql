-- Add estimated_monthly_expense column to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS estimated_monthly_expense DECIMAL(15, 2) DEFAULT 0;
