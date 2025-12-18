-- Create gym occupancy table to track check-ins/check-outs
CREATE TABLE public.gym_occupancy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  check_out_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gym stats table for storing hourly averages (for predictions)
CREATE TABLE public.gym_hourly_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  avg_occupancy NUMERIC DEFAULT 0,
  sample_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(day_of_week, hour_of_day)
);

-- Enable RLS
ALTER TABLE public.gym_occupancy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_hourly_stats ENABLE ROW LEVEL SECURITY;

-- Policies for gym_occupancy
CREATE POLICY "Users can view all active check-ins for crowd count"
ON public.gym_occupancy FOR SELECT
USING (true);

CREATE POLICY "Users can check themselves in"
ON public.gym_occupancy FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can check themselves out"
ON public.gym_occupancy FOR UPDATE
USING (auth.uid() = user_id);

-- Policies for gym_hourly_stats (read only for users)
CREATE POLICY "Anyone can view hourly stats"
ON public.gym_hourly_stats FOR SELECT
USING (true);

-- Allow admins to manage stats
CREATE POLICY "Admins can manage hourly stats"
ON public.gym_hourly_stats FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed hourly stats with initial data for predictions
INSERT INTO public.gym_hourly_stats (day_of_week, hour_of_day, avg_occupancy, sample_count)
SELECT 
  dow,
  hour,
  CASE 
    WHEN hour BETWEEN 6 AND 8 THEN 15 + RANDOM() * 10
    WHEN hour BETWEEN 9 AND 11 THEN 8 + RANDOM() * 5
    WHEN hour BETWEEN 12 AND 14 THEN 20 + RANDOM() * 15
    WHEN hour BETWEEN 17 AND 19 THEN 35 + RANDOM() * 15
    WHEN hour BETWEEN 20 AND 21 THEN 20 + RANDOM() * 10
    ELSE 5 + RANDOM() * 5
  END,
  10
FROM generate_series(0, 6) AS dow
CROSS JOIN generate_series(6, 22) AS hour;

-- Enable realtime for occupancy
ALTER PUBLICATION supabase_realtime ADD TABLE public.gym_occupancy;