import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Dumbbell, 
  LogOut, 
  Users,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  ShieldAlert,
  ClipboardList,
  Trophy,
  Award,
  RefreshCw,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClasses: 0,
    totalBookings: 0,
    activeClasses: 0
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth?role=admin");
      } else {
        setUser(session.user);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth?role=admin");
      } else {
        setUser(session.user);
        checkAdminRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });

      if (error) throw error;
      
      if (data) {
        setIsAdmin(true);
        fetchStats();
      } else {
        setIsAdmin(false);
        setLoading(false);
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [profilesRes, classesRes, bookingsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("fitness_classes").select("id", { count: "exact", head: true }),
        supabase.from("class_bookings").select("id", { count: "exact", head: true })
      ]);

      setStats({
        totalUsers: profilesRes.count || 0,
        totalClasses: classesRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        activeClasses: classesRes.count || 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
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

  const handleResetDemoData = async () => {
    setResettingDemo(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-demo-data');
      
      if (error) throw error;
      
      toast({
        title: "Demo Data Reset",
        description: "All demo data has been refreshed successfully!",
      });
      
      // Refresh stats
      fetchStats();
    } catch (error: any) {
      console.error("Error resetting demo data:", error);
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset demo data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResettingDemo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Access denied screen for non-admins
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2 text-foreground">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have admin privileges to access this page. Please contact an administrator if you believe this is an error.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Go to Student Dashboard
            </Button>
            <Button onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display text-xl font-bold text-foreground">FitClub</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">Admin</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="font-medium text-foreground">{user?.email}</div>
              <div className="text-sm text-muted-foreground">Administrator</div>
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
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your fitness club and monitor performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-hover rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-foreground">{stats.totalUsers}</div>
                <div className="text-sm text-muted-foreground">Total Members</div>
              </div>
            </div>
          </div>
          
          <div className="glass-hover rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-foreground">{stats.totalClasses}</div>
                <div className="text-sm text-muted-foreground">Total Classes</div>
              </div>
            </div>
          </div>
          
          <div className="glass-hover rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-energy/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-energy" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-foreground">{stats.totalBookings}</div>
                <div className="text-sm text-muted-foreground">Total Bookings</div>
              </div>
            </div>
          </div>
          
          <div className="glass-hover rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-foreground">{stats.activeClasses}</div>
                <div className="text-sm text-muted-foreground">Active Classes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold mb-4 text-foreground">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/admin/classes" className="glass-hover rounded-2xl p-6 text-left group border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1 text-foreground">Manage Classes</h3>
              <p className="text-sm text-muted-foreground">Add, edit, delete fitness classes</p>
            </Link>
            
            <Link to="/admin/users" className="glass-hover rounded-2xl p-6 text-left group border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-1 text-foreground">Manage Users</h3>
              <p className="text-sm text-muted-foreground">View and manage members</p>
            </Link>
            
            <Link to="/admin/analytics" className="glass-hover rounded-2xl p-6 text-left group border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-energy/10 flex items-center justify-center mb-4 group-hover:bg-energy/20 transition-colors">
                <BarChart3 className="w-6 h-6 text-energy" />
              </div>
              <h3 className="font-semibold mb-1 text-foreground">Analytics</h3>
              <p className="text-sm text-muted-foreground">View detailed reports</p>
            </Link>
            
            <Link to="/admin/bookings" className="glass-hover rounded-2xl p-6 text-left group border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4 group-hover:bg-warning/20 transition-colors">
                <ClipboardList className="w-6 h-6 text-warning" />
              </div>
              <h3 className="font-semibold mb-1 text-foreground">Bookings</h3>
              <p className="text-sm text-muted-foreground">Manage class bookings</p>
            </Link>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold mb-4 text-foreground">Gamification</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/admin/challenges" className="glass-hover rounded-2xl p-6 text-left group border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                <Trophy className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-semibold mb-1 text-foreground">Challenges</h3>
              <p className="text-sm text-muted-foreground">Create and manage challenges</p>
            </Link>
            
            <Link to="/admin/achievements" className="glass-hover rounded-2xl p-6 text-left group border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                <Award className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="font-semibold mb-1 text-foreground">Achievements</h3>
              <p className="text-sm text-muted-foreground">Manage badges and rewards</p>
            </Link>
            
            <button className="glass-hover rounded-2xl p-6 text-left group border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4 group-hover:bg-muted transition-colors">
                <Settings className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1 text-foreground">Settings</h3>
              <p className="text-sm text-muted-foreground">Configure system settings</p>
            </button>
          </div>
        </div>

        {/* Demo Tools */}
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold mb-4 text-foreground">Demo Tools</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={handleResetDemoData}
              disabled={resettingDemo}
              className="glass-hover rounded-2xl p-6 text-left group border border-destructive/20 hover:border-destructive/40 transition-colors disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4 group-hover:bg-destructive/20 transition-colors">
                <RefreshCw className={`w-6 h-6 text-destructive ${resettingDemo ? 'animate-spin' : ''}`} />
              </div>
              <h3 className="font-semibold mb-1 text-foreground">
                {resettingDemo ? 'Resetting...' : 'Reset Demo Data'}
              </h3>
              <p className="text-sm text-muted-foreground">Refresh all demo data for presentations</p>
            </button>
            
            <a 
              href="/DEMO_GUIDE.md" 
              target="_blank"
              className="glass-hover rounded-2xl p-6 text-left group border border-primary/20 hover:border-primary/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1 text-foreground">Demo Guide</h3>
              <p className="text-sm text-muted-foreground">View walkthrough documentation</p>
            </a>
          </div>
        </div>

        <div className="glass rounded-2xl p-8 text-center border border-primary/20">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-primary-foreground" />
          </div>
          <h3 className="font-display text-xl font-semibold mb-2 text-foreground">Welcome to Admin Panel</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Use the quick actions above to manage classes, users, and view analytics for your fitness club.
          </p>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
