import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  LogIn,
  LogOut,
  Loader2,
  RefreshCw
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface HourlyStat {
  hour_of_day: number;
  avg_occupancy: number;
}

const MAX_CAPACITY = 50; // Maximum gym capacity

const GymOccupancy = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [currentOccupancy, setCurrentOccupancy] = useState(0);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [userCheckInId, setUserCheckInId] = useState<string | null>(null);
  const [hourlyStats, setHourlyStats] = useState<HourlyStat[]>([]);

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
        fetchOccupancyData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('gym-occupancy-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gym_occupancy'
        },
        () => {
          // Refetch current occupancy when changes occur
          fetchCurrentOccupancy();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOccupancyData = async (userId: string) => {
    try {
      await Promise.all([
        fetchCurrentOccupancy(),
        fetchUserCheckInStatus(userId),
        fetchHourlyStats()
      ]);
    } catch (error) {
      console.error("Error fetching occupancy data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentOccupancy = async () => {
    const { count, error } = await supabase
      .from("gym_occupancy")
      .select("*", { count: "exact", head: true })
      .is("check_out_time", null);

    if (!error) {
      setCurrentOccupancy(count || 0);
    }
  };

  const fetchUserCheckInStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from("gym_occupancy")
      .select("id")
      .eq("user_id", userId)
      .is("check_out_time", null)
      .maybeSingle();

    if (!error && data) {
      setIsCheckedIn(true);
      setUserCheckInId(data.id);
    } else {
      setIsCheckedIn(false);
      setUserCheckInId(null);
    }
  };

  const fetchHourlyStats = async () => {
    const today = new Date().getDay();
    
    const { data, error } = await supabase
      .from("gym_hourly_stats")
      .select("hour_of_day, avg_occupancy")
      .eq("day_of_week", today)
      .order("hour_of_day", { ascending: true });

    if (!error && data) {
      setHourlyStats(data);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;
    setActionLoading(true);

    try {
      const { data, error } = await supabase
        .from("gym_occupancy")
        .insert({
          user_id: user.id,
          check_in_time: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setIsCheckedIn(true);
      setUserCheckInId(data.id);
      setCurrentOccupancy(prev => prev + 1);

      toast({
        title: "Checked in! 💪",
        description: "You're now at the gym. Have a great workout!"
      });
    } catch (error: any) {
      console.error("Error checking in:", error);
      toast({
        title: "Error",
        description: error.message || "Could not check in.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user || !userCheckInId) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("gym_occupancy")
        .update({ check_out_time: new Date().toISOString() })
        .eq("id", userCheckInId);

      if (error) throw error;

      setIsCheckedIn(false);
      setUserCheckInId(null);
      setCurrentOccupancy(prev => Math.max(0, prev - 1));

      toast({
        title: "Checked out!",
        description: "Great workout! See you next time."
      });
    } catch (error: any) {
      console.error("Error checking out:", error);
      toast({
        title: "Error",
        description: error.message || "Could not check out.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getOccupancyLevel = (count: number) => {
    const percent = (count / MAX_CAPACITY) * 100;
    if (percent < 30) return { label: "Low", color: "text-accent", bg: "bg-accent" };
    if (percent < 60) return { label: "Moderate", color: "text-warning", bg: "bg-warning" };
    if (percent < 85) return { label: "Busy", color: "text-energy", bg: "bg-energy" };
    return { label: "Very Busy", color: "text-destructive", bg: "bg-destructive" };
  };

  const getCurrentHourPrediction = () => {
    const currentHour = new Date().getHours();
    return hourlyStats.find(s => s.hour_of_day === currentHour)?.avg_occupancy || 0;
  };

  const getTrend = () => {
    const currentHour = new Date().getHours();
    const currentStat = hourlyStats.find(s => s.hour_of_day === currentHour);
    const nextStat = hourlyStats.find(s => s.hour_of_day === currentHour + 1);
    
    if (!currentStat || !nextStat) return null;
    
    const diff = nextStat.avg_occupancy - currentStat.avg_occupancy;
    if (diff > 3) return { direction: "up", label: "Getting busier" };
    if (diff < -3) return { direction: "down", label: "Clearing out" };
    return { direction: "stable", label: "Staying steady" };
  };

  const occupancyLevel = getOccupancyLevel(currentOccupancy);
  const occupancyPercent = Math.min((currentOccupancy / MAX_CAPACITY) * 100, 100);
  const trend = getTrend();

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
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">Gym Occupancy</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => fetchOccupancyData(user?.id || '')}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-3xl">
        {/* Current Occupancy Card */}
        <div className="glass rounded-2xl p-8 mb-6 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="text-muted-foreground">FitClub Main Gym</span>
            <span className="ml-auto flex items-center gap-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Live
            </span>
          </div>

          <div className="text-center mb-6">
            <div className={`text-6xl font-display font-bold ${occupancyLevel.color} mb-2`}>
              {currentOccupancy}
            </div>
            <div className="text-muted-foreground">
              people currently in gym
            </div>
            <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full ${occupancyLevel.bg}/20 ${occupancyLevel.color} text-sm font-medium`}>
              {occupancyLevel.label}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Capacity</span>
              <span className="text-foreground">{currentOccupancy} / {MAX_CAPACITY}</span>
            </div>
            <Progress value={occupancyPercent} className="h-3" />
          </div>

          {trend && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              {trend.direction === "up" && <TrendingUp className="w-4 h-4 text-energy" />}
              {trend.direction === "down" && <TrendingDown className="w-4 h-4 text-accent" />}
              {trend.direction === "stable" && <Minus className="w-4 h-4" />}
              {trend.label}
            </div>
          )}
        </div>

        {/* Check In/Out Button */}
        <div className="mb-8">
          <Button
            onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
            disabled={actionLoading}
            className={`w-full h-14 text-lg font-semibold ${
              isCheckedIn 
                ? "bg-energy hover:bg-energy/90" 
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {actionLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isCheckedIn ? (
              <>
                <LogOut className="w-5 h-5 mr-2" />
                Check Out
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Check In
              </>
            )}
          </Button>
          {isCheckedIn && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              You're currently checked in
            </p>
          )}
        </div>

        {/* Peak Hours Prediction */}
        <div className="glass rounded-2xl p-6 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg font-semibold text-foreground">Today's Predictions</h3>
          </div>

          <div className="space-y-2">
            {hourlyStats.map((stat) => {
              const level = getOccupancyLevel(Math.round(stat.avg_occupancy));
              const isCurrentHour = new Date().getHours() === stat.hour_of_day;
              const percent = Math.min((stat.avg_occupancy / MAX_CAPACITY) * 100, 100);
              
              return (
                <div 
                  key={stat.hour_of_day}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    isCurrentHour ? "bg-primary/10 ring-1 ring-primary/30" : ""
                  }`}
                >
                  <span className={`w-14 text-sm font-medium ${isCurrentHour ? "text-primary" : "text-muted-foreground"}`}>
                    {stat.hour_of_day}:00
                  </span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${level.bg} transition-all`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className={`w-16 text-xs text-right ${level.color}`}>
                    {level.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              Predictions based on historical data. Actual occupancy may vary.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GymOccupancy;
