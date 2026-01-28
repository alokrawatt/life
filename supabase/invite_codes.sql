-- =============================================
-- INVITE CODES TABLE FOR INVITE-ONLY SIGNUPS
-- Run this in your Supabase SQL Editor
-- =============================================

-- Create invite_codes table
CREATE TABLE public.invite_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    used_by UUID REFERENCES auth.users(id),
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can check if an invite code is valid (for signup)
CREATE POLICY "Anyone can validate invite codes" ON public.invite_codes
    FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Policy: Authenticated users can see codes they created
CREATE POLICY "Users can view their own invite codes" ON public.invite_codes
    FOR SELECT USING (auth.uid() = created_by);

-- Policy: Authenticated users can create invite codes
CREATE POLICY "Authenticated users can create invite codes" ON public.invite_codes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: System can update invite codes (for marking as used)
CREATE POLICY "Service role can update invite codes" ON public.invite_codes
    FOR UPDATE USING (true);

-- Create indexes for faster lookups
CREATE INDEX idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX idx_invite_codes_created_by ON public.invite_codes(created_by);

-- Function to validate and use an invite code
CREATE OR REPLACE FUNCTION public.use_invite_code(invite_code TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    code_record RECORD;
BEGIN
    -- Find the invite code
    SELECT * INTO code_record
    FROM public.invite_codes
    WHERE code = invite_code
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (max_uses IS NULL OR current_uses < max_uses)
    FOR UPDATE;
    
    -- If no valid code found, return false
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update the invite code usage
    UPDATE public.invite_codes
    SET current_uses = current_uses + 1,
        used_by = COALESCE(used_by, user_id),
        used_at = COALESCE(used_at, NOW()),
        is_active = CASE WHEN max_uses IS NOT NULL AND current_uses + 1 >= max_uses THEN false ELSE is_active END
    WHERE id = code_record.id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create some initial invite codes (you can change these!)
-- These are single-use codes that don't expire
INSERT INTO public.invite_codes (code, note) VALUES
    ('LIFE-ALPHA-001', 'Initial alpha user invite'),
    ('LIFE-ALPHA-002', 'Initial alpha user invite'),
    ('LIFE-ALPHA-003', 'Initial alpha user invite'),
    ('LIFE-BETA-2024', 'Beta access code'),
    ('WELCOME-FRIEND', 'General invite code');

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.use_invite_code(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.use_invite_code(TEXT, UUID) TO anon;
