-- Add recurring class fields to fitness_classes table
ALTER TABLE public.fitness_classes 
ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurrence_days INTEGER[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS parent_class_id UUID REFERENCES public.fitness_classes(id) ON DELETE SET NULL;

-- Add index for parent class lookup
CREATE INDEX IF NOT EXISTS idx_fitness_classes_parent ON public.fitness_classes(parent_class_id);

-- Add comment explaining recurrence_type values
COMMENT ON COLUMN public.fitness_classes.recurrence_type IS 'Values: weekly, biweekly, monthly, or null for one-time classes';
COMMENT ON COLUMN public.fitness_classes.recurrence_days IS 'Array of day numbers (0=Sunday, 1=Monday, etc.) for weekly/biweekly recurrence';