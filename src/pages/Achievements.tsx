import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Medal,
  Lock,
  CheckCircle2,
  Trophy,
  Dumbbell,
  Flame,
  Target,
  Calendar,
  Star
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  points_value: number;
  earned_at?: string | null;
}

const Achievements = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalAvailable: 0,
    pointsFromAchievements: 0
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
        fetchAchievements(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchAchievements = async (userId: string) => {
    try {
      // Fetch all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .order("category", { ascending: true });

      if (achievementsError) throw achievementsError;

      // Fetch user's earned achievements
      const { data: userAchievements, error: userError } = await supabase
        .from("user_achievements")
        .select("achievement_id, earned_at")
        .eq("user_id", userId);

      if (userError) throw userError;

      const earnedMap = new Map(
        userAchievements?.map(ua => [ua.achievement_id, ua.earned_at]) || []
      );
      const earnedIdSet = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

      setEarnedIds(earnedIdSet);

      // Combine data
      const combinedAchievements = (allAchievements || []).map(achievement => ({
        ...achievement,
        earned_at: earnedMap.get(achievement.id) || null
      }));

      setAchievements(combinedAchievements);

      // Calculate stats
      const earnedCount = earnedIdSet.size;
      const earnedPoints = combinedAchievements
        .filter(a => earnedIdSet.has(a.id))
        .reduce((sum, a) => sum + (a.points_value || 0), 0);

      setStats({
        totalEarned: earnedCount,
        totalAvailable: allAchievements?.length || 0,
        pointsFromAchievements: earnedPoints
      });
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case "workout":
        return <Dumbbell className="w-5 h-5" />;
      case "streak":
        return <Flame className="w-5 h-5" />;
      case "class":
        return <Calendar className="w-5 h-5" />;
      case "milestone":
        return <Target className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    const category = achievement.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const progressPercent = stats.totalAvailable > 0 
    ? (stats.totalEarned / stats.totalAvailable) * 100 
    : 0;

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
                <Medal className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">Achievements</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Progress Overview */}
        <div className="glass rounded-2xl p-6 mb-8 border border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                {stats.totalEarned} / {stats.totalAvailable}
              </h2>
              <p className="text-muted-foreground">achievements earned</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-display font-bold text-primary">{stats.pointsFromAchievements}</div>
                <div className="text-xs text-muted-foreground">points from badges</div>
              </div>
              <Trophy className="w-10 h-10 text-warning" />
            </div>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {Math.round(progressPercent)}% complete
          </p>
        </div>

        {/* Achievements by Category */}
        {Object.keys(groupedAchievements).length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border border-border/50">
            <Medal className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">No Achievements Available</h3>
            <p className="text-muted-foreground">Check back soon for new achievements to earn!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {getCategoryIcon(category)}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{category}</h3>
                  <span className="text-sm text-muted-foreground">
                    ({categoryAchievements.filter(a => earnedIds.has(a.id)).length}/{categoryAchievements.length})
                  </span>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {categoryAchievements.map((achievement) => {
                    const isEarned = earnedIds.has(achievement.id);
                    
                    return (
                      <div
                        key={achievement.id}
                        className={`glass-hover rounded-xl p-5 border transition-all ${
                          isEarned 
                            ? "border-accent/50 bg-accent/5" 
                            : "border-border/50 opacity-60"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                            isEarned ? "bg-accent/20" : "bg-muted/50"
                          }`}>
                            {isEarned ? (
                              achievement.icon || "🏆"
                            ) : (
                              <Lock className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground truncate">{achievement.name}</h4>
                              {isEarned && (
                                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {achievement.description || "Complete to unlock"}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                isEarned 
                                  ? "bg-accent/20 text-accent" 
                                  : "bg-muted/50 text-muted-foreground"
                              }`}>
                                +{achievement.points_value} pts
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Achievements;
