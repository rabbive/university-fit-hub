import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Trophy, 
  Medal,
  Crown,
  TrendingUp,
  Flame,
  User
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { ListSkeleton } from "@/components/animations/SkeletonLoader";
import { BottomNav } from "@/components/BottomNav";
import { motion } from "framer-motion";

interface LeaderboardEntry {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  total_points: number;
  current_streak: number;
  rank: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [timeFilter, setTimeFilter] = useState<"all" | "month" | "week">("all");

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
        fetchLeaderboard(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchLeaderboard = async (userId: string) => {
    try {
      // Fetch all profiles ordered by total_points
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, total_points, current_streak")
        .order("total_points", { ascending: false })
        .limit(50);

      if (error) throw error;

      const rankedData = (data || []).map((entry, index) => ({
        ...entry,
        total_points: entry.total_points || 0,
        current_streak: entry.current_streak || 0,
        rank: index + 1
      }));

      setLeaderboard(rankedData);

      // Find user's rank
      const userEntry = rankedData.find(entry => entry.id === userId);
      if (userEntry) {
        setUserRank(userEntry.rank);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-warning" />;
      case 2:
        return <Medal className="w-6 h-6 text-muted-foreground" />;
      case 3:
        return <Medal className="w-6 h-6 text-energy" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-warning/10 border-warning/30";
      case 2:
        return "bg-muted/50 border-muted-foreground/30";
      case 3:
        return "bg-energy/10 border-energy/30";
      default:
        return "bg-secondary/30 border-border/50";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-3xl space-y-6">
          <div className="h-10 w-40 bg-muted/50 rounded-lg animate-pulse" />
          <div className="flex justify-center gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 animate-pulse" />
                <div className="h-4 w-16 bg-muted/50 rounded mt-2 animate-pulse" />
              </div>
            ))}
          </div>
          <ListSkeleton items={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning to-energy flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">Leaderboard</span>
            </div>
          </div>

          {userRank && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Your Rank</div>
              <div className="font-display font-bold text-primary">#{userRank}</div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-3xl">
        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="mb-8">
            <div className="flex items-end justify-center gap-4">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 border-2 border-muted-foreground/30 flex items-center justify-center mb-2 overflow-hidden">
                  {leaderboard[1].avatar_url ? (
                    <img src={leaderboard[1].avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="text-center">
                  <div className="font-semibold text-foreground text-sm truncate max-w-[80px]">
                    {leaderboard[1].full_name || "Anonymous"}
                  </div>
                  <div className="text-xs text-muted-foreground">{leaderboard[1].total_points} pts</div>
                </div>
                <div className="mt-2 w-20 h-20 bg-muted/30 rounded-t-lg flex items-center justify-center">
                  <Medal className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center -mt-8">
                <Crown className="w-8 h-8 text-warning mb-2 animate-pulse" />
                <div className="w-20 h-20 rounded-full bg-warning/20 border-2 border-warning/50 flex items-center justify-center mb-2 overflow-hidden">
                  {leaderboard[0].avatar_url ? (
                    <img src={leaderboard[0].avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-warning" />
                  )}
                </div>
                <div className="text-center">
                  <div className="font-semibold text-foreground truncate max-w-[100px]">
                    {leaderboard[0].full_name || "Anonymous"}
                  </div>
                  <div className="text-sm text-warning font-medium">{leaderboard[0].total_points} pts</div>
                </div>
                <div className="mt-2 w-24 h-28 bg-warning/20 rounded-t-lg flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-warning" />
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-energy/10 border-2 border-energy/30 flex items-center justify-center mb-2 overflow-hidden">
                  {leaderboard[2].avatar_url ? (
                    <img src={leaderboard[2].avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-energy" />
                  )}
                </div>
                <div className="text-center">
                  <div className="font-semibold text-foreground text-sm truncate max-w-[80px]">
                    {leaderboard[2].full_name || "Anonymous"}
                  </div>
                  <div className="text-xs text-muted-foreground">{leaderboard[2].total_points} pts</div>
                </div>
                <div className="mt-2 w-20 h-16 bg-energy/10 rounded-t-lg flex items-center justify-center">
                  <Medal className="w-7 h-7 text-energy" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rankings List */}
        <div className="glass rounded-2xl p-6 border border-border/50">
          <h2 className="font-display text-lg font-semibold mb-4 text-foreground">Rankings</h2>
          
          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No rankings yet</p>
              <p className="text-sm text-muted-foreground">Start logging workouts to appear on the leaderboard!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${getRankBg(entry.rank)} ${
                    entry.id === user?.id ? "ring-2 ring-primary/50" : ""
                  }`}
                >
                  <div className="w-10 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {entry.full_name || "Anonymous"}
                      {entry.id === user?.id && (
                        <span className="ml-2 text-xs text-primary">(You)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-energy" />
                        {entry.current_streak} day streak
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-display font-bold text-foreground">{entry.total_points}</div>
                    <div className="text-xs text-muted-foreground">points</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Leaderboard;
