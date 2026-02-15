
-- SQL Script to add Admin User to Neon Database
-- Email: thefashiongallery264@gmail.com
-- Password: Admin@1234

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
  'thefashiongallery264@gmail.com', 
  '$2a$10$3QF5GN5Mni1hl2TCrR7Ow.7xMUp53mXjvBgrfSKrARYayEYQsk1cu', -- Hashed 'Admin@1234'
  'admin', 
  true, 
  true, 
  NOW(), 
  NOW(), 
  NOW()
) ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  password = '$2a$10$3QF5GN5Mni1hl2TCrR7Ow.7xMUp53mXjvBgrfSKrARYayEYQsk1cu',
  is_active = true,
  email_verified = true,
  updated_at = NOW();
