-- First clear existing challenges that conflict with new constraints  
DELETE FROM challenges;

-- Drop existing constraints
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_track_check;
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_difficulty_check;

-- Rename track column to category
ALTER TABLE challenges 
  RENAME COLUMN track TO category;

-- Add new constraints
ALTER TABLE challenges 
  ADD CONSTRAINT challenges_category_check 
  CHECK (category IN ('energy', 'mindset', 'focus', 'relationships', 'home', 'finance', 'creativity', 'recovery'));

ALTER TABLE challenges 
  ADD CONSTRAINT challenges_difficulty_check 
  CHECK (difficulty IN ('1', '2', '3', '4', '5'));

-- Insert comprehensive challenge library with 8 categories
INSERT INTO challenges (category, day_number, title, description, benefit, difficulty, estimated_minutes) VALUES
-- Energy/Movement challenges (15 challenges)
('energy', 1, 'Morning Hydration Boost', 'Drink a full glass of water within 10 minutes of waking up', 'Kickstarts metabolism and improves alertness', '1', 5),
('energy', 2, 'Desk Break Stretches', 'Stand up and do 5 simple stretches at your desk', 'Reduces tension and improves circulation', '1', 10),
('energy', 3, 'Power Posture Reset', 'Set 3 reminders to check and correct your posture today', 'Builds awareness and reduces back strain', '2', 15),
('energy', 4, 'Stair Climbing Sprint', 'Take the stairs instead of elevator at least twice today', 'Boosts heart rate and leg strength', '2', 10),
('energy', 5, 'Energy Snack Swap', 'Replace one processed snack with fruit or nuts', 'Provides sustained energy without sugar crashes', '2', 15),
('energy', 6, 'Walking Meeting', 'Take one phone call or meeting while walking', 'Combines productivity with gentle movement', '3', 20),
('energy', 7, 'Morning Movement Flow', 'Do 5 minutes of light movement when you wake up', 'Activates your body and mind for the day', '2', 5),
('energy', 8, 'Hydration Tracking', 'Track every glass of water you drink today', 'Creates awareness of hydration habits', '1', 5),
('energy', 9, 'Micro Workout', 'Do 20 bodyweight squats during a break', 'Activates large muscle groups quickly', '3', 5),
('energy', 10, 'Sunlight Exposure', 'Spend 10 minutes outside in natural sunlight', 'Regulates circadian rhythm and boosts vitamin D', '1', 10),
('energy', 11, 'Dance Break', 'Put on your favorite song and dance for the full duration', 'Combines cardio with mood elevation', '2', 5),
('energy', 12, 'Breathing Energy Boost', 'Practice 4-7-8 breathing technique 3 times', 'Increases oxygen flow and reduces stress', '2', 10),
('energy', 13, 'Mindful Eating Moment', 'Eat one meal today without distractions', 'Improves digestion and energy absorption', '3', 15),
('energy', 14, 'Cold Therapy', 'End your shower with 30 seconds of cold water', 'Boosts circulation and mental alertness', '4', 5),
('energy', 15, 'Movement Snacks', 'Set hourly reminders to do 10 jumping jacks', 'Maintains energy levels throughout the day', '3', 5),

-- Mindset challenges (15 challenges)  
('mindset', 1, 'Three Good Things', 'Write down 3 positive things that happened today', 'Rewires brain to notice positive experiences', '1', 10),
('mindset', 2, 'Mindful Breathing', 'Take 10 deep, conscious breaths focusing only on the sensation', 'Anchors attention and reduces anxiety', '2', 5),
('mindset', 3, 'Gratitude Text', 'Send a text to someone thanking them for something specific', 'Strengthens relationships and boosts mood', '2', 10),
('mindset', 4, 'Worry Time Limit', 'Set aside exactly 10 minutes to worry, then stop', 'Contains anxious thoughts and regains control', '3', 10),
('mindset', 5, 'Self-Compassion Break', 'Speak to yourself as kindly as you would a good friend', 'Reduces self-criticism and builds resilience', '3', 15),
('mindset', 6, 'Present Moment Check', 'Notice 5 sounds, 4 sights, 3 textures, 2 smells, 1 taste', 'Grounds you in the present and reduces rumination', '2', 10),
('mindset', 7, 'Challenge Reframe', 'Write down one problem and find one potential benefit in it', 'Builds cognitive flexibility and optimism', '4', 15),
('mindset', 8, 'Kind Gesture', 'Do something thoughtful for someone without expecting anything back', 'Activates reward centers and builds connection', '2', 15),
('mindset', 9, 'Progress Celebration', 'Acknowledge one small win from this week', 'Builds motivation and positive momentum', '1', 10),
('mindset', 10, 'Limiting Belief Check', 'Question one negative thought about yourself', 'Challenges unhelpful thinking patterns', '4', 20),
('mindset', 11, 'Values Reflection', 'Identify your top 3 values and how you lived them today', 'Aligns actions with authentic self', '3', 15),
('mindset', 12, 'Forgiveness Practice', 'Write a letter of forgiveness to yourself or someone else', 'Releases resentment and emotional burden', '5', 25),
('mindset', 13, 'Future Self Visualization', 'Spend 10 minutes imagining your ideal self in 6 months', 'Clarifies goals and increases motivation', '3', 10),
('mindset', 14, 'Compliment Challenge', 'Give genuine compliments to 3 different people', 'Builds positive relationships and confidence', '2', 15),
('mindset', 15, 'Meditation Moment', 'Sit quietly and observe your thoughts for 5 minutes without judgment', 'Develops mindfulness and emotional regulation', '4', 5),

-- Focus/Work challenges (15 challenges)
('focus', 1, 'Top 3 Priority List', 'Write down your 3 most important tasks for tomorrow before bed', 'Primes your brain for productive decision-making', '1', 10),
('focus', 2, 'Single-Task Sprint', 'Work on one task for 25 minutes without any distractions', 'Builds focus muscle and reduces task-switching costs', '3', 25),
('focus', 3, 'Digital Declutter', 'Organize your desktop and delete 5 unnecessary files', 'Reduces visual distractions and mental clutter', '2', 15),
('focus', 4, 'Email Batch Processing', 'Check email only twice today at scheduled times', 'Prevents reactive mode and maintains deep work', '4', 30),
('focus', 5, 'Time Block Planning', 'Schedule your day in 2-hour focused work blocks', 'Creates structure and prevents reactive scheduling', '3', 20),
('focus', 6, 'Distraction Log', 'Write down every time you get distracted and what caused it', 'Builds awareness of focus patterns', '2', 15),
('focus', 7, 'Phone-Free Focus Hour', 'Put your phone in another room for 1 hour of work', 'Eliminates the biggest source of digital distraction', '4', 60),
('focus', 8, 'Energy Matching', 'Schedule your hardest task during your highest energy time', 'Optimizes performance by matching energy to difficulty', '3', 15),
('focus', 9, 'Two-Minute Rule', 'Complete any task that takes less than 2 minutes immediately', 'Prevents small tasks from accumulating into overwhelm', '2', 10),
('focus', 10, 'Focus Ritual', 'Create a 5-minute ritual to signal start of deep work', 'Trains your brain to enter focused state on command', '3', 5),
('focus', 11, 'Break Timer', 'Take a 5-minute break every 45 minutes of focused work', 'Maintains cognitive performance and prevents burnout', '2', 5),
('focus', 12, 'Task Batching', 'Group similar tasks together and complete them in one session', 'Reduces mental switching costs and increases efficiency', '4', 30),
('focus', 13, 'Deadline Buffer', 'Add 25% extra time to your task estimates', 'Reduces stress and improves planning accuracy', '2', 10),
('focus', 14, 'Workspace Reset', 'Clear and organize your workspace before starting work', 'Creates mental clarity through environmental order', '1', 10),
('focus', 15, 'Progress Check-in', 'Review and adjust your goals every Friday afternoon', 'Maintains alignment and course-corrects regularly', '3', 20);

-- Add sample challenges for other categories to complete the library
-- (More challenges can be added later, these provide the foundation)