-- Create RLS policies for chat-files bucket
CREATE POLICY "Authenticated users can upload to chat-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-files');

CREATE POLICY "Authenticated users can view chat-files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'chat-files');

CREATE POLICY "Users can update their own chat-files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own chat-files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);