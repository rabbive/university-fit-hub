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
  Flame
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">FitClub</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="font-medium">{profile?.full_name || user?.email}</div>
              <div className="text-sm text-muted-foreground">{profile?.total_points || 0} points</div>
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
          <h1 className="font-display text-3xl font-bold mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Champion'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Ready to crush your fitness goals today?
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-hover rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold">{profile?.total_points || 0}</div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
            </div>
          </div>
          
          <div className="glass-hover rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-energy/10 flex items-center justify-center">
                <Flame className="w-6 h-6 text-energy" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold">{profile?.current_streak || 0}</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </div>
          
          <div className="glass-hover rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold">0</div>
                <div className="text-sm text-muted-foreground">Workouts</div>
              </div>
            </div>
          </div>
          
          <div className="glass-hover rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold">0</div>
                <div className="text-sm text-muted-foreground">PRs This Month</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/workout/log" className="glass-hover rounded-2xl p-6 text-left group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Log Workout</h3>
              <p className="text-sm text-muted-foreground">Track your exercises and sets</p>
            </Link>
            
            <button className="glass-hover rounded-2xl p-6 text-left group">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-1">Book Class</h3>
              <p className="text-sm text-muted-foreground">Reserve your spot in classes</p>
            </button>
            
            <button className="glass-hover rounded-2xl p-6 text-left group">
              <div className="w-12 h-12 rounded-xl bg-energy/10 flex items-center justify-center mb-4 group-hover:bg-energy/20 transition-colors">
                <Trophy className="w-6 h-6 text-energy" />
              </div>
              <h3 className="font-semibold mb-1">Leaderboard</h3>
              <p className="text-sm text-muted-foreground">See how you rank</p>
            </button>
            
            <button className="glass-hover rounded-2xl p-6 text-left group">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4 group-hover:bg-warning/20 transition-colors">
                <Sparkles className="w-6 h-6 text-warning" />
              </div>
              <h3 className="font-semibold mb-1">AI Planner</h3>
              <p className="text-sm text-muted-foreground">Get personalized workouts</p>
            </button>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="glass rounded-2xl p-8 text-center border border-primary/20">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h3 className="font-display text-xl font-semibold mb-2">More Features Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            We're building workout logging, class booking, leaderboards, and AI-powered workout planning. Stay tuned!
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
