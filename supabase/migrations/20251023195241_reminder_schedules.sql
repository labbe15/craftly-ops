-- Create reminder_schedules table for automatic reminder rules
CREATE TABLE IF NOT EXISTS reminder_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('quote', 'invoice')),
  is_active boolean DEFAULT true,

  -- Trigger conditions
  days_after_sent integer, -- For quotes: days after sent without response
  days_after_due integer, -- For invoices: days after due date

  -- Recurrence settings
  frequency text NOT NULL CHECK (frequency IN ('once', 'daily', 'weekly', 'every_n_days')),
  frequency_days integer DEFAULT 7, -- For 'every_n_days' frequency
  max_reminders integer DEFAULT 3, -- Maximum number of reminders to send

  -- Execution tracking
  last_run_at timestamp with time zone,
  next_run_at timestamp with time zone,

  -- Email template
  email_subject text,
  email_body text,

  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies
ALTER TABLE reminder_schedules ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage their org's schedules
CREATE POLICY "Users can view their org's reminder schedules"
  ON reminder_schedules
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their org's reminder schedules"
  ON reminder_schedules
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their org's reminder schedules"
  ON reminder_schedules
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their org's reminder schedules"
  ON reminder_schedules
  FOR DELETE
  USING (true);

-- Create index for performance
CREATE INDEX idx_reminder_schedules_org_id ON reminder_schedules(org_id);
CREATE INDEX idx_reminder_schedules_active ON reminder_schedules(is_active);
CREATE INDEX idx_reminder_schedules_next_run ON reminder_schedules(next_run_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_reminder_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reminder_schedules_updated_at
  BEFORE UPDATE ON reminder_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_reminder_schedules_updated_at();

-- Create reminder_logs table to track sent reminders
CREATE TABLE IF NOT EXISTS reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_schedule_id uuid REFERENCES reminder_schedules(id) ON DELETE CASCADE,
  related_type text NOT NULL CHECK (related_type IN ('quote', 'invoice')),
  related_id uuid NOT NULL,
  recipient_email text NOT NULL,
  sent_at timestamp with time zone DEFAULT now(),
  success boolean DEFAULT true,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies for reminder_logs
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reminder logs"
  ON reminder_logs
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert reminder logs"
  ON reminder_logs
  FOR INSERT
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_reminder_logs_schedule_id ON reminder_logs(reminder_schedule_id);
CREATE INDEX idx_reminder_logs_related ON reminder_logs(related_type, related_id);
CREATE INDEX idx_reminder_logs_sent_at ON reminder_logs(sent_at);
