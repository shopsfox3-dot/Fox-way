-- Add is_activated column to profiles to track if an account was ever approved by admin
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_activated boolean NOT NULL DEFAULT false;

-- Backfill existing approved profiles as is_activated = true
UPDATE public.profiles SET is_activated = true WHERE status = 'approved';

-- Trigger to automatically mark is_activated = true whenever status is approved
CREATE OR REPLACE FUNCTION public.handle_profile_activation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    NEW.is_activated := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_handle_profile_activation ON public.profiles;
CREATE TRIGGER tr_handle_profile_activation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_activation();
