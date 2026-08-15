const https = require('https');

const token = 'sbp_bf8d5ec81ad603d8752211c92c51dba42f992995';
const projectRef = 'buldwdvngkglkwvwttzk';

const sql = `
-- 1. Create shop_types table
CREATE TABLE IF NOT EXISTS public.shop_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INT DEFAULT 0
);

-- 2. Create wilayas table
CREATE TABLE IF NOT EXISTS public.wilayas (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  sort_order INT DEFAULT 0
);

-- 3. Create communes table
CREATE TABLE IF NOT EXISTS public.communes (
  id SERIAL PRIMARY KEY,
  wilaya_code TEXT REFERENCES public.wilayas(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT
);

-- 4. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  wilaya_code TEXT,
  commune_id INT,
  shop_type_id INT,
  status TEXT DEFAULT 'pending',
  role TEXT DEFAULT 'merchant',
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & policies
ALTER TABLE public.shop_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wilayas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Read policies for all
DROP POLICY IF EXISTS "Public shop_types select" ON public.shop_types;
CREATE POLICY "Public shop_types select" ON public.shop_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public wilayas select" ON public.wilayas;
CREATE POLICY "Public wilayas select" ON public.wilayas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public communes select" ON public.communes;
CREATE POLICY "Public communes select" ON public.communes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public profiles select" ON public.profiles;
CREATE POLICY "Public profiles select" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (true);

-- Insert initial shop types if empty
INSERT INTO public.shop_types (id, name, icon, sort_order) VALUES
(1, 'صيدلية', 'Pill', 1),
(2, 'كيوسك', 'Newspaper', 2),
(3, 'سوبر ماركت', 'ShoppingCart', 3),
(4, 'مستحضرات تجميل', 'Sparkles', 4),
(5, 'كانكاري', 'Store', 5)
ON CONFLICT (id) DO NOTHING;
`;

const postData = JSON.stringify({ query: sql });

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${projectRef}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e);
});

req.write(postData);
req.end();
