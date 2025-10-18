-- Create role enum
CREATE TYPE public.app_role AS ENUM ('workspace_admin', 'channel_regulator', 'member');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workspace_id, channel_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(
  _user_id UUID, 
  _workspace_id UUID,
  _channel_id UUID DEFAULT NULL,
  _role app_role DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
      AND (_channel_id IS NULL OR channel_id = _channel_id)
      AND (_role IS NULL OR role = _role)
  )
$$;

-- RLS policy: Users can see their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- RLS policy: Workspace admins can manage roles
CREATE POLICY "Workspace admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  public.has_role(auth.uid(), workspace_id, NULL, 'workspace_admin')
  OR auth.uid() IN (SELECT super_admin FROM public.workspaces WHERE id = workspace_id)
);

-- Function to assign workspace admin role when creating workspace
CREATE OR REPLACE FUNCTION public.assign_workspace_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, workspace_id, role)
  VALUES (NEW.super_admin, NEW.id, 'workspace_admin');
  RETURN NEW;
END;
$$;

-- Trigger to auto-assign admin role
CREATE TRIGGER assign_admin_on_workspace_create
AFTER INSERT ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.assign_workspace_admin_role();

-- Function to assign channel regulator role
CREATE OR REPLACE FUNCTION public.assign_channel_regulator_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, workspace_id, channel_id, role)
  VALUES (NEW.user_id, NEW.workspace_id, NEW.id, 'channel_regulator');
  RETURN NEW;
END;
$$;

-- Trigger to auto-assign regulator role to channel creator
CREATE TRIGGER assign_regulator_on_channel_create
AFTER INSERT ON public.channels
FOR EACH ROW
EXECUTE FUNCTION public.assign_channel_regulator_role();