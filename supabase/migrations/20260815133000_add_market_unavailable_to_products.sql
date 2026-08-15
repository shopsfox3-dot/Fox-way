-- Add market_unavailable column to products table
-- This column was referenced in the TypeScript types but missing from the database schema.
-- When true, the product is not available on the open market (wholesale-only item).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'market_unavailable'
  ) THEN
    ALTER TABLE products ADD COLUMN market_unavailable boolean NOT NULL DEFAULT false;
  END IF;
END $$;
