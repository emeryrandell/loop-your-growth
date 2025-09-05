-- Clear existing challenges  
DELETE FROM challenges;

-- Drop and recreate constraints to match new categories
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_category_check;
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_difficulty_check;

ALTER TABLE challenges 
  ADD CONSTRAINT challenges_category_check 
  CHECK (category IN ('energy', 'mindset', 'focus', 'relationships', 'home', 'finance', 'creativity', 'recovery'));

ALTER TABLE challenges 
  ADD CONSTRAINT challenges_difficulty_check 
  CHECK (difficulty IN ('1', '2', '3', '4', '5'));

-- Add trainer_settings table for onboarding
CREATE TABLE IF NOT EXISTS public.trainer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  time_budget INTEGER DEFAULT 15,
  focus_areas text[] DEFAULT ARRAY['mindset'], 
  goals text,
  constraints text,
  onboarding_completed BOOLEAN DEFAULT false,
  difficulty_preference INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trainer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own trainer settings" 
ON trainer_settings FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can insert their own trainer settings" 
ON trainer_settings FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update their own trainer settings" 
ON trainer_settings FOR UPDATE 
USING (user_id = auth.uid());

-- Add subscriptions table 
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'free',
  plan_type TEXT DEFAULT 'free',
  current_period_end TIMESTAMPTZ,
  demo_completed BOOLEAN DEFAULT false,
  demo_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own subscription" 
ON subscriptions FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can insert their own subscription" 
ON subscriptions FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update their own subscription" 
ON subscriptions FOR UPDATE 
USING (user_id = auth.uid());

-- Insert comprehensive challenge library
INSERT INTO challenges (category, day_number, title, description, benefit, difficulty, estimated_minutes) VALUES
-- Energy/Movement challenges
('energy', 1, 'Morning Hydration Boost', 'Drink a full glass of water within 10 minutes of waking up', 'Kickstarts metabolism and improves alertness', '1', 5),
('energy', 2, 'Desk Break Stretches', 'Stand up and do 5 simple stretches at your desk', 'Reduces tension and improves circulation', '1', 10),
('energy', 3, 'Power Posture Reset', 'Set 3 reminders to check and correct your posture today', 'Builds awareness and reduces back strain', '2', 15),
('energy', 4, 'Stair Climbing Sprint', 'Take the stairs instead of elevator at least twice today', 'Boosts heart rate and leg strength', '2', 10),
('energy', 5, 'Morning Movement Flow', 'Do 5 minutes of light movement when you wake up', 'Activates your body and mind for the day', '2', 5),

-- Mindset challenges  
('mindset', 1, 'Three Good Things', 'Write down 3 positive things that happened today', 'Rewires brain to notice positive experiences', '1', 10),
('mindset', 2, 'Mindful Breathing', 'Take 10 deep, conscious breaths focusing only on the sensation', 'Anchors attention and reduces anxiety', '2', 5),
('mindset', 3, 'Gratitude Text', 'Send a text to someone thanking them for something specific', 'Strengthens relationships and boosts mood', '2', 10),
('mindset', 4, 'Self-Compassion Break', 'Speak to yourself as kindly as you would a good friend', 'Reduces self-criticism and builds resilience', '3', 15),
('mindset', 5, 'Present Moment Check', 'Notice 5 sounds, 4 sights, 3 textures, 2 smells, 1 taste', 'Grounds you in the present and reduces rumination', '2', 10),

-- Focus/Work challenges
('focus', 1, 'Top 3 Priority List', 'Write down your 3 most important tasks for tomorrow before bed', 'Primes your brain for productive decision-making', '1', 10),
('focus', 2, 'Single-Task Sprint', 'Work on one task for 25 minutes without any distractions', 'Builds focus muscle and reduces task-switching costs', '3', 25),
('focus', 3, 'Digital Declutter', 'Organize your desktop and delete 5 unnecessary files', 'Reduces visual distractions and mental clutter', '2', 15),
('focus', 4, 'Phone-Free Focus Hour', 'Put your phone in another room for 1 hour of work', 'Eliminates the biggest source of digital distraction', '4', 60),
('focus', 5, 'Focus Ritual', 'Create a 5-minute ritual to signal start of deep work', 'Trains your brain to enter focused state on command', '3', 5),

-- Relationships challenges
('relationships', 1, 'Active Listening Practice', 'Have one conversation today where you listen without planning your response', 'Deepens connections and builds trust', '3', 15),
('relationships', 2, 'Appreciation Message', 'Send a heartfelt message to someone who made your day better', 'Strengthens bonds and spreads positivity', '2', 10),
('relationships', 3, 'Phone-Free Meal', 'Eat one meal with family/friends without any devices', 'Creates deeper connection and presence', '3', 30),
('relationships', 4, 'Random Kindness', 'Do something unexpectedly kind for someone today', 'Creates positive ripple effects and builds community', '2', 15),
('relationships', 5, 'Quality Question', 'Ask someone a meaningful question about their life or dreams', 'Deepens relationships beyond surface conversations', '3', 20),

-- Home/Environment challenges  
('home', 1, 'Five-Item Declutter', 'Remove 5 items you no longer need from one room', 'Creates space and reduces mental clutter', '1', 15),
('home', 2, 'Morning Bed Making', 'Make your bed immediately after getting up', 'Starts day with accomplishment and order', '1', 5),
('home', 3, 'Digital Inbox Zero', 'Clear your email inbox completely', 'Reduces digital overwhelm and creates mental clarity', '3', 20),
('home', 4, 'Plant Care Moment', 'Water your plants and remove any dead leaves', 'Connects you with nature and creates nurturing habits', '2', 10),
('home', 5, 'Lighting Optimization', 'Adjust lighting in your workspace for comfort and focus', 'Improves mood and productivity through environment', '2', 10),

-- Finance challenges
('finance', 1, 'Expense Awareness', 'Write down every purchase you make today, no matter how small', 'Builds spending awareness and mindful consumption', '2', 10),
('finance', 2, 'Savings Transfer', 'Move $5 to your savings account right now', 'Creates automatic wealth building habit', '1', 5),
('finance', 3, 'Subscription Audit', 'Review and cancel one unused subscription', 'Eliminates money leaks and builds financial awareness', '3', 15),
('finance', 4, 'Price Comparison', 'Compare prices on something you plan to buy this week', 'Develops smart shopping habits and saves money', '2', 15),
('finance', 5, 'Gratitude Budget', 'List 3 things you''re grateful for that money can''t buy', 'Builds appreciation and reduces materialistic desires', '2', 10),

-- Creativity challenges
('creativity', 1, 'Daily Doodle', 'Draw or doodle for 10 minutes without any goal', 'Activates creative neural pathways and reduces perfectionism', '2', 10),
('creativity', 2, 'Photo Walk', 'Take a 15-minute walk and capture 5 interesting photos', 'Trains observation skills and creative perspective', '2', 15),
('creativity', 3, 'Word Association', 'Write 20 words that come to mind about your current mood', 'Unlocks subconscious creativity and self-awareness', '3', 10),
('creativity', 4, 'Color Hunt', 'Find 10 objects around you that are the same color', 'Sharpens visual awareness and mindful observation', '2', 15),
('creativity', 5, 'Story Starter', 'Write the first paragraph of a story about your day', 'Exercises narrative thinking and creative expression', '3', 15),

-- Recovery/Sleep challenges
('recovery', 1, 'Screen Sunset', 'Turn off all screens 1 hour before your target bedtime', 'Improves sleep quality by reducing blue light exposure', '4', 60),
('recovery', 2, 'Gratitude Journal', 'Write 3 things you''re grateful for before bed', 'Promotes positive thinking and better sleep', '1', 10),
('recovery', 3, 'Progressive Relaxation', 'Tense and release each muscle group from toes to head', 'Activates parasympathetic nervous system for better rest', '3', 15),
('recovery', 4, 'Caffeine Cutoff', 'Avoid caffeine after 2 PM today', 'Improves sleep quality and natural energy cycles', '3', 1),
('recovery', 5, 'Wind-Down Ritual', 'Create a 15-minute calming routine before bed', 'Signals your brain it''s time to rest and recover', '3', 15);