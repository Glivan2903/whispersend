-- Create a secure function to handle message sending and credit deduction transactionally
CREATE OR REPLACE FUNCTION public.send_new_message(
  p_recipient_phone text,
  p_message_text text,
  p_sender_alias text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres), bypassing RLS for updates
AS $$
DECLARE
  v_user_id uuid;
  v_credits_available int;
  v_message_id uuid;
BEGIN
  -- Get current user ID (from Supabase Auth context)
  v_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Check available credits and lock the row for update to prevent race conditions
  SELECT credits_available INTO v_credits_available
  FROM public.user_credits
  WHERE user_id = v_user_id
  FOR UPDATE;

  -- Validate credits
  IF v_credits_available IS NULL OR v_credits_available <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  -- Insert the message
  INSERT INTO public.messages (user_id, recipient_phone, message_text, sender_alias, status)
  VALUES (v_user_id, p_recipient_phone, p_message_text, p_sender_alias, 'pending')
  RETURNING id INTO v_message_id;

  -- Deduct credit
  UPDATE public.user_credits
  SET credits_available = credits_available - 1,
      credits_used = credits_used + 1,
      updated_at = now()
  WHERE user_id = v_user_id;

  -- Return success and new credit balance
  RETURN json_build_object(
    'success', true, 
    'message_id', v_message_id, 
    'new_credits', v_credits_available - 1
  );

EXCEPTION WHEN OTHERS THEN
  -- Handle any unexpected errors
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
