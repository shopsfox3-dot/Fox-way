-- Add email column to profiles and backfill from auth.users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Sync emails from auth.users into profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- Update handle_new_user trigger to always set email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.profiles (id, email, phone, first_name, last_name, wilaya_code, commune_id, shop_type_id, status, role)
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(nullif(meta->>'phone', ''), NEW.phone, '0000000000'),
    nullif(meta->>'first_name', ''),
    nullif(meta->>'last_name', ''),
    nullif(meta->>'wilaya_code', ''),
    nullif(meta->>'commune_id', '')::int,
    nullif(meta->>'shop_type_id', '')::int,
    'pending',
    'client'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$;
