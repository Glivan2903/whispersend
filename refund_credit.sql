-- Create a secure function to refund credits in case of failure
CREATE OR REPLACE FUNCTION public.refund_message_credit(
  p_message_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_details text;
BEGIN
  -- Get user ID from the message to ensure we refund the right person
  SELECT user_id INTO v_user_id
  FROM public.messages
  WHERE id = p_message_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  
  -- Verify the user calling this is the owner of the message (security check)
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Refund credit
  UPDATE public.user_credits
  SET credits_available = credits_available + 1,
      credits_used = GREATEST(0, credits_used - 1),
      updated_at = now()
  WHERE user_id = v_user_id;

  -- Update message status to failed
  UPDATE public.messages
  SET status = 'failed'
  WHERE id = p_message_id;
END;
$$;
