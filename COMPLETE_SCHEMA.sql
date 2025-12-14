-- ==============================================================================
-- WHISPERSEND - COMPLETE DATABASE SCHEMA
-- ==============================================================================
-- This file contains the unified schema for the entire application.
-- Run this in the Supabase SQL Editor to set up the database from scratch.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 1. TABLES
-- ==============================================================================

-- 1.1 USERS (extends auth.users)
-- Stores extra profile data and admin/blocked status
create table public.users (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text not null,
  full_name text,
  is_admin boolean default false,
  is_blocked boolean default false,  -- Added for admin blocking feature
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1.2 PACKAGES
-- Defines available credit packages for purchase
create table public.packages (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  quantity integer not null,
  price decimal(10,2) not null,
  original_price decimal(10,2),
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1.3 USER_CREDITS
-- Tracks user's credit balance
create table public.user_credits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  credits_available integer default 0 not null,
  credits_used integer default 0 not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1.4 PURCHASES
-- Logs all purchase transactions
create table public.purchases (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete set null not null,
  package_id uuid references public.packages(id) on delete set null,
  amount_paid decimal(10,2) not null,
  payment_status text check (payment_status in ('pending', 'completed', 'failed')) not null,
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1.5 MESSAGES
-- Stores sent messages and their status
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

-- ==============================================================================
-- 2. ROW LEVEL SECURITY (RLS) & POLICIES
-- ==============================================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.packages enable row level security;
alter table public.user_credits enable row level security;
alter table public.purchases enable row level security;
alter table public.messages enable row level security;

-- Helper function to check Admin status securely (avoids recursion)
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

-- 2.1 USERS POLICIES
create policy "Users can view their own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

create policy "Admins can view all users" on public.users
  for select using (public.is_admin());

-- 2.2 PACKAGES POLICIES
create policy "Anyone can view active packages" on public.packages
  for select using (is_active = true);

create policy "Admins can manage packages" on public.packages
  for all using (public.is_admin());

-- 2.3 USER_CREDITS POLICIES
create policy "Users can view their own credits" on public.user_credits
  for select using (auth.uid() = user_id);

create policy "Admins can view all credits" on public.user_credits
  for select using (public.is_admin());

-- 2.4 PURCHASES POLICIES
create policy "Users can view their own purchases" on public.purchases
  for select using (auth.uid() = user_id);

create policy "Users can create purchases" on public.purchases
  for insert with check (auth.uid() = user_id);

create policy "Admins can view all purchases" on public.purchases
  for select using (public.is_admin());

-- 2.5 MESSAGES POLICIES
create policy "Users can view their own messages" on public.messages
  for select using (auth.uid() = user_id);

create policy "Users can insert their own messages" on public.messages
  for insert with check (auth.uid() = user_id);

create policy "Admins can view all messages" on public.messages
  for select using (public.is_admin());


-- ==============================================================================
-- 3. TRIGGERS
-- ==============================================================================

-- Trigger to create public.users and user_credits on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, is_admin)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', false);
  
  -- Initialize user credits
  insert into public.user_credits (user_id, credits_available, credits_used)
  values (new.id, 0, 0);
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==============================================================================
-- 4. RPC FUNCTIONS (Business Logic)
-- ==============================================================================

-- 4.1 SEND MESSAGE (Transactional: Deducts credit and creates message)
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

  -- Lock rows for update to prevent race conditions
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


-- 4.2 CONFIRM MESSAGE SENT
-- Called by client/webhook when message is successfully sent
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


-- 4.3 REFUND CREDIT
-- Refunds credit if message sending fails
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


-- 4.4 GET ALL USERS STATS (Admin Only)
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


-- 4.5 ADMIN ADD CREDITS (Admin Only)
CREATE OR REPLACE FUNCTION public.admin_add_credits(
  p_user_id uuid,
  p_amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.user_credits
  SET credits_available = credits_available + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;


-- 4.6 ADMIN TOGGLE BLOCK (Admin Only)
CREATE OR REPLACE FUNCTION public.admin_toggle_block(
  p_user_id uuid,
  p_block_status boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
