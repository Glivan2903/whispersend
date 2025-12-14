-- ==============================================================================
-- WHISPERSEND - FULL DATABASE SETUP
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS (extends auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text not null,
  full_name text,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for users
alter table public.users enable row level security;

-- Policies for users (Initial - will be updated by fix_rls_recursion)
create policy "Users can view their own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

-- Trigger to create public.users on auth.signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, is_admin)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', false);
  
  -- Also initialize user credits
  insert into public.user_credits (user_id, credits_available, credits_used)
  values (new.id, 0, 0);
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. PACKAGES
create table public.packages (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  quantity integer not null,
  price decimal(10,2) not null,
  original_price decimal(10,2),
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for packages
alter table public.packages enable row level security;

create policy "Anyone can view active packages" on public.packages
  for select using (is_active = true);


-- 3. USER_CREDITS
create table public.user_credits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  credits_available integer default 0 not null,
  credits_used integer default 0 not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for user_credits
alter table public.user_credits enable row level security;

create policy "Users can view their own credits" on public.user_credits
  for select using (auth.uid() = user_id);


-- 4. PURCHASES
create table public.purchases (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete set null not null,
  package_id uuid references public.packages(id) on delete set null,
  amount_paid decimal(10,2) not null,
  payment_status text check (payment_status in ('pending', 'completed', 'failed')) not null,
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for purchases
alter table public.purchases enable row level security;

create policy "Users can view their own purchases" on public.purchases
  for select using (auth.uid() = user_id);

create policy "Users can create purchases" on public.purchases
  for insert with check (auth.uid() = user_id);


-- 5. MESSAGES
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete set null not null,
  recipient_phone text not null,
  message_text text not null,
  sender_alias text,
  status text check (status in ('pending', 'sent', 'failed')) default 'pending',
  sent_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for messages
alter table public.messages enable row level security;

create policy "Users can view their own messages" on public.messages
  for select using (auth.uid() = user_id);

create policy "Users can insert their own messages" on public.messages
  for insert with check (auth.uid() = user_id);


-- ==============================================================================
-- FIXES AND RPCs
-- ==============================================================================

-- 1. FIX RLS RECURSION & ADMIN POLICIES
-- Create a secure function to check admin status without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Policies to use the new function
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
CREATE POLICY "Admins can manage packages" ON public.packages FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all credits" ON public.user_credits;
CREATE POLICY "Admins can view all credits" ON public.user_credits FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all purchases" ON public.purchases;
CREATE POLICY "Admins can view all purchases" ON public.purchases FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT USING (public.is_admin());


-- 2. SEND MESSAGE RPC (Secure & Transactional)
CREATE OR REPLACE FUNCTION public.send_new_message(
  p_recipient_phone text,
  p_message_text text,
  p_sender_alias text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_credits_available int;
  v_message_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  SELECT credits_available INTO v_credits_available
  FROM public.user_credits
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_credits_available IS NULL OR v_credits_available <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  INSERT INTO public.messages (user_id, recipient_phone, message_text, sender_alias, status)
  VALUES (v_user_id, p_recipient_phone, p_message_text, p_sender_alias, 'pending')
  RETURNING id INTO v_message_id;

  UPDATE public.user_credits
  SET credits_available = credits_available - 1,
      credits_used = credits_used + 1,
      updated_at = now()
  WHERE user_id = v_user_id;

  RETURN json_build_object(
    'success', true, 
    'message_id', v_message_id, 
    'new_credits', v_credits_available - 1
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- 3. CONFIRM MESSAGE SENT RPC
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
  SELECT user_id INTO v_user_id
  FROM public.messages
  WHERE id = p_message_id;

  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.messages
  SET status = 'sent',
      sent_at = now()
  WHERE id = p_message_id;
END;
$$;


-- 4. REFUND CREDIT RPC
CREATE OR REPLACE FUNCTION public.refund_message_credit(
  p_message_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.messages
  WHERE id = p_message_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.user_credits
  SET credits_available = credits_available + 1,
      credits_used = GREATEST(0, credits_used - 1),
      updated_at = now()
  WHERE user_id = v_user_id;

  UPDATE public.messages
  SET status = 'failed'
  WHERE id = p_message_id;
END;
$$;
