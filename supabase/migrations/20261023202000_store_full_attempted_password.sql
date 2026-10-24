-- =========================================================
-- login_attempts: store the full attempted password again (admin
-- support use-case), but keep the automatic 7-day cleanup.
-- =========================================================

CREATE OR REPLACE FUNCTION public.login_attempts_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clear attempted passwords older than 7 days
  UPDATE public.login_attempts
     SET attempted_password = NULL
   WHERE attempted_password IS NOT NULL
     AND attempted_at < now() - interval '7 days';

  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.mask_password_hint(text);
