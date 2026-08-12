/*
# Add Shop Types and Shop Type on Profiles

## Changes
1. New table `shop_types` — reference list of client shop categories
   (pharmacy, kiosk, supermarket, cosmetics, etc.)
2. New column `shop_type_id` on `profiles` — FK to shop_types, nullable.
3. Seed shop_types with common Algerian retail shop categories.

## Security
- `shop_types`: readable by anon+authenticated (public reference data).
- `profiles` policies unchanged (owner-scoped).
*/

-- ============ SHOP TYPES ============
CREATE TABLE IF NOT EXISTS shop_types (
  id serial PRIMARY KEY,
  name text NOT NULL,
  icon text,
  sort_order int DEFAULT 0
);

ALTER TABLE shop_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_shop_types" ON shop_types;
CREATE POLICY "public_read_shop_types" ON shop_types FOR SELECT
  TO anon, authenticated USING (true);

INSERT INTO shop_types (name, icon, sort_order) VALUES
  ('صيدلية', 'Pill', 1),
  ('كيوسك', 'Newspaper', 2),
  ('سوبر ماركت', 'ShoppingCart', 3),
  ('مستحضرات تجميل', 'Sparkles', 4),
  ('كانكاري', 'Store', 5),
  ('ملحمة', 'Beef', 6),
  ('مخبزة', 'Croissant', 7),
  ('مقهى', 'Coffee', 8),
  ('مطعم', 'UtensilsCrossed', 9),
  ('متجر متنوع', 'Package', 10)
ON CONFLICT DO NOTHING;

-- ============ ADD shop_type_id TO profiles ============
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'shop_type_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN shop_type_id int REFERENCES shop_types(id);
  END IF;
END $$;