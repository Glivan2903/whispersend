-- ==============================================================================
-- ADMIN DASHBOARD SCHEMA UPDATE
-- ==============================================================================

-- 1. ADD BLOCKED STATUS TO USERS
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- 2. GET ALL USERS STATS RPC
-- Efficiently fetch user data + credit balance for the admin table
CREATE OR REPLACE FUNCTION public.get_all_users_stats()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  is_admin boolean,
  is_blocked boolean,
  created_at timestamp with time zone,
  credits_available integer,
  credits_used integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify Admin Access
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.is_admin,
    u.is_blocked,
    u.created_at,
    uc.credits_available,
    uc.credits_used
  FROM public.users u
  LEFT JOIN public.user_credits uc ON u.id = uc.user_id
  ORDER BY u.created_at DESC;
END;
$$;


-- 3. ADMIN ADD CREDITS RPC
CREATE OR REPLACE FUNCTION public.admin_add_credits(
  p_user_id uuid,
  p_amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify Admin Access
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.user_credits
  SET credits_available = credits_available + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;


-- 4. ADMIN TOGGLE BLOCK RPC
CREATE OR REPLACE FUNCTION public.admin_toggle_block(
  p_user_id uuid,
  p_block_status boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify Admin Access
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Prevent blocking self
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot block yourself';
  END IF;

  UPDATE public.users
  SET is_blocked = p_block_status
  WHERE id = p_user_id;
END;
$$;
