-- Create storage bucket for workspace images
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('workspace-images', 'workspace-images', true, 2097152)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for workspace images
CREATE POLICY "Anyone can view workspace images"
ON storage.objects FOR SELECT
USING (bucket_id = 'workspace-images');

CREATE POLICY "Authenticated users can upload workspace images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workspace-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own workspace images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'workspace-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own workspace images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'workspace-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);