export type User = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string;
  type: string | null;
  is_away: boolean;
  workspaces: string[] | null;
  channels: string[] | null;
  created_at: string | null;
  phone: string | null;
};

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  invite_code: string;
  password: string | null;
  super_admin: string;
  members: string[] | null;
  channels: string[] | null;
  regulators: string[] | null;
  created_at: string;
};

export type Channel = {
  id: string;
  name: string;
  workspace_id: string;
  user_id: string;
  members: string[] | null;
  regulators: string[] | null;
  created_at: string;
};

export type Message = {
  id: string;
  content: string | null;
  file_url: string | null;
  user_id: string;
  channel_id: string;
  workspace_id: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export type MessageWithUser = Message & { user: User };

export type DirectMessage = {
  id: number;
  content: string | null;
  file_url: string | null;
  user: string;
  user_one: string;
  user_two: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export type DirectMessageWithUser = DirectMessage & { senderUser: User };
