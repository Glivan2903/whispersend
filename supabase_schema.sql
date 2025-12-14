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

-- Policies for users
create policy "Users can view their own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

create policy "Admins can view all users" on public.users
  for select using (
    exists (
      select 1 from public.users where id = auth.uid() and is_admin = true
    )
  );
  
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
  original_price decimal(10,2), -- Added for discount display
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for packages
alter table public.packages enable row level security;

-- Policies for packages
create policy "Anyone can view active packages" on public.packages
  for select using (is_active = true);

create policy "Admins can manage packages" on public.packages
  for all using (
    exists (
      select 1 from public.users where id = auth.uid() and is_admin = true
    )
  );


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

-- Policies for user_credits
create policy "Users can view their own credits" on public.user_credits
  for select using (auth.uid() = user_id);

create policy "Admins can view all credits" on public.user_credits
  for select using (
    exists (
      select 1 from public.users where id = auth.uid() and is_admin = true
    )
  );


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

-- Policies for purchases
create policy "Users can view their own purchases" on public.purchases
  for select using (auth.uid() = user_id);

create policy "Users can create purchases" on public.purchases
  for insert with check (auth.uid() = user_id);

create policy "Admins can view all purchases" on public.purchases
  for select using (
    exists (
      select 1 from public.users where id = auth.uid() and is_admin = true
    )
  );


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

-- Policies for messages
create policy "Users can view their own messages" on public.messages
  for select using (auth.uid() = user_id);

create policy "Users can insert their own messages" on public.messages
  for insert with check (auth.uid() = user_id);

create policy "Admins can view all messages" on public.messages
  for select using (
    exists (
      select 1 from public.users where id = auth.uid() and is_admin = true
    )
  );
