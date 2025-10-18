-- Allow authenticated users to view workspaces by invite code
-- This enables the invite flow where users need to look up a workspace
-- before becoming a member
CREATE POLICY "Users can view workspaces by invite code"
ON public.workspaces
FOR SELECT
TO authenticated
USING (invite_code IS NOT NULL);