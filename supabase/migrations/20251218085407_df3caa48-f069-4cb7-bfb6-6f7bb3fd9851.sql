-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  fitness_level TEXT DEFAULT 'beginner' CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  goals TEXT,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  last_check_in TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Create workouts table
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  duration_minutes INTEGER,
  points_earned INTEGER DEFAULT 10,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workout_exercises table
CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight DECIMAL(10,2),
  is_pr BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fitness_classes table
CREATE TABLE public.fitness_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  instructor TEXT,
  capacity INTEGER DEFAULT 20,
  duration_minutes INTEGER DEFAULT 60,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  points_reward INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class_bookings table
CREATE TABLE public.class_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.fitness_classes(id) ON DELETE CASCADE NOT NULL,
  attended BOOLEAN DEFAULT FALSE,
  booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, class_id)
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  category TEXT CHECK (category IN ('streak', 'workout', 'social', 'milestone', 'special')),
  points_value INTEGER DEFAULT 50,
  criteria JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

-- Create challenges table
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_reward INTEGER DEFAULT 100,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  target_value INTEGER DEFAULT 1,
  challenge_type TEXT CHECK (challenge_type IN ('workouts', 'classes', 'streak', 'points')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenge_participants table
CREATE TABLE public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, challenge_id)
);

-- Create point_transactions table (audit log)
CREATE TABLE public.point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL,
  source_type TEXT CHECK (source_type IN ('workout', 'class', 'achievement', 'challenge', 'check_in', 'bonus')),
  source_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- Create has_role function for secure admin checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update profile points
CREATE OR REPLACE FUNCTION public.update_user_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET total_points = total_points + NEW.points,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Trigger for point transactions
CREATE TRIGGER on_point_transaction_created
  AFTER INSERT ON public.point_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_user_points();

-- Create function to log points when workout is completed
CREATE OR REPLACE FUNCTION public.log_workout_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.point_transactions (user_id, points, source_type, source_id, description)
  VALUES (NEW.user_id, NEW.points_earned, 'workout', NEW.id, 'Completed workout: ' || NEW.name);
  
  RETURN NEW;
END;
$$;

-- Trigger for workout completion points
CREATE TRIGGER on_workout_created
  AFTER INSERT ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.log_workout_points();

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for workouts
CREATE POLICY "Users can view own workouts" ON public.workouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own workouts" ON public.workouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workouts" ON public.workouts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workouts" ON public.workouts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for workout_exercises
CREATE POLICY "Users can view own exercises" ON public.workout_exercises FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.workouts WHERE id = workout_id AND user_id = auth.uid()));
CREATE POLICY "Users can create own exercises" ON public.workout_exercises FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.workouts WHERE id = workout_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own exercises" ON public.workout_exercises FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.workouts WHERE id = workout_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own exercises" ON public.workout_exercises FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.workouts WHERE id = workout_id AND user_id = auth.uid()));

-- RLS Policies for fitness_classes (public read, admin write)
CREATE POLICY "Anyone can view active classes" ON public.fitness_classes FOR SELECT TO authenticated USING (is_active = TRUE);
CREATE POLICY "Admins can manage classes" ON public.fitness_classes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for class_bookings
CREATE POLICY "Users can view own bookings" ON public.class_bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bookings" ON public.class_bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookings" ON public.class_bookings FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all bookings" ON public.class_bookings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update bookings" ON public.class_bookings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can manage achievements" ON public.achievements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view others achievements for leaderboard" ON public.user_achievements FOR SELECT TO authenticated USING (TRUE);

-- RLS Policies for challenges (public read)
CREATE POLICY "Anyone can view active challenges" ON public.challenges FOR SELECT TO authenticated USING (is_active = TRUE);
CREATE POLICY "Admins can manage challenges" ON public.challenges FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for challenge_participants
CREATE POLICY "Users can view own participation" ON public.challenge_participants FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can join challenges" ON public.challenge_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view leaderboard" ON public.challenge_participants FOR SELECT TO authenticated USING (TRUE);

-- RLS Policies for point_transactions
CREATE POLICY "Users can view own transactions" ON public.point_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, points_value, criteria) VALUES
('First Steps', 'Complete your first workout', '🎯', 'milestone', 25, '{"workouts": 1}'),
('Iron Will', 'Maintain a 7-day workout streak', '💪', 'streak', 100, '{"streak": 7}'),
('Dedicated', 'Maintain a 30-day workout streak', '🔥', 'streak', 500, '{"streak": 30}'),
('Early Bird', 'Complete 5 workouts before 8 AM', '🌅', 'workout', 75, '{"early_workouts": 5}'),
('Class Regular', 'Attend 10 fitness classes', '🧘', 'workout', 150, '{"classes": 10}'),
('Century Club', 'Earn 100 total points', '💯', 'milestone', 50, '{"points": 100}'),
('Social Butterfly', 'Work out with 5 different buddies', '🦋', 'social', 100, '{"buddies": 5}'),
('Challenge Champion', 'Win 3 challenges', '🏆', 'special', 250, '{"challenges_won": 3}');

-- Insert sample challenge
INSERT INTO public.challenges (name, description, points_reward, start_date, end_date, target_value, challenge_type) VALUES
('New Year Strong', 'Complete 10 workouts this month', 200, NOW(), NOW() + INTERVAL '30 days', 10, 'workouts');