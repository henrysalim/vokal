-- Migration: Create family_invitations table
-- Run this in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS public.family_invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_name     TEXT NOT NULL,
  to_phone      TEXT NOT NULL,         -- normalized phone (digits only, starts with 62)
  family_id     TEXT NOT NULL,
  family_secret TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_family_invitations_to_phone ON public.family_invitations(to_phone);
CREATE INDEX IF NOT EXISTS idx_family_invitations_status   ON public.family_invitations(status);
CREATE INDEX IF NOT EXISTS idx_family_invitations_from     ON public.family_invitations(from_user_id);

-- Enable RLS
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;

-- Sender can insert
CREATE POLICY "Sender can insert invitations"
  ON public.family_invitations
  FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Sender can view their own sent invitations
CREATE POLICY "Sender can view sent invitations"
  ON public.family_invitations
  FOR SELECT
  USING (auth.uid() = from_user_id);

-- Recipient can view invitations matching their phone (normalized to 62xxx format)
CREATE POLICY "Recipient can view invitations for their phone"
  ON public.family_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.phone IS NOT NULL
        AND (
          -- Match as-is (already normalized)
          public.family_invitations.to_phone = regexp_replace(p.phone, '[^0-9]', '', 'g')
          OR
          -- Match after converting 08xxx -> 628xxx
          public.family_invitations.to_phone = '62' || substring(regexp_replace(p.phone, '[^0-9]', '', 'g'), 2)
        )
    )
  );

-- Recipient can update status (accept / reject)
CREATE POLICY "Recipient can update invitation status"
  ON public.family_invitations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.phone IS NOT NULL
        AND (
          public.family_invitations.to_phone = regexp_replace(p.phone, '[^0-9]', '', 'g')
          OR
          public.family_invitations.to_phone = '62' || substring(regexp_replace(p.phone, '[^0-9]', '', 'g'), 2)
        )
    )
  );
