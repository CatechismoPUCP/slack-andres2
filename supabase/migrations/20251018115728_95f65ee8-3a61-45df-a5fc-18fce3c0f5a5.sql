-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add REPLICA IDENTITY for complete row data
ALTER TABLE public.messages REPLICA IDENTITY FULL;