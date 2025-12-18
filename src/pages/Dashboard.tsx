import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Dumbbell, 
  LogOut, 
  Trophy, 
  Target, 
  Calendar,
  Sparkles,
  TrendingUp,
  Flame,
  Medal,
  Users,
  Swords,
  User,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface RecentWorkout {
  id: string;
  name: string;
  points_earned: number;
  completed_at: string;
  exercise_count: number;
}

interface UpcomingClass {
  id: string;
  name: string;
  scheduled_at: string;
  instructor: string | null;
  location: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    prsThisMonth: 0,
    classesBooked: 0,
  });
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);

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
        fetchDashboardData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchDashboardData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      setProfile(profileData);

      // Fetch workouts count
      const { count: workoutCount } = await supabase
        .from("workouts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Fetch recent workouts with exercise count
      const { data: workoutsData } = await supabase
        .from("workouts")
        .select("id, name, points_earned, completed_at")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(3);

      if (workoutsData) {
        const workoutsWithCounts = await Promise.all(
          workoutsData.map(async (workout) => {
            const { count } = await supabase
              .from("workout_exercises")
              .select("*", { count: "exact", head: true })
              .eq("workout_id", workout.id);
            return { ...workout, exercise_count: count || 0 };
          })
        );
        setRecentWorkouts(workoutsWithCounts);
      }

      // Fetch PRs this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const workoutIds = workoutsData?.map(w => w.id) || [];
      let prCount = 0;
      if (workoutIds.length > 0) {
        const { count } = await supabase
          .from("workout_exercises")
          .select("*", { count: "exact", head: true })
          .in("workout_id", workoutIds)
          .eq("is_pr", true);
        prCount = count || 0;
      }

      // Fetch booked classes
      const { data: bookingsData } = await supabase
        .from("class_bookings")
        .select("class_id, fitness_classes(id, name, scheduled_at, instructor, location)")
        .eq("user_id", userId);

      const bookedClassIds = bookingsData?.map(b => b.class_id) || [];

      // Fetch upcoming booked classes
      const { data: upcomingData } = await supabase
        .from("fitness_classes")
        .select("id, name, scheduled_at, instructor, location")
        .in("id", bookedClassIds.length > 0 ? bookedClassIds : ['00000000-0000-0000-0000-000000000000'])
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(3);

      setUpcomingClasses(upcomingData || []);

      setStats({
        totalWorkouts: workoutCount || 0,
        prsThisMonth: prCount,
        classesBooked: bookedClassIds.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/");
  };

  const formatClassDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return `Today, ${format(date, "h:mm a")}`;
    if (isTomorrow(date)) return `Tomorrow, ${format(date, "h:mm a")}`;
    return format(date, "EEE, MMM d 'at' h:mm a");
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <span className="font-display text-xl font-bold text-foreground">FitClub</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">Student</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/profile" className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <User className="w-4 h-4" />
              <span className="text-sm">{profile?.full_name || user?.email}</span>
            </Link>
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-primary">{profile?.total_points || 0} pts</div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2 text-foreground">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Champion'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Ready to crush your fitness goals today?
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-hover rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-foreground">{profile?.total_points || 0}</div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
            </div>
          </div>
          
          <div className="glass-hover rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-energy/10 flex items-center justify-center">
                <Flame className="w-6 h-6 text-energy" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-foreground">{profile?.current_streak || 0}</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </div>
          
          <div className="glass-hover rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-foreground">{stats.totalWorkouts}</div>
                <div className="text-sm text-muted-foreground">Workouts</div>
              </div>
            </div>
          </div>
          
          <div className="glass-hover rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-foreground">{stats.prsThisMonth}</div>
                <div className="text-sm text-muted-foreground">PRs This Month</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold mb-4 text-foreground">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/workout/log" className="glass-hover rounded-2xl p-6 text-left group border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1 text-foreground">Log Workout</h3>
              <p className="text-sm text-muted-foreground">Track your exercises and sets</p>
            </Link>
            
            <Link to="/classes" className="glass-hover rounded-2xl p-6 text-left group border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-1 text-foreground">Book Class</h3>
              <p className="text-sm text-muted-foreground">Reserve your spot in classes</p>
            </Link>
            
            <Link to="/leaderboard" className="glass-hover rounded-2xl p-6 text-left group border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-energy/10 flex items-center justify-center mb-4 group-hover:bg-energy/20 transition-colors">
                <Users className="w-6 h-6 text-energy" />
              </div>
              <h3 className="font-semibold mb-1 text-foreground">Leaderboard</h3>
              <p className="text-sm text-muted-foreground">See how you rank</p>
            </Link>
            
            <Link to="/ai-planner" className="glass-hover rounded-2xl p-6 text-left group border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4 group-hover:bg-warning/20 transition-colors">
                <Sparkles className="w-6 h-6 text-warning" />
              </div>
              <h3 className="font-semibold mb-1 text-foreground">AI Planner</h3>
              <p className="text-sm text-muted-foreground">Get personalized workouts</p>
            </Link>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Link to="/gym-occupancy" className="glass-hover rounded-xl p-4 flex items-center gap-3 border border-border/50">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Gym Status</h3>
              <p className="text-xs text-muted-foreground">Live occupancy</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
          
          <Link to="/workout/history" className="glass-hover rounded-xl p-4 flex items-center gap-3 border border-border/50">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">History</h3>
              <p className="text-xs text-muted-foreground">Past workouts</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
          
          <Link to="/achievements" className="glass-hover rounded-xl p-4 flex items-center gap-3 border border-border/50">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Medal className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Achievements</h3>
              <p className="text-xs text-muted-foreground">View badges</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
          
          <Link to="/challenges" className="glass-hover rounded-xl p-4 flex items-center gap-3 border border-border/50">
            <div className="w-10 h-10 rounded-lg bg-energy/10 flex items-center justify-center">
              <Swords className="w-5 h-5 text-energy" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Challenges</h3>
              <p className="text-xs text-muted-foreground">Join challenges</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
          
          <Link to="/profile" className="glass-hover rounded-xl p-4 flex items-center gap-3 border border-border/50">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Profile</h3>
              <p className="text-xs text-muted-foreground">Settings</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Workouts */}
          <div className="glass rounded-2xl p-6 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-foreground">Recent Workouts</h3>
              <Link to="/workout/log" className="text-sm text-primary hover:text-primary/80 transition-colors">
                Log new
              </Link>
            </div>
            
            {recentWorkouts.length === 0 ? (
              <div className="text-center py-8">
                <Dumbbell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No workouts yet</p>
                <Link to="/workout/log">
                  <Button variant="outline" size="sm" className="mt-3">
                    Log your first workout
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentWorkouts.map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{workout.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {workout.exercise_count} exercises • {format(parseISO(workout.completed_at), "MMM d")}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-primary">+{workout.points_earned} pts</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Classes */}
          <div className="glass rounded-2xl p-6 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-foreground">Upcoming Classes</h3>
              <Link to="/classes" className="text-sm text-accent hover:text-accent/80 transition-colors">
                View all
              </Link>
            </div>
            
            {upcomingClasses.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No upcoming classes</p>
                <Link to="/classes">
                  <Button variant="outline" size="sm" className="mt-3">
                    Book a class
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{cls.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatClassDate(cls.scheduled_at)}
                        </div>
                      </div>
                    </div>
                    {cls.location && (
                      <div className="text-xs text-muted-foreground">{cls.location}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
