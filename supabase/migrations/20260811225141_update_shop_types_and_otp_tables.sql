/*
# Update shop types to 5 target categories + create OTP tables

1. Replaces shop_types with exactly 5 categories: pharmacie, kiosque, cosmitique, kankari, superet
2. Creates otp_codes table for custom phone OTP verification
3. Creates phone_auth table to map phone numbers to Supabase auth accounts
*/

-- Clear and re-seed shop_types with only the 5 target categories
DELETE FROM shop_types;
INSERT INTO shop_types (name, icon, sort_order) VALUES
  ('صيدلية', 'Pill', 1),
  ('كيوسك', 'Newspaper', 2),
  ('سوبر ماركت', 'ShoppingCart', 3),
  ('مستحضرات تجميل', 'Sparkles', 4),
  ('كانكاري', 'Store', 5);

-- ============ OTP CODES ============
CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
-- No policies: only the edge function (service role) accesses this table.

-- ============ PHONE AUTH ============
CREATE TABLE IF NOT EXISTS phone_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  email text NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE phone_auth ENABLE ROW LEVEL SECURITY;
-- No policies: only the edge function (service role) accesses this table.

CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);