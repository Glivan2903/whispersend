-- Fix for Infinite Recursion in RLS Policies

-- 1. Create a secure function to check admin status without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  -- Security Definer allows this function to run with privileges of the creator
  -- bypassing the RLS on the users table for this specific check
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Policies to use the new function

-- Users Table
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_admin());

-- Packages Table
DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
CREATE POLICY "Admins can manage packages" ON public.packages
  FOR ALL USING (public.is_admin());

-- User Credits Table
DROP POLICY IF EXISTS "Admins can view all credits" ON public.user_credits;
CREATE POLICY "Admins can view all credits" ON public.user_credits
  FOR SELECT USING (public.is_admin());

-- Purchases Table
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.purchases;
CREATE POLICY "Admins can view all purchases" ON public.purchases
  FOR SELECT USING (public.is_admin());

-- Messages Table
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages" ON public.messages
  FOR SELECT USING (public.is_admin());
