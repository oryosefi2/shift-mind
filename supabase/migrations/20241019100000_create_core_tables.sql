-- Migration: Create ShiftMind core tables with RLS
-- Created: 2025-10-19
-- Updated: 2025-10-19
-- Description: Core business scheduling and workforce management schema with user memberships

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- CORE TABLES
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
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_business_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_seasonal_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_cache ENABLE ROW LEVEL SECURITY;

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

-- User business memberships policies
DROP POLICY IF EXISTS "Users can view own membership" ON user_business_memberships;
CREATE POLICY "Users can view own membership" ON user_business_memberships
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own membership" ON user_business_memberships;
DROP POLICY IF EXISTS "Owners and admins can manage memberships" ON user_business_memberships;
CREATE POLICY "Owners and admins can manage memberships" ON user_business_memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_business_memberships ubm 
      WHERE ubm.user_id = auth.uid() 
      AND ubm.business_id = NEW.business_id 
      AND ubm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Owners and admins can update memberships" ON user_business_memberships;
CREATE POLICY "Owners and admins can update memberships" ON user_business_memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_business_memberships ubm 
      WHERE ubm.user_id = auth.uid() 
      AND ubm.business_id = business_id 
      AND ubm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Owners and admins can delete memberships" ON user_business_memberships;
CREATE POLICY "Owners and admins can delete memberships" ON user_business_memberships
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_business_memberships ubm 
      WHERE ubm.user_id = auth.uid() 
      AND ubm.business_id = business_id 
      AND ubm.role IN ('owner', 'admin')
    )
  );

-- Businesses policies
DROP POLICY IF EXISTS "Users can view accessible businesses" ON businesses;
CREATE POLICY "Users can view accessible businesses" ON businesses
  FOR SELECT USING (public.user_has_business_access(id));

DROP POLICY IF EXISTS "Users can update accessible businesses" ON businesses;
CREATE POLICY "Users can update accessible businesses" ON businesses
  FOR UPDATE USING (public.user_has_business_access(id));

-- Employees policies
DROP POLICY IF EXISTS "Users can view employees in accessible businesses" ON employees;
CREATE POLICY "Users can view employees in accessible businesses" ON employees
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can insert employees in accessible businesses" ON employees;
CREATE POLICY "Users can insert employees in accessible businesses" ON employees
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can update employees in accessible businesses" ON employees;
CREATE POLICY "Users can update employees in accessible businesses" ON employees
  FOR UPDATE USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can delete employees in accessible businesses" ON employees;
CREATE POLICY "Users can delete employees in accessible businesses" ON employees
  FOR DELETE USING (public.user_has_business_access(business_id));

-- Availability policies
DROP POLICY IF EXISTS "Users can view availability in accessible businesses" ON availability;
CREATE POLICY "Users can view availability in accessible businesses" ON availability
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can insert availability in accessible businesses" ON availability;
CREATE POLICY "Users can insert availability in accessible businesses" ON availability
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can update availability in accessible businesses" ON availability;
CREATE POLICY "Users can update availability in accessible businesses" ON availability
  FOR UPDATE USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can delete availability in accessible businesses" ON availability;
CREATE POLICY "Users can delete availability in accessible businesses" ON availability
  FOR DELETE USING (public.user_has_business_access(business_id));

-- Budgets policies
DROP POLICY IF EXISTS "Users can view budgets in accessible businesses" ON budgets;
CREATE POLICY "Users can view budgets in accessible businesses" ON budgets
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can insert budgets in accessible businesses" ON budgets;
CREATE POLICY "Users can insert budgets in accessible businesses" ON budgets
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can update budgets in accessible businesses" ON budgets;
CREATE POLICY "Users can update budgets in accessible businesses" ON budgets
  FOR UPDATE USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can delete budgets in accessible businesses" ON budgets;
CREATE POLICY "Users can delete budgets in accessible businesses" ON budgets
  FOR DELETE USING (public.user_has_business_access(business_id));

-- Demand history policies
DROP POLICY IF EXISTS "Users can view demand history in accessible businesses" ON demand_history;
CREATE POLICY "Users can view demand history in accessible businesses" ON demand_history
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can insert demand history in accessible businesses" ON demand_history;
CREATE POLICY "Users can insert demand history in accessible businesses" ON demand_history
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can update demand history in accessible businesses" ON demand_history;
CREATE POLICY "Users can update demand history in accessible businesses" ON demand_history
  FOR UPDATE USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can delete demand history in accessible businesses" ON demand_history;
CREATE POLICY "Users can delete demand history in accessible businesses" ON demand_history
  FOR DELETE USING (public.user_has_business_access(business_id));

-- Seasonal profiles policies
DROP POLICY IF EXISTS "Users can view seasonal profiles in accessible businesses" ON seasonal_profiles;
CREATE POLICY "Users can view seasonal profiles in accessible businesses" ON seasonal_profiles
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can insert seasonal profiles in accessible businesses" ON seasonal_profiles;
CREATE POLICY "Users can insert seasonal profiles in accessible businesses" ON seasonal_profiles
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can update seasonal profiles in accessible businesses" ON seasonal_profiles;
CREATE POLICY "Users can update seasonal profiles in accessible businesses" ON seasonal_profiles
  FOR UPDATE USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can delete seasonal profiles in accessible businesses" ON seasonal_profiles;
CREATE POLICY "Users can delete seasonal profiles in accessible businesses" ON seasonal_profiles
  FOR DELETE USING (public.user_has_business_access(business_id));

-- Business seasonal overrides policies
DROP POLICY IF EXISTS "Users can view seasonal overrides in accessible businesses" ON business_seasonal_overrides;
CREATE POLICY "Users can view seasonal overrides in accessible businesses" ON business_seasonal_overrides
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can insert seasonal overrides in accessible businesses" ON business_seasonal_overrides;
CREATE POLICY "Users can insert seasonal overrides in accessible businesses" ON business_seasonal_overrides
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can update seasonal overrides in accessible businesses" ON business_seasonal_overrides;
CREATE POLICY "Users can update seasonal overrides in accessible businesses" ON business_seasonal_overrides
  FOR UPDATE USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can delete seasonal overrides in accessible businesses" ON business_seasonal_overrides;
CREATE POLICY "Users can delete seasonal overrides in accessible businesses" ON business_seasonal_overrides
  FOR DELETE USING (public.user_has_business_access(business_id));

-- Calendar overrides policies
DROP POLICY IF EXISTS "Users can view calendar overrides in accessible businesses" ON calendar_overrides;
CREATE POLICY "Users can view calendar overrides in accessible businesses" ON calendar_overrides
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can insert calendar overrides in accessible businesses" ON calendar_overrides;
CREATE POLICY "Users can insert calendar overrides in accessible businesses" ON calendar_overrides
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can update calendar overrides in accessible businesses" ON calendar_overrides;
CREATE POLICY "Users can update calendar overrides in accessible businesses" ON calendar_overrides
  FOR UPDATE USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can delete calendar overrides in accessible businesses" ON calendar_overrides;
CREATE POLICY "Users can delete calendar overrides in accessible businesses" ON calendar_overrides
  FOR DELETE USING (public.user_has_business_access(business_id));

-- Business events policies
DROP POLICY IF EXISTS "Users can view business events in accessible businesses" ON business_events;
CREATE POLICY "Users can view business events in accessible businesses" ON business_events
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can insert business events in accessible businesses" ON business_events;
CREATE POLICY "Users can insert business events in accessible businesses" ON business_events
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can update business events in accessible businesses" ON business_events;
CREATE POLICY "Users can update business events in accessible businesses" ON business_events
  FOR UPDATE USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can delete business events in accessible businesses" ON business_events;
CREATE POLICY "Users can delete business events in accessible businesses" ON business_events
  FOR DELETE USING (public.user_has_business_access(business_id));

-- Schedules policies
DROP POLICY IF EXISTS "Users can view schedules in accessible businesses" ON schedules;
CREATE POLICY "Users can view schedules in accessible businesses" ON schedules
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can insert schedules in accessible businesses" ON schedules;
CREATE POLICY "Users can insert schedules in accessible businesses" ON schedules
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can update schedules in accessible businesses" ON schedules;
CREATE POLICY "Users can update schedules in accessible businesses" ON schedules
  FOR UPDATE USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can delete schedules in accessible businesses" ON schedules;
CREATE POLICY "Users can delete schedules in accessible businesses" ON schedules
  FOR DELETE USING (public.user_has_business_access(business_id));

-- Shifts policies
DROP POLICY IF EXISTS "Users can view shifts in accessible businesses" ON shifts;
CREATE POLICY "Users can view shifts in accessible businesses" ON shifts
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can insert shifts in accessible businesses" ON shifts;
CREATE POLICY "Users can insert shifts in accessible businesses" ON shifts
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can update shifts in accessible businesses" ON shifts;
CREATE POLICY "Users can update shifts in accessible businesses" ON shifts
  FOR UPDATE USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can delete shifts in accessible businesses" ON shifts;
CREATE POLICY "Users can delete shifts in accessible businesses" ON shifts
  FOR DELETE USING (public.user_has_business_access(business_id));

-- Alerts policies
DROP POLICY IF EXISTS "Users can view alerts in accessible businesses" ON alerts;
CREATE POLICY "Users can view alerts in accessible businesses" ON alerts
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can insert alerts in accessible businesses" ON alerts;
CREATE POLICY "Users can insert alerts in accessible businesses" ON alerts
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can update alerts in accessible businesses" ON alerts;
CREATE POLICY "Users can update alerts in accessible businesses" ON alerts
  FOR UPDATE USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can delete alerts in accessible businesses" ON alerts;
CREATE POLICY "Users can delete alerts in accessible businesses" ON alerts
  FOR DELETE USING (public.user_has_business_access(business_id));

-- Imports policies
DROP POLICY IF EXISTS "Users can view imports in accessible businesses" ON imports;
CREATE POLICY "Users can view imports in accessible businesses" ON imports
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can insert imports in accessible businesses" ON imports;
CREATE POLICY "Users can insert imports in accessible businesses" ON imports
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can update imports in accessible businesses" ON imports;
CREATE POLICY "Users can update imports in accessible businesses" ON imports
  FOR UPDATE USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can delete imports in accessible businesses" ON imports;
CREATE POLICY "Users can delete imports in accessible businesses" ON imports
  FOR DELETE USING (public.user_has_business_access(business_id));

-- Forecast cache policies
DROP POLICY IF EXISTS "Users can view forecast cache in accessible businesses" ON forecast_cache;
CREATE POLICY "Users can view forecast cache in accessible businesses" ON forecast_cache
  FOR SELECT USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can insert forecast cache in accessible businesses" ON forecast_cache;
CREATE POLICY "Users can insert forecast cache in accessible businesses" ON forecast_cache
  FOR INSERT WITH CHECK (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can update forecast cache in accessible businesses" ON forecast_cache;
CREATE POLICY "Users can update forecast cache in accessible businesses" ON forecast_cache
  FOR UPDATE USING (public.user_has_business_access(business_id));

DROP POLICY IF EXISTS "Users can delete forecast cache in accessible businesses" ON forecast_cache;
CREATE POLICY "Users can delete forecast cache in accessible businesses" ON forecast_cache
  FOR DELETE USING (public.user_has_business_access(business_id));

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to add business creator as owner
CREATE OR REPLACE FUNCTION add_business_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the creator as owner in user_business_memberships
  INSERT INTO user_business_memberships (user_id, business_id, role)
  VALUES (auth.uid(), NEW.id, 'owner');
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If auth.uid() is null or other error, continue without failing
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add AFTER INSERT trigger on businesses to auto-add creator as owner
DROP TRIGGER IF EXISTS add_business_creator_trigger ON businesses;
CREATE TRIGGER add_business_creator_trigger AFTER INSERT ON businesses
  FOR EACH ROW EXECUTE FUNCTION add_business_creator_as_owner();

-- Add triggers to all tables
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
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

CREATE TRIGGER update_user_business_memberships_updated_at BEFORE UPDATE ON user_business_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE businesses IS 'Root tenant table for multi-tenant isolation';
COMMENT ON TABLE user_business_memberships IS 'Multi-tenant access control linking users to businesses with roles';
COMMENT ON TABLE employees IS 'Employee master data with skills and preferences';
COMMENT ON TABLE availability IS 'Weekly availability patterns for employees';
COMMENT ON TABLE budgets IS 'Labor budget constraints by period';
COMMENT ON TABLE demand_history IS 'Historical demand data for forecasting';
COMMENT ON TABLE seasonal_profiles IS 'Reusable seasonal demand patterns';
COMMENT ON TABLE business_seasonal_overrides IS 'Business-specific seasonal adjustments';
COMMENT ON TABLE calendar_overrides IS 'Holiday and special event overrides';
COMMENT ON TABLE business_events IS 'Sales events, promotions affecting demand';
COMMENT ON TABLE schedules IS 'Weekly schedule containers';
COMMENT ON TABLE shifts IS 'Individual employee shifts within schedules';
COMMENT ON TABLE alerts IS 'System notifications and warnings';
COMMENT ON TABLE imports IS 'Data import job tracking';
COMMENT ON TABLE forecast_cache IS 'Cached demand forecasting results';

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant EXECUTE permissions on helper functions
GRANT EXECUTE ON FUNCTION public.get_business_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_business_access(uuid) TO authenticated;
