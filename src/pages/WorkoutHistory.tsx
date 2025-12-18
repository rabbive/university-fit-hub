import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format, parseISO } from "date-fns";
import { 
  ArrowLeft, 
  History,
  Dumbbell,
  Trophy,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  Target,
  TrendingUp
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Exercise {
  id: string;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  is_pr: boolean | null;
}

interface Workout {
  id: string;
  name: string;
  notes: string | null;
  duration_minutes: number | null;
  points_earned: number | null;
  completed_at: string;
  exercises: Exercise[];
}

const WorkoutHistory = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalExercises: 0,
    totalPRs: 0,
    totalPoints: 0
  });

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
        fetchWorkoutHistory(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchWorkoutHistory = async (userId: string) => {
    try {
      // Fetch all workouts
      const { data: workoutsData, error: workoutsError } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false });

      if (workoutsError) throw workoutsError;

      // Fetch exercises for all workouts
      const workoutIds = workoutsData?.map(w => w.id) || [];
      
      let exercisesData: Exercise[] = [];
      if (workoutIds.length > 0) {
        const { data, error } = await supabase
          .from("workout_exercises")
          .select("*")
          .in("workout_id", workoutIds);
        
        if (!error && data) {
          exercisesData = data;
        }
      }

      // Group exercises by workout
      const exercisesByWorkout = exercisesData.reduce((acc, ex: any) => {
        if (!acc[ex.workout_id]) acc[ex.workout_id] = [];
        acc[ex.workout_id].push(ex);
        return acc;
      }, {} as Record<string, Exercise[]>);

      // Combine workouts with exercises
      const workoutsWithExercises = (workoutsData || []).map(workout => ({
        ...workout,
        exercises: exercisesByWorkout[workout.id] || []
      }));

      setWorkouts(workoutsWithExercises);

      // Calculate stats
      const totalPRs = exercisesData.filter(e => e.is_pr).length;
      const totalPoints = workoutsData?.reduce((sum, w) => sum + (w.points_earned || 0), 0) || 0;

      setStats({
        totalWorkouts: workoutsData?.length || 0,
        totalExercises: exercisesData.length,
        totalPRs,
        totalPoints
      });
    } catch (error) {
      console.error("Error fetching workout history:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkouts = workouts.filter(workout => 
    workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workout.exercises.some(ex => 
      ex.exercise_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const toggleWorkout = (workoutId: string) => {
    setExpandedWorkout(prev => prev === workoutId ? null : workoutId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <History className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">Workout History</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-3xl">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="glass rounded-xl p-4 text-center border border-border/50">
            <Target className="w-5 h-5 text-primary mx-auto mb-2" />
            <div className="font-display text-xl font-bold text-foreground">{stats.totalWorkouts}</div>
            <div className="text-xs text-muted-foreground">Workouts</div>
          </div>
          <div className="glass rounded-xl p-4 text-center border border-border/50">
            <Dumbbell className="w-5 h-5 text-accent mx-auto mb-2" />
            <div className="font-display text-xl font-bold text-foreground">{stats.totalExercises}</div>
            <div className="text-xs text-muted-foreground">Exercises</div>
          </div>
          <div className="glass rounded-xl p-4 text-center border border-border/50">
            <TrendingUp className="w-5 h-5 text-warning mx-auto mb-2" />
            <div className="font-display text-xl font-bold text-foreground">{stats.totalPRs}</div>
            <div className="text-xs text-muted-foreground">PRs</div>
          </div>
          <div className="glass rounded-xl p-4 text-center border border-border/50">
            <Trophy className="w-5 h-5 text-energy mx-auto mb-2" />
            <div className="font-display text-xl font-bold text-foreground">{stats.totalPoints}</div>
            <div className="text-xs text-muted-foreground">Points</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search workouts or exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-secondary/50 border-border/50"
          />
        </div>

        {/* Workouts List */}
        {filteredWorkouts.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border border-border/50">
            <History className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              {workouts.length === 0 ? "No Workouts Yet" : "No Results Found"}
            </h3>
            <p className="text-muted-foreground">
              {workouts.length === 0 
                ? "Start logging workouts to see your history here."
                : "Try a different search term."
              }
            </p>
            {workouts.length === 0 && (
              <Button 
                onClick={() => navigate("/workout/log")}
                className="mt-4"
              >
                Log Your First Workout
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWorkouts.map((workout) => {
              const isExpanded = expandedWorkout === workout.id;
              const prCount = workout.exercises.filter(e => e.is_pr).length;
              
              return (
                <Collapsible key={workout.id} open={isExpanded}>
                  <div className={`glass rounded-xl border transition-all ${
                    isExpanded ? "border-primary/30" : "border-border/50"
                  }`}>
                    <CollapsibleTrigger asChild>
                      <button
                        onClick={() => toggleWorkout(workout.id)}
                        className="w-full p-4 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Dumbbell className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground flex items-center gap-2">
                                {workout.name}
                                {prCount > 0 && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-warning/20 text-warning">
                                    {prCount} PR{prCount > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(parseISO(workout.completed_at), "MMM d, yyyy 'at' h:mm a")}
                                </span>
                                <span>{workout.exercises.length} exercises</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-primary">
                              +{workout.points_earned || 0} pts
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2 border-t border-border/50 mt-2">
                        {workout.notes && (
                          <p className="text-sm text-muted-foreground mb-4 italic">
                            "{workout.notes}"
                          </p>
                        )}
                        
                        <div className="space-y-2">
                          {workout.exercises.map((exercise) => (
                            <div 
                              key={exercise.id}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                exercise.is_pr 
                                  ? "bg-warning/10 border border-warning/20" 
                                  : "bg-secondary/30"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="font-medium text-foreground">
                                  {exercise.exercise_name}
                                </div>
                                {exercise.is_pr && (
                                  <Trophy className="w-4 h-4 text-warning" />
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {exercise.sets && `${exercise.sets} sets`}
                                {exercise.reps && ` × ${exercise.reps} reps`}
                                {exercise.weight && ` @ ${exercise.weight}kg`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkoutHistory;
