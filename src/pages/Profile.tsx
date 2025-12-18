import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  User,
  Save,
  Loader2,
  Trophy,
  Target,
  Calendar,
  Bell
} from "lucide-react";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  fitness_level: string | null;
  goals: string | null;
  total_points: number;
  current_streak: number;
  created_at: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    fitness_level: "beginner",
    goals: ""
  });
  
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    classesAttended: 0,
    achievementsEarned: 0
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
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || "",
          fitness_level: profileData.fitness_level || "beginner",
          goals: profileData.goals || ""
        });
      }

      // Fetch stats
      const { count: workoutCount } = await supabase
        .from("workouts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      const { count: classCount } = await supabase
        .from("class_bookings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("attended", true);

      const { count: achievementCount } = await supabase
        .from("user_achievements")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      setStats({
        totalWorkouts: workoutCount || 0,
        classesAttended: classCount || 0,
        achievementsEarned: achievementCount || 0
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name.trim() || null,
          fitness_level: formData.fitness_level,
          goals: formData.goals.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your changes have been saved."
      });

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        full_name: formData.full_name.trim() || null,
        fitness_level: formData.fitness_level,
        goals: formData.goals.trim() || null
      } : null);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error saving profile",
        description: error.message || "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-energy to-warning flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">Profile</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Profile Header */}
        <div className="glass rounded-2xl p-6 mb-6 border border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <User className="w-10 h-10 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold text-foreground">
                {profile?.full_name || user?.email}
              </h2>
              <p className="text-muted-foreground capitalize">{profile?.fitness_level || "Beginner"} Level</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {profile?.total_points || 0} points
                </span>
                <span className="px-2 py-0.5 rounded-full bg-energy/10 text-energy text-xs font-medium">
                  {profile?.current_streak || 0} day streak
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass rounded-xl p-4 text-center border border-border/50">
            <Target className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="font-display text-xl font-bold text-foreground">{stats.totalWorkouts}</div>
            <div className="text-xs text-muted-foreground">Workouts</div>
          </div>
          <div className="glass rounded-xl p-4 text-center border border-border/50">
            <Calendar className="w-6 h-6 text-accent mx-auto mb-2" />
            <div className="font-display text-xl font-bold text-foreground">{stats.classesAttended}</div>
            <div className="text-xs text-muted-foreground">Classes</div>
          </div>
          <div className="glass rounded-xl p-4 text-center border border-border/50">
            <Trophy className="w-6 h-6 text-warning mx-auto mb-2" />
            <div className="font-display text-xl font-bold text-foreground">{stats.achievementsEarned}</div>
            <div className="text-xs text-muted-foreground">Badges</div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="glass rounded-2xl p-6 border border-border/50">
          <h3 className="font-display text-lg font-semibold mb-6 text-foreground">Edit Profile</h3>
          
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                placeholder="Enter your name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="h-12 bg-secondary/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fitness_level">Fitness Level</Label>
              <Select
                value={formData.fitness_level}
                onValueChange={(value) => setFormData(prev => ({ ...prev, fitness_level: value }))}
              >
                <SelectTrigger id="fitness_level" className="h-12 bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Select your level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="athlete">Athlete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">Fitness Goals</Label>
              <Textarea
                id="goals"
                placeholder="What are your fitness goals? (e.g., build muscle, lose weight, improve endurance)"
                value={formData.goals}
                onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
                className="bg-secondary/50 border-border/50 min-h-[100px]"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="glass rounded-2xl p-6 mt-6 border border-border/50">
          <h3 className="font-display text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </h3>
          <PushNotificationSettings userId={user?.id || null} />
        </div>

        {/* Account Info */}
        <div className="glass rounded-2xl p-6 mt-6 border border-border/50">
          <h3 className="font-display text-lg font-semibold mb-4 text-foreground">Account</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
              <span className="text-muted-foreground">Member Since</span>
              <span className="text-foreground">
                {profile?.created_at 
                  ? new Date(profile.created_at).toLocaleDateString()
                  : "N/A"
                }
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
