-- Create login attempts and security log table
CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  attempted_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  error_message text,
  status text NOT NULL DEFAULT 'failed'
);

-- Enable RLS
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated users to insert login attempt logs
DROP POLICY IF EXISTS "anon_insert_login_attempts" ON login_attempts;
CREATE POLICY "anon_insert_login_attempts" ON login_attempts
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow only admins to view login attempt logs
DROP POLICY IF EXISTS "admin_read_login_attempts" ON login_attempts;
CREATE POLICY "admin_read_login_attempts" ON login_attempts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
