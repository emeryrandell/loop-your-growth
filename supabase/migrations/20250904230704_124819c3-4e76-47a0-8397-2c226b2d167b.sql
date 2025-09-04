-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'yearly')),
  subscription_end TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false,
  preferred_track TEXT DEFAULT 'mindset' CHECK (preferred_track IN ('study', 'fitness', 'mindset', 'lifestyle')),
  daily_time_available INTEGER DEFAULT 10, -- minutes
  difficulty_preference TEXT DEFAULT 'medium' CHECK (difficulty_preference IN ('easy', 'medium', 'hard')),
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Create challenges table for all available challenges
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track TEXT NOT NULL CHECK (track IN ('study', 'fitness', 'mindset', 'lifestyle')),
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  benefit TEXT,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  estimated_minutes INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_challenges table to track user progress
CREATE TABLE public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'snoozed', 'skipped')),
  completion_date TIMESTAMPTZ,
  feedback TEXT, -- user feedback on difficulty
  trainer_response TEXT, -- AI trainer response
  notes TEXT, -- user notes
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Create streaks table to track user streaks
CREATE TABLE public.streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completion_date DATE,
  streak_start_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create progress_cards table for shareable cards
CREATE TABLE public.progress_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  streak_count INTEGER NOT NULL,
  track TEXT NOT NULL,
  challenge_title TEXT NOT NULL,
  card_data JSONB, -- store card design data
  shared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for challenges (public read access)
CREATE POLICY "Anyone can view challenges" ON public.challenges
  FOR SELECT USING (true);

-- RLS Policies for user_challenges
CREATE POLICY "Users can view their own challenges" ON public.user_challenges
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own challenges" ON public.user_challenges
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own challenges" ON public.user_challenges
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for streaks
CREATE POLICY "Users can view their own streaks" ON public.streaks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own streaks" ON public.streaks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own streaks" ON public.streaks
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for progress_cards
CREATE POLICY "Users can view their own progress cards" ON public.progress_cards
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own progress cards" ON public.progress_cards
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress cards" ON public.progress_cards
  FOR UPDATE USING (user_id = auth.uid());

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_challenges_updated_at
  BEFORE UPDATE ON public.user_challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at
  BEFORE UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_progress_cards_updated_at
  BEFORE UPDATE ON public.progress_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial challenges for each track
INSERT INTO public.challenges (track, day_number, title, description, benefit, difficulty, estimated_minutes) VALUES
-- Study Track
('study', 1, 'Write down your top 3 study priorities', 'Before bed tonight, write down the 3 most important things you need to study tomorrow.', 'This primes your brain for focused learning and reduces decision fatigue.', 'easy', 5),
('study', 2, 'One 25-min Pomodoro session', 'Do one focused 25-minute study session without your phone nearby.', 'Builds concentration and creates momentum for deeper focus.', 'medium', 25),
('study', 3, 'Try 10 minutes of active recall', 'Close your notes and quiz yourself on what you studied yesterday for 10 minutes.', 'Strengthens memory and identifies knowledge gaps.', 'medium', 10),
('study', 7, 'Solve 5 practice problems', 'Complete 5 practice problems without looking at your notes first.', 'Tests true understanding and builds confidence.', 'medium', 15),
('study', 14, 'Teach a concept out loud', 'Explain a concept you learned this week to an imaginary audience for 5 minutes.', 'Reveals gaps in understanding and solidifies knowledge.', 'medium', 10),
('study', 21, 'Summarize a chapter in 3 points', 'Read through an entire chapter and summarize it in just 3 key bullet points.', 'Forces you to identify the most important information.', 'hard', 20),

-- Fitness Track
('fitness', 1, 'Walk for 10 minutes outdoors', 'Take a 10-minute walk outside, breathing fresh air and moving your body.', 'Boosts mood, energy, and circulation.', 'easy', 10),
('fitness', 2, 'Drink 2 extra glasses of water', 'Drink 2 additional glasses of water beyond your normal intake today.', 'Improves hydration, skin, and cognitive function.', 'easy', 2),
('fitness', 3, 'Do 5 pushups before breakfast', 'Complete 5 pushups (modified if needed) before eating your first meal.', 'Activates muscles and starts your day with accomplishment.', 'easy', 3),
('fitness', 7, 'Stretch for 5 minutes before bed', 'Do gentle stretches for 5 minutes before going to sleep.', 'Improves flexibility and promotes better sleep.', 'easy', 5),
('fitness', 14, 'Add one extra serving of vegetables', 'Include one additional serving of vegetables in any meal today.', 'Increases nutrient intake and supports overall health.', 'easy', 5),
('fitness', 21, 'Try a short HIIT circuit', 'Complete 3 rounds of: 10 squats, 5 pushups, 30-second plank.', 'Builds strength, endurance, and cardiovascular health.', 'hard', 15),

-- Mindset Track
('mindset', 1, 'Write down 3 things you are grateful for', 'List 3 specific things you feel grateful for right now.', 'Shifts focus to positive aspects and improves mood.', 'easy', 5),
('mindset', 2, 'Spend 5 minutes meditating', 'Sit quietly and focus on your breathing for 5 minutes.', 'Reduces stress and improves focus and emotional regulation.', 'medium', 5),
('mindset', 3, 'Journal: What gave me energy today?', 'Write for 5 minutes about what activities or interactions energized you today.', 'Helps identify energy sources and life patterns.', 'easy', 5),
('mindset', 7, 'Compliment one person genuinely', 'Give a sincere, specific compliment to someone in your life.', 'Strengthens relationships and spreads positivity.', 'medium', 3),
('mindset', 14, 'Reframe a negative thought', 'Write down one negative thought you had today, then rewrite it in a more positive or realistic way.', 'Builds mental resilience and optimistic thinking patterns.', 'medium', 10),
('mindset', 21, 'Do a 24-hour social media detox', 'Avoid all social media platforms for 24 hours.', 'Reduces comparison, improves focus, and increases real-world connection.', 'hard', 1440),

-- Lifestyle Track
('lifestyle', 1, 'Declutter 5 items from your desk', 'Remove 5 unnecessary items from your workspace.', 'Creates a cleaner environment and reduces mental clutter.', 'easy', 10),
('lifestyle', 2, 'Unsubscribe from 3 marketing emails', 'Clean up your inbox by unsubscribing from 3 promotional email lists.', 'Reduces digital noise and saves mental energy.', 'easy', 5),
('lifestyle', 3, 'Prep tomorrow outfit tonight', 'Choose and lay out what you will wear tomorrow before going to bed.', 'Saves decision energy and reduces morning stress.', 'easy', 5),
('lifestyle', 7, 'Cook one healthy meal at home', 'Prepare a nutritious meal at home instead of ordering takeout.', 'Saves money, improves nutrition, and builds life skills.', 'medium', 30),
('lifestyle', 14, 'Organize your phone apps', 'Sort your phone apps into folders and delete ones you do not use.', 'Reduces digital distraction and improves productivity.', 'easy', 15),
('lifestyle', 21, 'Create a 30-minute wind-down routine', 'Design and follow a 30-minute evening routine to prepare for sleep.', 'Improves sleep quality and creates healthy boundaries.', 'medium', 30);