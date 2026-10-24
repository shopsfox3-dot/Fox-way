-- =========================================================
-- login_attempts: keep the support feature (see why a client
-- failed to log in) without storing full passwords.
--   * Only a masked hint is stored, e.g. "ab••••12"
--   * Hints are cleared automatically after 7 days
-- =========================================================

CREATE OR REPLACE FUNCTION public.mask_password_hint(p text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  len int;
  masked text;
BEGIN
  IF p IS NULL OR p = '' THEN
    RETURN NULL;
  END IF;

  len := char_length(p);

  IF len >= 8 THEN
    masked := left(p, 2) || repeat('•', len - 4) || right(p, 2);
  ELSIF len >= 5 THEN
    masked := left(p, 1) || repeat('•', len - 2) || right(p, 1);
  ELSE
    masked := repeat('•', len);
  END IF;

  -- Make leading/trailing spaces visible (a common cause of failed logins)
  RETURN replace(masked, ' ', '␣');
END;
$$;

CREATE OR REPLACE FUNCTION public.login_attempts_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Never store the full password
  NEW.attempted_password := public.mask_password_hint(NEW.attempted_password);

  -- Clear hints older than 7 days
  UPDATE public.login_attempts
     SET attempted_password = NULL
   WHERE attempted_password IS NOT NULL
     AND attempted_at < now() - interval '7 days';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS login_attempts_before_insert ON public.login_attempts;
CREATE TRIGGER login_attempts_before_insert
  BEFORE INSERT ON public.login_attempts
  FOR EACH ROW EXECUTE FUNCTION public.login_attempts_before_insert();

-- Mask passwords that were already stored in full, and clear old ones
UPDATE public.login_attempts
   SET attempted_password = CASE
         WHEN attempted_at < now() - interval '7 days' THEN NULL
         ELSE public.mask_password_hint(attempted_password)
       END
 WHERE attempted_password IS NOT NULL;
