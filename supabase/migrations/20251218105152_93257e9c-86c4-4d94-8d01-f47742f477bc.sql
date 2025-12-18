-- Create buddy preferences table
CREATE TABLE public.buddy_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  preferred_times TEXT[] DEFAULT '{}',
  preferred_days INTEGER[] DEFAULT '{}',
  workout_types TEXT[] DEFAULT '{}',
  looking_for_buddy BOOLEAN DEFAULT true,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create buddy connections table
CREATE TABLE public.buddy_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, receiver_id)
);

-- Create email notifications preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  class_reminders BOOLEAN DEFAULT true,
  achievement_alerts BOOLEAN DEFAULT true,
  buddy_requests BOOLEAN DEFAULT true,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.buddy_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Buddy preferences policies
CREATE POLICY "Users can view all buddy profiles looking for buddies"
ON public.buddy_preferences FOR SELECT
USING (looking_for_buddy = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own buddy preferences"
ON public.buddy_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own buddy preferences"
ON public.buddy_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Buddy connections policies
CREATE POLICY "Users can view own connections"
ON public.buddy_connections FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send buddy requests"
ON public.buddy_connections FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update connections they're part of"
ON public.buddy_connections FOR UPDATE
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Notification preferences policies
CREATE POLICY "Users can view own notification preferences"
ON public.notification_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notification preferences"
ON public.notification_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
ON public.notification_preferences FOR UPDATE
USING (auth.uid() = user_id);