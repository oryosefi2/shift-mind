-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema (for Supabase Auth)
CREATE SCHEMA IF NOT EXISTS auth;

-- Create basic Supabase roles
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE  rolname = 'anon') THEN
      CREATE ROLE anon nologin noinherit;
   END IF;
   
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE  rolname = 'authenticated') THEN
      CREATE ROLE authenticated nologin noinherit;
   END IF;
   
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE  rolname = 'service_role') THEN
      CREATE ROLE service_role nologin noinherit bypassrls;
   END IF;
   
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE  rolname = 'authenticator') THEN
      CREATE ROLE authenticator noinherit login password 'postgres';
   END IF;
   
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE  rolname = 'supabase_auth_admin') THEN
      CREATE ROLE supabase_auth_admin noinherit createrole login password 'postgres';
   END IF;
END
$do$;

-- Grant permissions
GRANT anon, authenticated, service_role TO authenticator;
GRANT ALL PRIVILEGES ON DATABASE postgres TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;

-- Create our ShiftMind tables
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'Asia/Jerusalem',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hourly_rate DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (we'll improve these later)
CREATE POLICY "Allow all for service_role" ON businesses FOR ALL TO service_role USING (true);
CREATE POLICY "Allow all for service_role" ON employees FOR ALL TO service_role USING (true);

-- Grant permissions to roles
GRANT ALL ON businesses TO anon, authenticated, service_role;
GRANT ALL ON employees TO anon, authenticated, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Insert sample data
INSERT INTO businesses (id, name, industry, timezone) VALUES 
('11111111-1111-1111-1111-111111111111', 'בית קפה דוגמה', 'food_service', 'Asia/Jerusalem')
ON CONFLICT (id) DO NOTHING;

INSERT INTO employees (id, business_id, first_name, last_name, email, hourly_rate) VALUES 
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'שרה', 'כהן', 'sarah@example.com', 35.50),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'יוסי', 'לוי', 'yossi@example.com', 28.00)
ON CONFLICT (id) DO NOTHING;
