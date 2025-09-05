-- Create trainer messages table for AI conversation history
CREATE TABLE public.trainer_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('user', 'trainer')),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create trainer memory table for AI personalization
CREATE TABLE public.trainer_memory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  memory_type text NOT NULL CHECK (memory_type IN ('preference', 'goal', 'pattern', 'feedback')),
  key text NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add custom challenge fields to user_challenges
ALTER TABLE public.user_challenges 
ADD COLUMN is_custom boolean DEFAULT false,
ADD COLUMN custom_title text,
ADD COLUMN custom_description text,
ADD COLUMN custom_category text,
ADD COLUMN custom_time_minutes integer,
ADD COLUMN scheduled_date date,
ADD COLUMN created_by text CHECK (created_by IN ('user', 'trainer', 'system'));

-- Enable RLS on new tables
ALTER TABLE public.trainer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_memory ENABLE ROW LEVEL SECURITY;

-- Create policies for trainer_messages
CREATE POLICY "Users can view their own trainer messages" 
ON public.trainer_messages 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own trainer messages" 
ON public.trainer_messages 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create policies for trainer_memory
CREATE POLICY "Users can view their own trainer memory" 
ON public.trainer_memory 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own trainer memory" 
ON public.trainer_memory 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own trainer memory" 
ON public.trainer_memory 
FOR UPDATE 
USING (user_id = auth.uid());

-- Add trigger for trainer_memory updated_at
CREATE TRIGGER update_trainer_memory_updated_at
BEFORE UPDATE ON public.trainer_memory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();