-- Enable full realtime support for direct_messages table
-- This ensures UPDATE and DELETE events include complete row data
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;