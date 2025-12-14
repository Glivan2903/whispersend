-- Function to confirm message was sent successfully
CREATE OR REPLACE FUNCTION public.confirm_message_sent(
  p_message_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Verify ownership
  SELECT user_id INTO v_user_id
  FROM public.messages
  WHERE id = p_message_id;

  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update status
  UPDATE public.messages
  SET status = 'sent',
      sent_at = now()
  WHERE id = p_message_id;
END;
$$;
