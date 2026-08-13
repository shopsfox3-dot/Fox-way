-- Create pricing by shop type table
CREATE TABLE IF NOT EXISTS product_shop_type_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shop_type_id int NOT NULL REFERENCES shop_types(id) ON DELETE CASCADE,
  price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (product_id, shop_type_id)
);

-- Enable RLS
ALTER TABLE product_shop_type_prices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "public_read_product_shop_type_prices" ON product_shop_type_prices;
CREATE POLICY "public_read_product_shop_type_prices" ON product_shop_type_prices
  FOR SELECT TO anon, authenticated USING (true);

-- Seed Toothbrush product under 'عناية شخصية' category
DO $$
DECLARE
  cat_id uuid;
  prod_id uuid;
  pharmacy_id int;
  supermarket_id int;
BEGIN
  SELECT id INTO cat_id FROM categories WHERE name = 'عناية شخصية' LIMIT 1;
  
  IF cat_id IS NOT NULL THEN
    -- Insert toothbrush if it doesn't exist
    INSERT INTO products (category_id, name, description, price, unit, stock, sort_order)
    VALUES (cat_id, 'فرشاة أسنان', 'فرشاة أسنان ناعمة للعناية اليومية', 150.00, 'قطعة', 120, 5)
    ON CONFLICT DO NOTHING;
    
    -- Get the product ID
    SELECT id INTO prod_id FROM products WHERE name = 'فرشاة أسنان' AND category_id = cat_id LIMIT 1;
    
    -- Get shop type IDs
    SELECT id INTO pharmacy_id FROM shop_types WHERE name = 'صيدلية' LIMIT 1;
    SELECT id INTO supermarket_id FROM shop_types WHERE name = 'سوبر ماركت' LIMIT 1;
    
    -- Insert custom prices
    IF prod_id IS NOT NULL THEN
      IF pharmacy_id IS NOT NULL THEN
        INSERT INTO product_shop_type_prices (product_id, shop_type_id, price)
        VALUES (prod_id, pharmacy_id, 175.00)
        ON CONFLICT (product_id, shop_type_id) DO UPDATE SET price = EXCLUDED.price;
      END IF;
      
      IF supermarket_id IS NOT NULL THEN
        INSERT INTO product_shop_type_prices (product_id, shop_type_id, price)
        VALUES (prod_id, supermarket_id, 130.00)
        ON CONFLICT (product_id, shop_type_id) DO UPDATE SET price = EXCLUDED.price;
      END IF;
    END IF;
  END IF;
END $$;
