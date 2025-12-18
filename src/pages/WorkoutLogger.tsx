import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Trophy, 
  Dumbbell,
  Loader2,
  Sparkles,
  Save,
  AlertCircle
} from "lucide-react";
import { CardSkeleton } from "@/components/animations/SkeletonLoader";
import { BottomNav } from "@/components/BottomNav";
import { Confetti } from "@/components/animations/Confetti";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@supabase/supabase-js";

interface Exercise {
  id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  is_pr: boolean;
}

interface PreviousBest {
  exercise_name: string;
  max_weight: number;
}

const WorkoutLogger = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; exercises?: string }>({});
  
  const workoutNameRef = useRef<HTMLInputElement>(null);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([
    { id: crypto.randomUUID(), exercise_name: "", sets: 3, reps: 10, weight: 0, is_pr: false }
  ]);
  const [previousBests, setPreviousBests] = useState<PreviousBest[]>([]);

  useEffect(() => {
    if (!loading && workoutNameRef.current) {
      workoutNameRef.current.focus();
    }
  }, [loading]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchPreviousBests(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchPreviousBests = async (userId: string) => {
    try {
      const { data: workouts } = await supabase
        .from("workouts")
        .select("id")
        .eq("user_id", userId);

      if (workouts && workouts.length > 0) {
        const workoutIds = workouts.map(w => w.id);
        const { data: exerciseData } = await supabase
          .from("workout_exercises")
          .select("exercise_name, weight")
          .in("workout_id", workoutIds);

        if (exerciseData) {
          const bestsByExercise: { [key: string]: number } = {};
          exerciseData.forEach(ex => {
            const name = ex.exercise_name.toLowerCase();
            const weight = Number(ex.weight) || 0;
            if (!bestsByExercise[name] || weight > bestsByExercise[name]) {
              bestsByExercise[name] = weight;
            }
          });

          setPreviousBests(
            Object.entries(bestsByExercise).map(([exercise_name, max_weight]) => ({
              exercise_name,
              max_weight
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching previous bests:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkForPR = (exerciseName: string, weight: number): boolean => {
    if (!exerciseName || weight <= 0) return false;
    const previous = previousBests.find(
      pb => pb.exercise_name === exerciseName.toLowerCase()
    );
    return !previous || weight > previous.max_weight;
  };

  const updateExercise = (id: string, field: keyof Exercise, value: string | number | boolean) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== id) return ex;
      const updated = { ...ex, [field]: value };
      if (field === "weight" || field === "exercise_name") {
        const weight = field === "weight" ? Number(value) : ex.weight;
        const name = field === "exercise_name" ? String(value) : ex.exercise_name;
        updated.is_pr = checkForPR(name, weight);
      }
      return updated;
    }));
  };

  const addExercise = () => {
    setExercises(prev => [
      ...prev,
      { id: crypto.randomUUID(), exercise_name: "", sets: 3, reps: 10, weight: 0, is_pr: false }
    ]);
  };

  const removeExercise = (id: string) => {
    if (exercises.length === 1) return;
    setExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!user) return;
    
    const newErrors: { name?: string; exercises?: string } = {};
    if (!workoutName.trim()) newErrors.name = "Please enter a workout name";
    const validExercises = exercises.filter(ex => ex.exercise_name.trim());
    if (validExercises.length === 0) newErrors.exercises = "Please add at least one exercise";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({ title: "Missing information", description: "Please fill in the required fields.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const prCount = validExercises.filter(ex => ex.is_pr).length;
      const pointsEarned = 10 + (validExercises.length * 5) + (prCount * 20);

      const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert({ user_id: user.id, name: workoutName.trim(), notes: workoutNotes.trim() || null, duration_minutes: null, points_earned: pointsEarned })
        .select()
        .single();

      if (workoutError) throw workoutError;

      const exercisesToInsert = validExercises.map(ex => ({
        workout_id: workout.id, exercise_name: ex.exercise_name.trim(), sets: ex.sets, reps: ex.reps, weight: ex.weight || null, is_pr: ex.is_pr,
      }));

      const { error: exercisesError } = await supabase.from("workout_exercises").insert(exercisesToInsert);
      if (exercisesError) throw exercisesError;

      if (prCount > 0) setShowConfetti(true);
      toast({ title: "Workout logged! 💪", description: `Earned ${pointsEarned} points.${prCount > 0 ? ` You hit ${prCount} PR${prCount > 1 ? 's' : ''}! 🎉` : ''}` });
      setTimeout(() => navigate("/dashboard"), prCount > 0 ? 2000 : 500);
    } catch (error: any) {
      toast({ title: "Error saving workout", description: error.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-2xl space-y-6">
          <CardSkeleton />
          <CardSkeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Confetti active={showConfetti} />
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">Log Workout</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Workout Details
            </h2>
            <div className="space-y-2">
              <Label>Workout Name <span className="text-destructive">*</span></Label>
              <Input
                ref={workoutNameRef}
                placeholder="e.g., Upper Body Push Day"
                value={workoutName}
                onChange={(e) => { setWorkoutName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })); }}
                className={`h-12 bg-secondary/50 ${errors.name ? 'border-destructive' : ''}`}
                maxLength={100}
              />
              <div className="flex justify-between">
                {errors.name && <span className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</span>}
                <span className="text-xs text-muted-foreground ml-auto">{workoutName.length}/100</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea placeholder="How did it feel?" value={workoutNotes} onChange={(e) => setWorkoutNotes(e.target.value)} className="bg-secondary/50 min-h-[80px]" maxLength={500} />
              <div className="flex justify-end"><span className="text-xs text-muted-foreground">{workoutNotes.length}/500</span></div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-accent" />
                Exercises <span className="text-destructive">*</span>
              </h2>
              <Button type="button" variant="outline" size="sm" onClick={addExercise}><Plus className="w-4 h-4 mr-1" />Add</Button>
            </div>
            {errors.exercises && <span className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.exercises}</span>}
            
            <AnimatePresence mode="popLayout">
              {exercises.map((exercise, index) => (
                <motion.div key={exercise.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} className={`glass rounded-2xl p-5 space-y-4 ${exercise.is_pr ? 'ring-2 ring-warning/50 bg-warning/5' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Exercise {index + 1}</span>
                      {exercise.is_pr && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/20 text-warning text-xs font-medium animate-pulse"><Trophy className="w-3 h-3" />NEW PR!</span>}
                    </div>
                    {exercises.length > 1 && <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeExercise(exercise.id)}><Trash2 className="w-4 h-4" /></Button>}
                  </div>
                  <Input placeholder="e.g., Bench Press" value={exercise.exercise_name} onChange={(e) => updateExercise(exercise.id, "exercise_name", e.target.value)} className="h-11 bg-secondary/50" />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2"><Label>Sets</Label><Input type="number" min="1" value={exercise.sets} onChange={(e) => updateExercise(exercise.id, "sets", parseInt(e.target.value) || 1)} className="h-11 bg-secondary/50 text-center" /></div>
                    <div className="space-y-2"><Label>Reps</Label><Input type="number" min="1" value={exercise.reps} onChange={(e) => updateExercise(exercise.id, "reps", parseInt(e.target.value) || 1)} className="h-11 bg-secondary/50 text-center" /></div>
                    <div className="space-y-2"><Label>Weight (kg)</Label><Input type="number" min="0" step="0.5" value={exercise.weight || ""} onChange={(e) => updateExercise(exercise.id, "weight", parseFloat(e.target.value) || 0)} className="h-11 bg-secondary/50 text-center" placeholder="0" /></div>
                  </div>
                  {exercise.exercise_name && previousBests.find(pb => pb.exercise_name === exercise.exercise_name.toLowerCase()) && (
                    <div className="text-xs text-muted-foreground">Previous best: <span className="text-foreground font-medium">{previousBests.find(pb => pb.exercise_name === exercise.exercise_name.toLowerCase())?.max_weight} kg</span></div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <Button type="submit" disabled={saving} className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-semibold">
            {saving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Saving...</> : <><Save className="w-5 h-5 mr-2" />Save Workout</>}
          </Button>
        </form>
      </main>
      <BottomNav />
    </div>
  );
};

export default WorkoutLogger;
