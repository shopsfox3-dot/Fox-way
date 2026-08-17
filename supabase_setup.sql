-- =========================================================
-- FOX WAY COMPLETE SUPABASE SETUP SCRIPT
-- انسخ هذا الملف بالكامل والصقه في SQL Editor في Supabase ثم اضغط Run
-- =========================================================

-- 1. جدول محاولات الدخول الفاشلة (سجل الأمان)
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  attempted_at timestamptz DEFAULT now(),
  attempted_password text,
  ip_address text,
  user_agent text,
  error_message text,
  status text NOT NULL DEFAULT 'failed'
);
ALTER TABLE public.login_attempts ADD COLUMN IF NOT EXISTS attempted_password text;

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_login_attempts" ON public.login_attempts;
CREATE POLICY "anon_insert_login_attempts" ON public.login_attempts
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_login_attempts" ON public.login_attempts;
CREATE POLICY "admin_read_login_attempts" ON public.login_attempts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "admin_delete_login_attempts" ON public.login_attempts;
CREATE POLICY "admin_delete_login_attempts" ON public.login_attempts
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 2. سياسات صلاحيات الأدمن على جدول profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'client';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shop_type_id int;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text;

DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;
CREATE POLICY "admin_read_all_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles admin_p
      WHERE admin_p.id = auth.uid()
      AND admin_p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "admin_update_all_profiles" ON public.profiles;
CREATE POLICY "admin_update_all_profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles admin_p
      WHERE admin_p.id = auth.uid()
      AND admin_p.role = 'admin'
    )
  );

-- 3. جدول فئات المحلات التجارية (Shop Types)
CREATE TABLE IF NOT EXISTS public.shop_types (
  id serial PRIMARY KEY,
  name text NOT NULL,
  icon text,
  sort_order int DEFAULT 0
);

ALTER TABLE public.shop_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_shop_types" ON public.shop_types;
CREATE POLICY "public_read_shop_types" ON public.shop_types FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.shop_types (name, icon, sort_order) VALUES
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

-- 4. بيانات الأقسام والمنتجات التجريبية (Categories & Products)
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text,
  sort_order int DEFAULT 0
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_categories" ON public.categories;
CREATE POLICY "public_read_categories" ON public.categories FOR SELECT
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.status = 'approved' OR profiles.role = 'admin')
    )
  );

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'قطعة',
  stock int NOT NULL DEFAULT 0,
  image_url text,
  sort_order int DEFAULT 0,
  market_unavailable boolean DEFAULT false
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_products" ON public.products;
CREATE POLICY "public_read_products" ON public.products FOR SELECT
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.status = 'approved' OR profiles.role = 'admin')
    )
  );

-- إدخال الأقسام
INSERT INTO public.categories (name, icon, sort_order) VALUES
  ('مواد غذائية', 'ShoppingBasket', 1),
  ('مشروبات', 'Coffee', 2),
  ('منتجات الأطفال', 'Baby', 3),
  ('منظفات', 'Sparkles', 4),
  ('عناية شخصية', 'HeartHandshake', 5),
  ('متجر متعدد', 'Package', 6)
ON CONFLICT DO NOTHING;

-- إدخال المنتجات
INSERT INTO public.products (category_id, name, description, price, unit, stock, sort_order)
SELECT c.id, v.name, v.description, v.price::numeric, v.unit, v.stock::int, v.sort_order::int
FROM (VALUES
  ('مواد غذائية', 'زيت المائدة 5 لتر', 'زيت نباتي مكرر للتعبئة', '850.00', 'علبة', '200', '1'),
  ('مواد غذائية', 'سميد متوسط 5 كغ', 'سميد من القمح الصلب', '450.00', 'كيس', '150', '2'),
  ('مواد غذائية', 'طحين فاخر 25 كغ', 'طحين أبيض فاخر للخبز', '1200.00', 'كيس', '100', '3'),
  ('مواد غذائية', 'سكر أبيض 5 كغ', 'سكر مكرر حبيبات', '375.00', 'كيس', '300', '4'),
  ('مواد غذائية', 'معكرونة 500 غ', 'معكرونة من القمح الصلب', '90.00', 'علبة', '500', '5'),
  ('مواد غذائية', 'أرز مصري 5 كغ', 'أرز أبيض مصري قصير الحبة', '600.00', 'كيس', '200', '6'),
  ('مشروبات', 'ماء معدني 1.5 لتر (12 حبة)', 'علبة ماء معدني طبيعي', '180.00', 'علبة', '400', '1'),
  ('مشروبات', 'عصير مشكل 1 لتر', 'عصير فواكه مشكل طبيعي', '120.00', 'علبة', '250', '2'),
  ('مشروبات', 'مشروب غازي 1 لتر (12 حبة)', 'مشروب غازي منعش', '720.00', 'علبة', '180', '3'),
  ('مشروبات', 'قهوة مطحونة 250 غ', 'قهوة عربية محمصة', '320.00', 'علبة', '120', '4'),
  ('منتجات الأطفال', 'حفاضات حجم 4 (60 قطعة)', 'حفاضات أطفال قطن ناعم', '750.00', 'علبة', '100', '1'),
  ('منتجات الأطفال', 'حليب أطفال 400 غ', 'حليب صناعي للأطفال', '680.00', 'علبة', '90', '2'),
  ('منتجات الأطفال', 'مهلبية أطفال 2x100 غ', 'مهلبية فواكه للأطفال', '85.00', 'علبة', '200', '3'),
  ('منظفات', 'سائل جلي 1 لتر', 'سائل غسيل الصحون المركز', '180.00', 'علبة', '300', '1'),
  ('منظفات', 'مسحوق غسيل 5 كغ', 'مسحوق غسيل أوتوماتيك', '950.00', 'كيس', '120', '2'),
  ('منظفات', 'مبيض 2 لتر', 'مبيض مطهر للأسطح', '160.00', 'علبة', '200', '3'),
  ('منظفات', 'منظف أرضيات 2 لتر', 'منظف ومعطر للأرضيات', '220.00', 'علبة', '180', '4'),
  ('عناية شخصية', 'شامبو 400 مل', 'شامبو لجميع أنواع الشعر', '250.00', 'علبة', '150', '1'),
  ('عناية شخصية', 'صابون 125 غ (12 قطعة)', 'صابون تواليت معطر', '360.00', 'علبة', '250', '2'),
  ('عناية شخصية', 'معجون أسنان 75 مل', 'معجون أسنان بالفلور', '110.00', 'علبة', '300', '3'),
  ('عناية شخصية', 'مناديل ورقية (10 علب)', 'مناديل ورقية ناعمة', '450.00', 'علبة', '200', '4'),
  ('متجر متعدد', 'ورق طباخة (10 لفات)', 'ورق ألمنيوم للطبخ', '300.00', 'علبة', '150', '1'),
  ('متجر متعدد', 'أكياس بلاستيكية (500 قطعة)', 'أكياس متعددة الأحجام', '200.00', 'علبة', '300', '2'),
  ('متجر متعدد', 'شمع شموع (24 قطعة)', 'شموع طوارئ طويلة الأمد', '180.00', 'علبة', '200', '3')
) AS v(cat_name, name, description, price, unit, stock, sort_order)
JOIN public.categories c ON c.name = v.cat_name
ON CONFLICT DO NOTHING;

-- =========================================================
-- 5. جدول مسودة السلة (Cart Drafts) - يحفظ سلة كل عميل بحسابه
-- يضمن ظهور السلة في أي جهاز (هاتف، تابلت، حاسوب) بنفس الحساب
-- =========================================================
CREATE TABLE IF NOT EXISTS public.cart_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.cart_drafts ENABLE ROW LEVEL SECURITY;

-- العميل يقدر يقرأ سلته فقط
DROP POLICY IF EXISTS "user_read_own_cart" ON public.cart_drafts;
CREATE POLICY "user_read_own_cart" ON public.cart_drafts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- العميل يقدر يكتب/يعدّل سلته فقط
DROP POLICY IF EXISTS "user_upsert_own_cart" ON public.cart_drafts;
CREATE POLICY "user_upsert_own_cart" ON public.cart_drafts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_update_own_cart" ON public.cart_drafts;
CREATE POLICY "user_update_own_cart" ON public.cart_drafts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- العميل يقدر يمسح سلته عند إرسال الطلب
DROP POLICY IF EXISTS "user_delete_own_cart" ON public.cart_drafts;
CREATE POLICY "user_delete_own_cart" ON public.cart_drafts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

