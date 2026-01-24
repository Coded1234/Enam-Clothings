
-- SQL Script to add Admin User to Neon Database
-- Email: enamclothings@gmail.com
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
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Static UUID
  'Admin', 
  'User', 
  'enamclothings@gmail.com', 
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
