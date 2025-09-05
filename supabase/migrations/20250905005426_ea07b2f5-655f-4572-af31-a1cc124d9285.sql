-- Enable RLS on new tables and create policies
ALTER TABLE public.trainer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trainer_settings
CREATE POLICY "Users can view their own trainer settings" 
ON public.trainer_settings FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own trainer settings" 
ON public.trainer_settings FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own trainer settings" 
ON public.trainer_settings FOR UPDATE 
USING (user_id = auth.uid());

-- Create RLS policies for subscriptions
CREATE POLICY "Users can view their own subscription" 
ON public.subscriptions FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own subscription" 
ON public.subscriptions FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription" 
ON public.subscriptions FOR UPDATE 
USING (user_id = auth.uid());

-- Update handle_new_user function to include new tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.trainer_settings (user_id, focus_areas)
  VALUES (NEW.id, ARRAY['mindset']);
  
  INSERT INTO public.subscriptions (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;