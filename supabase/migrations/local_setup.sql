-- Copilot: enable row level security and sample policy per table using auth.jwt() ->> 'business_id'

-- Local PostgreSQL Migration for ShiftMind
-- Created: 2025-10-20
-- Description: Core business scheduling schema for local development

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- MOCK AUTH SCHEMA (for local development)
-- ============================================================================

-- Create auth schema to simulate Supabase
CREATE SCHEMA IF NOT EXISTS auth;

-- Create users table to simulate Supabase auth
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mock auth functions
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
BEGIN
  -- For local development, return a mock user ID
  -- In production, this would return the actual authenticated user ID
  RETURN '00000000-0000-0000-0000-000000000000'::UUID;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS JSONB AS $$
BEGIN
  -- Mock JWT for local development
  RETURN '{"business_id": "11111111-1111-1111-1111-111111111111"}'::JSONB;
END;
$$ LANGUAGE plpgsql;

-- Insert a mock user for testing
INSERT INTO auth.users (id, email) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- CORE BUSINESS TABLES
-- ============================================================================

-- Businesses table (tenant isolation root)
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    industry TEXT,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    address JSONB,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User business memberships for multi-tenant access control
CREATE TABLE IF NOT EXISTS user_business_memberships (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, business_id)
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    hire_date DATE,
    hourly_rate DECIMAL(10,2),
    role TEXT NOT NULL DEFAULT 'employee',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    skills JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, email)
);

-- Employee availability
CREATE TABLE IF NOT EXISTS availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    effective_from DATE,
    effective_until DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    -- Removed CHECK (start_time < end_time) to allow overnight spans
);

-- Budget management
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    budget_type TEXT NOT NULL CHECK (budget_type IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    department TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (period_start < period_end)
);

-- Historical demand data
CREATE TABLE IF NOT EXISTS demand_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
    demand_value DECIMAL(10,2) NOT NULL CHECK (demand_value >= 0),
    demand_type TEXT NOT NULL DEFAULT 'customers', -- customers, sales, transactions, etc.
    department TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seasonal demand profiles
CREATE TABLE IF NOT EXISTS seasonal_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    profile_type TEXT NOT NULL CHECK (profile_type IN ('weekly', 'monthly', 'seasonal', 'holiday')),
    multiplier_data JSONB NOT NULL, -- JSON array of multipliers by time period
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business-specific seasonal overrides
CREATE TABLE IF NOT EXISTS business_seasonal_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    seasonal_profile_id UUID NOT NULL REFERENCES seasonal_profiles(id) ON DELETE CASCADE,
    override_date DATE NOT NULL,
    multiplier DECIMAL(5,3) NOT NULL CHECK (multiplier >= 0),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, seasonal_profile_id, override_date)
);

-- Calendar overrides (holidays, special events)
CREATE TABLE IF NOT EXISTS calendar_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    override_type TEXT NOT NULL CHECK (override_type IN ('holiday', 'closure', 'special_hours', 'high_demand')),
    multiplier DECIMAL(5,3) CHECK (multiplier >= 0),
    custom_hours JSONB, -- {start_time: "09:00", end_time: "17:00"}
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business events (sales, promotions, etc.)
CREATE TABLE IF NOT EXISTS business_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_impact DECIMAL(5,3), -- Expected demand multiplier
    description TEXT,
    location TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurrence_pattern JSONB, -- For recurring events
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (start_date < end_date)
);

-- Schedules (weekly schedule templates)
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    week_start_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    total_hours DECIMAL(8,2) CHECK (total_hours >= 0),
    total_cost DECIMAL(12,2) CHECK (total_cost >= 0),
    created_by UUID REFERENCES employees(id),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual shifts
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INTEGER DEFAULT 0 CHECK (break_minutes >= 0),
    role TEXT,
    department TEXT,
    hourly_rate DECIMAL(10,2),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    -- Removed CHECK (start_time < end_time) to allow overnight spans
);

-- System alerts and notifications
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('budget_exceeded', 'understaffed', 'overstaffed', 'employee_unavailable', 'system')),
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_entity_type TEXT, -- 'schedule', 'shift', 'employee', etc.
    related_entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data import tracking
CREATE TABLE IF NOT EXISTS imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    import_type TEXT NOT NULL CHECK (import_type IN ('employees', 'demand_history', 'availability', 'schedules')),
    filename TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_rows INTEGER,
    processed_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    error_details JSONB,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Demand forecast cache
CREATE TABLE IF NOT EXISTS forecast_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    cache_key TEXT NOT NULL,
    forecast_date DATE NOT NULL,
    hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
    forecasted_demand DECIMAL(10,2) NOT NULL CHECK (forecasted_demand >= 0),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    model_version TEXT,
    parameters_used JSONB,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, cache_key, forecast_date, hour_of_day)
);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get business_id from JWT
CREATE OR REPLACE FUNCTION public.get_business_id() RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt() ->> 'business_id',
    (auth.jwt() -> 'app_metadata' ->> 'business_id')
  )::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user has access to a business
CREATE OR REPLACE FUNCTION public.user_has_business_access(target_business_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  -- Check JWT claim first
  IF public.get_business_id() = target_business_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check membership table
  RETURN EXISTS (
    SELECT 1 FROM user_business_memberships 
    WHERE user_id = auth.uid() 
    AND business_id = target_business_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add business creator as owner
CREATE OR REPLACE FUNCTION add_business_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the creator as owner in user_business_memberships
  INSERT INTO user_business_memberships (user_id, business_id, role)
  VALUES (auth.uid(), NEW.id, 'owner')
  ON CONFLICT (user_id, business_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If auth.uid() is null or other error, continue without failing
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_user_business_memberships_user_id ON user_business_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_business_memberships_business_id ON user_business_memberships(business_id);
CREATE INDEX IF NOT EXISTS idx_employees_business_id ON employees(business_id);
CREATE INDEX IF NOT EXISTS idx_availability_business_id ON availability(business_id);
CREATE INDEX IF NOT EXISTS idx_availability_employee_id ON availability(employee_id);
CREATE INDEX IF NOT EXISTS idx_budgets_business_id ON budgets(business_id);
CREATE INDEX IF NOT EXISTS idx_demand_history_business_id ON demand_history(business_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_profiles_business_id ON seasonal_profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_business_seasonal_overrides_business_id ON business_seasonal_overrides(business_id);
CREATE INDEX IF NOT EXISTS idx_business_seasonal_overrides_profile_id ON business_seasonal_overrides(seasonal_profile_id);
CREATE INDEX IF NOT EXISTS idx_calendar_overrides_business_id ON calendar_overrides(business_id);
CREATE INDEX IF NOT EXISTS idx_business_events_business_id ON business_events(business_id);
CREATE INDEX IF NOT EXISTS idx_schedules_business_id ON schedules(business_id);
CREATE INDEX IF NOT EXISTS idx_schedules_created_by ON schedules(created_by);
CREATE INDEX IF NOT EXISTS idx_shifts_business_id ON shifts(business_id);
CREATE INDEX IF NOT EXISTS idx_shifts_schedule_id ON shifts(schedule_id);
CREATE INDEX IF NOT EXISTS idx_shifts_employee_id ON shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_alerts_business_id ON alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_imports_business_id ON imports(business_id);
CREATE INDEX IF NOT EXISTS idx_imports_created_by ON imports(created_by);
CREATE INDEX IF NOT EXISTS idx_forecast_cache_business_id ON forecast_cache(business_id);

-- Time-based indexes
CREATE INDEX IF NOT EXISTS idx_availability_day_of_week ON availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_demand_history_date ON demand_history(date);
CREATE INDEX IF NOT EXISTS idx_demand_history_date_hour ON demand_history(date, hour_of_day);
CREATE INDEX IF NOT EXISTS idx_business_seasonal_overrides_date ON business_seasonal_overrides(override_date);
CREATE INDEX IF NOT EXISTS idx_calendar_overrides_date ON calendar_overrides(date);
CREATE INDEX IF NOT EXISTS idx_business_events_dates ON business_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_schedules_week_start ON schedules(week_start_date);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_date_time ON shifts(date, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_forecast_cache_date_hour ON forecast_cache(forecast_date, hour_of_day);
CREATE INDEX IF NOT EXISTS idx_forecast_cache_expires_at ON forecast_cache(expires_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_employees_business_status ON employees(business_id, status);
CREATE INDEX IF NOT EXISTS idx_availability_employee_dow ON availability(employee_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_demand_history_business_date_type ON demand_history(business_id, date, demand_type);
CREATE INDEX IF NOT EXISTS idx_shifts_employee_date ON shifts(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_alerts_business_unread ON alerts(business_id, is_read) WHERE is_read = false;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_business_memberships_updated_at BEFORE UPDATE ON user_business_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_updated_at BEFORE UPDATE ON availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_demand_history_updated_at BEFORE UPDATE ON demand_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seasonal_profiles_updated_at BEFORE UPDATE ON seasonal_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_seasonal_overrides_updated_at BEFORE UPDATE ON business_seasonal_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_overrides_updated_at BEFORE UPDATE ON calendar_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_events_updated_at BEFORE UPDATE ON business_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_imports_updated_at BEFORE UPDATE ON imports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forecast_cache_updated_at BEFORE UPDATE ON forecast_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add AFTER INSERT trigger on businesses to auto-add creator as owner
DROP TRIGGER IF EXISTS add_business_creator_trigger ON businesses;
CREATE TRIGGER add_business_creator_trigger AFTER INSERT ON businesses
  FOR EACH ROW EXECUTE FUNCTION add_business_creator_as_owner();

-- ============================================================================
-- RLS POLICIES (DISABLED FOR LOCAL DEVELOPMENT)
-- ============================================================================

-- For local development, we'll disable RLS on business tables to make testing easier
-- In production with Supabase, these would be enabled

-- ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_business_memberships ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SEED DATA FOR TESTING
-- ============================================================================

-- Insert a test profile
INSERT INTO public.profiles (id, email, full_name) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'Test User')
ON CONFLICT (id) DO NOTHING;

-- Insert a test business
INSERT INTO businesses (id, name, industry, timezone) 
VALUES ('11111111-1111-1111-1111-111111111111', 'בית קפה דוגמה', 'restaurant', 'Asia/Jerusalem')
ON CONFLICT (id) DO NOTHING;

-- Insert user-business membership
INSERT INTO user_business_memberships (user_id, business_id, role)
VALUES ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'owner')
ON CONFLICT (user_id, business_id) DO NOTHING;

-- Insert test employees
INSERT INTO employees (id, business_id, email, first_name, last_name, phone, hourly_rate, role, status)
VALUES 
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'sarah@example.com', 'שרה', 'כהן', '050-1234567', 35.50, 'manager', 'active'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'yossi@example.com', 'יוסי', 'לוי', '052-9876543', 28.00, 'employee', 'active')
ON CONFLICT (business_id, email) DO NOTHING;

-- Insert test availability
INSERT INTO availability (business_id, employee_id, day_of_week, start_time, end_time, is_available)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 1, '08:00', '16:00', true), -- Monday
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 2, '08:00', '16:00', true), -- Tuesday
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 1, '16:00', '23:00', true), -- Monday evening
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 2, '16:00', '23:00', true)  -- Tuesday evening
ON CONFLICT DO NOTHING;

-- Insert test budget
INSERT INTO budgets (business_id, name, budget_type, amount, currency, period_start, period_end, department)
VALUES ('11111111-1111-1111-1111-111111111111', 'תקציב חודשי', 'monthly', 50000.00, 'ILS', '2025-10-01', '2025-10-31', 'general')
ON CONFLICT DO NOTHING;

-- Insert test demand history
INSERT INTO demand_history (business_id, date, hour_of_day, demand_value, demand_type, department)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '2025-10-19', 8, 15.5, 'customers', 'main'),
  ('11111111-1111-1111-1111-111111111111', '2025-10-19', 12, 45.2, 'customers', 'main'),
  ('11111111-1111-1111-1111-111111111111', '2025-10-19', 18, 32.1, 'customers', 'main')
ON CONFLICT DO NOTHING;

-- Insert test seasonal profile
INSERT INTO seasonal_profiles (business_id, name, profile_type, multiplier_data, is_active, priority)
VALUES ('11111111-1111-1111-1111-111111111111', 'פרופיל קיץ', 'seasonal', '{"summer": 1.2, "winter": 0.8}', true, 1)
ON CONFLICT DO NOTHING;

-- Insert test schedule
INSERT INTO schedules (id, business_id, name, week_start_date, status, created_by)
VALUES ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'שבוע 20-26 אוקטובר', '2025-10-20', 'draft', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Insert test shifts
INSERT INTO shifts (business_id, schedule_id, employee_id, date, start_time, end_time, role, hourly_rate, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '2025-10-21', '08:00', '16:00', 'manager', 35.50, 'scheduled'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', '2025-10-21', '16:00', '23:00', 'employee', 28.00, 'scheduled')
ON CONFLICT DO NOTHING;

-- Insert test alert
INSERT INTO alerts (business_id, alert_type, severity, title, message, is_read)
VALUES ('11111111-1111-1111-1111-111111111111', 'understaffed', 'warning', 'חסר כוח אדם', 'אין מספיק עובדים למשמרת ערב של יום שני', false)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;

GRANT USAGE ON SCHEMA auth TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'ShiftMind local database setup completed successfully!';
    RAISE NOTICE 'Tables created: auth.users, public.profiles, businesses, user_business_memberships, employees, availability, budgets, demand_history, seasonal_profiles, business_seasonal_overrides, calendar_overrides, business_events, schedules, shifts, alerts, imports, forecast_cache';
    RAISE NOTICE 'Test data inserted for local development';
END $$;
