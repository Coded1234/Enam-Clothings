
-- SQL Script to add Admin User to Neon Database
-- Email: diamondauragallery@gmail.com
-- Password: DiamondAdmin@26!

INSERT INTO users (
  id,
  first_name, 
  last_name, 
  email, 
  password, 
  role, 
  is_active, 
  email_verified, 
  email_verified_at, 
  created_at, 
  updated_at
) VALUES (
  gen_random_uuid(),
  'Admin', 
  'User', 
  'diamondauragallery@gmail.com',
  '$2a$10$qCxgry24Zj81FUnOqABjHeKOxnVqdaLgPl2yU6ERcb31Az9oWGM8e', -- Hashed 'DiamondAdmin@26!'
  'admin',
  true, 
  true, 
  NOW(), 
  NOW(), 
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  password = '$2a$10$qCxgry24Zj81FUnOqABjHeKOxnVqdaLgPl2yU6ERcb31Az9oWGM8e',
  is_active = true,
  email_verified = true,
  updated_at = NOW();
