-- Create chat-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files',
  true,
  52428800, -- 50MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
);

-- RLS policies for chat-files bucket
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view files in their channels"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'chat-files');

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);