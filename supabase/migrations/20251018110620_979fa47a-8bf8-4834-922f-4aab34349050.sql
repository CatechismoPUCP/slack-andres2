-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  avatar_url text NOT NULL DEFAULT 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
  type text DEFAULT 'user' CHECK (type IN ('user', 'admin', 'regulator')),
  is_away boolean DEFAULT false,
  phone text,
  workspaces text[],
  channels text[],
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own data" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can view all users in their workspaces"
  ON public.users FOR SELECT
  USING (true);

-- Trigger to auto-create user on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  image_url text,
  invite_code text UNIQUE NOT NULL,
  super_admin uuid REFERENCES public.users(id) NOT NULL,
  members text[],
  channels text[],
  regulators text[],
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspaces they're members of"
  ON public.workspaces FOR SELECT
  USING (auth.uid()::text = ANY(members) OR auth.uid() = super_admin);

CREATE POLICY "Super admins can update their workspaces"
  ON public.workspaces FOR UPDATE
  USING (auth.uid() = super_admin);

CREATE POLICY "Authenticated users can create workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = super_admin);

-- Create channels table
CREATE TABLE IF NOT EXISTS public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) NOT NULL,
  members text[],
  regulators text[],
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view channels they're members of"
  ON public.channels FOR SELECT
  USING (auth.uid()::text = ANY(members));

CREATE POLICY "Channel creators can update channels"
  ON public.channels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Workspace members can create channels"
  ON public.channels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text,
  file_url text,
  user_id uuid REFERENCES public.users(id) NOT NULL,
  channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their channels"
  ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.channels 
    WHERE channels.id = messages.channel_id 
    AND auth.uid()::text = ANY(channels.members)
  ));

CREATE POLICY "Users can insert messages in their channels"
  ON public.messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.channels 
    WHERE channels.id = messages.channel_id 
    AND auth.uid()::text = ANY(channels.members)
  ) AND auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = user_id);

-- Create direct_messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id serial PRIMARY KEY,
  content text,
  file_url text,
  "user" uuid REFERENCES public.users(id) NOT NULL,
  user_one uuid REFERENCES public.users(id) NOT NULL,
  user_two uuid REFERENCES public.users(id) NOT NULL,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their direct messages"
  ON public.direct_messages FOR SELECT
  USING (auth.uid() = user_one OR auth.uid() = user_two);

CREATE POLICY "Users can send direct messages"
  ON public.direct_messages FOR INSERT
  WITH CHECK (auth.uid() = "user");

CREATE POLICY "Users can update their own direct messages"
  ON public.direct_messages FOR UPDATE
  USING (auth.uid() = "user");

CREATE POLICY "Users can delete their own direct messages"
  ON public.direct_messages FOR DELETE
  USING (auth.uid() = "user");

-- Helper functions
CREATE OR REPLACE FUNCTION public.add_workspace_to_user(user_id uuid, new_workspace text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE users SET workspaces = array_append(workspaces, new_workspace) WHERE id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_member_to_workspace(user_id text, workspace_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE workspaces SET members = array_append(members, user_id) WHERE id = workspace_id::uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_channels(user_id uuid, channel_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE users SET channels = array_append(channels, channel_id) WHERE id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_channel_members(new_member text, channel_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE channels SET members = array_append(members, new_member) WHERE id = channel_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_channel_to_workspace(channel_id text, workspace_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE workspaces SET channels = array_append(channels, channel_id) WHERE id = workspace_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_channel_regulators(regulator_id text, channel_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE channels SET regulators = array_append(regulators, regulator_id) WHERE id = channel_id;
END;
$$;