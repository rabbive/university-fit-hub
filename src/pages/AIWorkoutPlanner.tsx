import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Sparkles,
  Loader2,
  Dumbbell,
  Target,
  Calendar,
  RefreshCw
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

const fitnessLevels = [
  { value: "beginner", label: "Beginner", description: "New to working out or returning after a long break" },
  { value: "intermediate", label: "Intermediate", description: "Consistent training for 6+ months" },
  { value: "advanced", label: "Advanced", description: "Years of training experience" },
];

const goalOptions = [
  { value: "build_muscle", label: "Build Muscle", icon: "💪" },
  { value: "lose_fat", label: "Lose Fat", icon: "🔥" },
  { value: "increase_strength", label: "Increase Strength", icon: "🏋️" },
  { value: "improve_endurance", label: "Improve Endurance", icon: "🏃" },
  { value: "general_fitness", label: "General Fitness", icon: "⚡" },
];

const focusAreaOptions = [
  { value: "upper_body", label: "Upper Body" },
  { value: "lower_body", label: "Lower Body" },
  { value: "core", label: "Core" },
  { value: "full_body", label: "Full Body" },
  { value: "cardio", label: "Cardio" },
  { value: "flexibility", label: "Flexibility" },
];

const daysOptions = [
  { value: 2, label: "2 days" },
  { value: 3, label: "3 days" },
  { value: 4, label: "4 days" },
  { value: 5, label: "5 days" },
  { value: 6, label: "6 days" },
];

const AIWorkoutPlanner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const [fitnessLevel, setFitnessLevel] = useState("beginner");
  const [goals, setGoals] = useState<string[]>([]);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [focusAreas, setFocusAreas] = useState<string[]>(["full_body"]);
  const [restrictions, setRestrictions] = useState("");
  
  const [workoutPlan, setWorkoutPlan] = useState<string | null>(null);

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
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const toggleGoal = (goal: string) => {
    setGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const handleGenerate = async () => {
    if (goals.length === 0) {
      toast({
        title: "Select your goals",
        description: "Please select at least one fitness goal.",
        variant: "destructive",
      });
      return;
    }

    if (focusAreas.length === 0) {
      toast({
        title: "Select focus areas",
        description: "Please select at least one focus area.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setWorkoutPlan(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-workout-plan", {
        body: {
          fitnessLevel,
          goals: goals.map(g => goalOptions.find(o => o.value === g)?.label).join(", "),
          daysPerWeek,
          focusAreas: focusAreas.map(a => focusAreaOptions.find(o => o.value === a)?.label || a),
          restrictions: restrictions.trim() || null,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setWorkoutPlan(data.workoutPlan);
      toast({
        title: "Plan generated! 🎉",
        description: "Your personalized workout plan is ready.",
      });
    } catch (error: any) {
      console.error("Error generating plan:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Could not generate workout plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning to-energy flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-warning-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">AI Workout Planner</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {!workoutPlan ? (
          <div className="space-y-8">
            {/* Intro */}
            <div className="text-center">
              <h1 className="font-display text-3xl font-bold text-foreground mb-3">
                Get Your Personalized Workout Plan
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Tell us about your fitness level and goals, and our AI will create a customized weekly workout plan just for you.
              </p>
            </div>

            {/* Form */}
            <div className="space-y-8">
              {/* Fitness Level */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">Fitness Level</h2>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {fitnessLevels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setFitnessLevel(level.value)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        fitnessLevel === level.value
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                          : "border-border/50 bg-secondary/30 hover:bg-secondary/50"
                      }`}
                    >
                      <div className="font-semibold text-foreground">{level.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Goals */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Dumbbell className="w-5 h-5 text-accent" />
                  <h2 className="font-display text-lg font-semibold text-foreground">Goals</h2>
                  <span className="text-xs text-muted-foreground">(select all that apply)</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {goalOptions.map((goal) => (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => toggleGoal(goal.value)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                        goals.includes(goal.value)
                          ? "border-accent bg-accent/10 ring-2 ring-accent/20"
                          : "border-border/50 bg-secondary/30 hover:bg-secondary/50"
                      }`}
                    >
                      <span className="text-lg">{goal.icon}</span>
                      <span className="font-medium text-foreground">{goal.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Days per week */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-energy" />
                  <h2 className="font-display text-lg font-semibold text-foreground">Days Per Week</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {daysOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDaysPerWeek(option.value)}
                      className={`px-5 py-2.5 rounded-xl border font-medium transition-all ${
                        daysPerWeek === option.value
                          ? "border-energy bg-energy/10 ring-2 ring-energy/20 text-foreground"
                          : "border-border/50 bg-secondary/30 hover:bg-secondary/50 text-foreground"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus Areas */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">Focus Areas</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {focusAreaOptions.map((area) => (
                    <button
                      key={area.value}
                      type="button"
                      onClick={() => toggleFocusArea(area.value)}
                      className={`px-4 py-2 rounded-xl border font-medium transition-all ${
                        focusAreas.includes(area.value)
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20 text-foreground"
                          : "border-border/50 bg-secondary/30 hover:bg-secondary/50 text-foreground"
                      }`}
                    >
                      {area.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Restrictions */}
              <div className="glass rounded-2xl p-6">
                <Label htmlFor="restrictions" className="flex items-center gap-2 mb-3">
                  <span className="text-lg">⚠️</span>
                  <span className="font-display text-lg font-semibold text-foreground">Any Limitations?</span>
                  <span className="text-xs text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="restrictions"
                  placeholder="E.g., bad knees, no equipment at home, limited time per session..."
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                  className="bg-secondary/50 border-border/50 min-h-[80px]"
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full h-14 bg-gradient-to-r from-warning to-energy hover:opacity-90 text-lg font-semibold"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Your Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate My Workout Plan
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Plan Header */}
            <div className="flex items-center justify-between">
              <h1 className="font-display text-2xl font-bold text-foreground">Your Personalized Plan</h1>
              <Button
                variant="outline"
                onClick={() => setWorkoutPlan(null)}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Create New Plan
              </Button>
            </div>

            {/* Plan Content */}
            <div className="glass rounded-2xl p-6 md:p-8">
              <div className="prose prose-invert max-w-none">
                <div 
                  className="text-foreground whitespace-pre-wrap leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: workoutPlan
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>')
                      .replace(/^### (.*$)/gm, '<h3 class="font-display text-xl font-semibold text-foreground mt-6 mb-3">$1</h3>')
                      .replace(/^## (.*$)/gm, '<h2 class="font-display text-2xl font-bold text-foreground mt-8 mb-4">$1</h2>')
                      .replace(/^# (.*$)/gm, '<h1 class="font-display text-3xl font-bold text-foreground mt-8 mb-4">$1</h1>')
                      .replace(/^- (.*$)/gm, '<li class="text-foreground ml-4">$1</li>')
                      .replace(/^(\d+)\. (.*$)/gm, '<li class="text-foreground ml-4"><span class="text-primary font-semibold">$1.</span> $2</li>')
                  }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => navigate("/workout/log")}
                className="flex-1 h-12 bg-primary hover:bg-primary/90"
              >
                <Dumbbell className="w-5 h-5 mr-2" />
                Start Logging Workouts
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="h-12"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AIWorkoutPlanner;
