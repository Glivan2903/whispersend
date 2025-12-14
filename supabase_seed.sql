-- Seed Data

-- Insert Packages
INSERT INTO public.packages (name, quantity, price, original_price, is_active)
VALUES 
  ('Mensagem Única', 1, 2.50, null, true),
  ('Pacote 5', 5, 11.90, 12.50, true),
  ('Pacote 10', 10, 22.90, 25.00, true);

-- Note: Users need to be created via Auth API to exist in auth.users first.
-- This seed assumes you might create them manually or via script.
-- But we can insert dummy data if we had auth ids. 
-- Since we cannot easily seed auth.users from SQL without knowing the internal hashing,
-- We will skip seeding users here and rely on the app usage.
