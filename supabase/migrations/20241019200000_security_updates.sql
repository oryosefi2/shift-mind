-- Migration: Security and Business Membership Updates
-- Created: 2025-10-19
-- Description: Add business creator auto-ownership, restrict membership management, and grant function permissions

-- ============================================================================
-- FUNCTION UPDATES
-- ============================================================================

-- Function to add business creator as owner (idempotent)
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
-- TRIGGERS
-- ============================================================================

-- Add AFTER INSERT trigger on businesses to auto-add creator as owner (idempotent)
DROP TRIGGER IF EXISTS add_business_creator_trigger ON businesses;
CREATE TRIGGER add_business_creator_trigger AFTER INSERT ON businesses
  FOR EACH ROW EXECUTE FUNCTION add_business_creator_as_owner();

-- Add updated_at trigger for profiles (idempotent)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PROFILE POLICIES
-- ============================================================================

-- Allow users to insert their own profile (idempotent)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- USER BUSINESS MEMBERSHIP POLICIES (RESTRICTED)
-- ============================================================================

-- Update user_business_memberships policies to restrict management to owners/admins only
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

-- ============================================================================
-- FUNCTION PERMISSIONS
-- ============================================================================

-- Grant EXECUTE permissions on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_business_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_business_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION add_business_creator_as_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
