-- Update the get_all_users_stats function to include message counts
CREATE OR REPLACE FUNCTION public.get_all_users_stats()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  is_admin boolean,
  is_blocked boolean,
  created_at timestamp with time zone,
  credits_available integer,
  credits_used integer,
  messages_sent integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
    uc.credits_used,
    COALESCE(msg_counts.sent_count, 0)::integer as messages_sent
  FROM public.users u
  LEFT JOIN public.user_credits uc ON u.id = uc.user_id
  LEFT JOIN (
    SELECT user_id, count(*) as sent_count
    FROM public.messages
    WHERE status = 'sent'
    GROUP BY user_id
  ) msg_counts ON u.id = msg_counts.user_id
  ORDER BY u.created_at DESC;
END;
$$;
