-- Add terms_accepted column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false;

-- Create RPC function to accept terms
CREATE OR REPLACE FUNCTION public.accept_terms()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET terms_accepted = true
  WHERE id = auth.uid();
END;
$$;
