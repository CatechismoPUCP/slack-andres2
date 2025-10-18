-- Add password field to workspaces table
ALTER TABLE public.workspaces 
ADD COLUMN password TEXT;

-- Create function to verify workspace password
CREATE OR REPLACE FUNCTION public.verify_workspace_password(
  workspace_id_param UUID,
  password_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_password TEXT;
BEGIN
  SELECT password INTO stored_password
  FROM workspaces
  WHERE id = workspace_id_param;
  
  -- If no password set, always return true
  IF stored_password IS NULL OR stored_password = '' THEN
    RETURN true;
  END IF;
  
  -- Check if provided password matches
  RETURN stored_password = password_param;
END;
$$;