-- =========================================================
-- Security hardening: remove the need for the service_role key
-- in the browser and close wide-open RLS policies.
-- =========================================================

-- 1. Helper: is the current user an admin?
--    SECURITY DEFINER avoids infinite recursion when used inside
--    policies on the profiles table itself.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 2. profiles: previously anyone (even anonymous) could read every
--    profile and UPDATE any row (including role = 'admin').
DROP POLICY IF EXISTS "Public profiles select" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_update_all_profiles" ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- 3. Only admins may change role / status. Regular users can still
--    edit their own name, phone, etc.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce for requests coming from the public API (anon / authenticated).
  -- Internal calls (auth triggers, SQL editor, service_role) are not restricted.
  IF coalesce(auth.role(), '') NOT IN ('anon', 'authenticated') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role := 'client';
    NEW.status := 'pending';
  ELSIF NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Only administrators can change role or status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER protect_profile_privileged_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- 4. New users start as 'pending' (was 'approved', which bypassed the
--    manual approval flow). Registration data is read from the signUp
--    metadata so it works even when no session is returned.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.profiles (id, phone, first_name, last_name, wilaya_code, commune_id, shop_type_id, status, role)
  VALUES (
    NEW.id,
    coalesce(nullif(meta->>'phone', ''), NEW.phone, '0000000000'),
    nullif(meta->>'first_name', ''),
    nullif(meta->>'last_name', ''),
    nullif(meta->>'wilaya_code', ''),
    nullif(meta->>'commune_id', '')::int,
    nullif(meta->>'shop_type_id', '')::int,
    'pending',
    'client'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 5. login_attempts: admins can delete (previously required service_role).
DROP POLICY IF EXISTS "admin_delete_login_attempts" ON public.login_attempts;
CREATE POLICY "admin_delete_login_attempts" ON public.login_attempts
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 6. products: admins can update (market availability, pack info).
DROP POLICY IF EXISTS "admin_update_products" ON public.products;
CREATE POLICY "admin_update_products" ON public.products
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Per-business-type prices were readable by anonymous visitors.
DROP POLICY IF EXISTS "public_read_product_shop_type_prices" ON public.product_shop_type_prices;
CREATE POLICY "approved_read_product_shop_type_prices" ON public.product_shop_type_prices
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.status = 'approved'
    )
  );

-- 8. wilayas / communes: anyone could insert or modify reference data.
DROP POLICY IF EXISTS "Public wilayas insert" ON public.wilayas;
DROP POLICY IF EXISTS "Public wilayas update" ON public.wilayas;
DROP POLICY IF EXISTS "Public communes insert" ON public.communes;
