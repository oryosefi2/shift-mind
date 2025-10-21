-- Add business_id to user metadata (simulate JWT claims)
-- This will be used to demonstrate business_id extraction from JWT

-- Update existing test users to have business_id in metadata
UPDATE auth.users 
SET user_metadata = COALESCE(user_metadata, '{}'::jsonb) || '{"business_id": "11111111-1111-1111-1111-111111111111"}'::jsonb
WHERE email IN ('test@example.com', 'admin@example.com');

-- Insert test user with business_id if not exists
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, user_metadata)
SELECT 
  '44444444-4444-4444-4444-444444444444'::uuid,
  'demo@shiftmind.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"business_id": "11111111-1111-1111-1111-111111111111"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'demo@shiftmind.com'
);
