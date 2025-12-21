-- ============================================
-- Fix: Function Search Path Security Issue
-- ============================================
-- This migration fixes the security issue with update_updated_at_column function
-- by setting a fixed search_path to prevent SQL injection via search_path manipulation
-- ============================================

-- Recreate the function with fixed search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Note: SECURITY DEFINER is safe here because:
-- 1. Function only updates updated_at timestamp (no sensitive operations)
-- 2. Fixed search_path prevents search_path manipulation attacks
-- 3. Function is only used in triggers, not called directly by users

