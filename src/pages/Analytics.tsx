import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2, TrendingUp, Users, Dumbbell, Calendar } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";

interface WorkoutTrend {
  date: string;
  count: number;
}

interface ClassPopularity {
  name: string;
  bookings: number;
}

interface EngagementStats {
  totalUsers: number;
  activeUsers: number;
  totalWorkouts: number;
  totalBookings: number;
  avgPointsPerUser: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [workoutTrends, setWorkoutTrends] = useState<WorkoutTrend[]>([]);
  const [classPopularity, setClassPopularity] = useState<ClassPopularity[]>([]);
  const [engagementStats, setEngagementStats] = useState<EngagementStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalWorkouts: 0,
    totalBookings: 0,
    avgPointsPerUser: 0,
  });

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: hasRole } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });

      if (!hasRole) {
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      fetchAnalytics();
    };

    checkAuthAndFetch();
  }, [navigate]);

  const fetchAnalytics = async () => {
    setLoading(true);
    
    try {
      // Fetch workout trends for last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return format(startOfDay(date), "yyyy-MM-dd");
      });

      const { data: workouts } = await supabase
        .from("workouts")
        .select("completed_at")
        .gte("completed_at", subDays(new Date(), 7).toISOString());

      const workoutCounts = last7Days.map((date) => {
        const count = workouts?.filter((w) => 
          w.completed_at && format(new Date(w.completed_at), "yyyy-MM-dd") === date
        ).length || 0;
        return { date: format(new Date(date), "MMM d"), count };
      });
      setWorkoutTrends(workoutCounts);

      // Fetch class popularity
      const { data: bookingsData } = await supabase
        .from("class_bookings")
        .select("class_id, fitness_classes(name)");

      const classBookingCounts: Record<string, number> = {};
      bookingsData?.forEach((booking) => {
        const className = (booking.fitness_classes as any)?.name || "Unknown";
        classBookingCounts[className] = (classBookingCounts[className] || 0) + 1;
      });

      const popularClasses = Object.entries(classBookingCounts)
        .map(([name, bookings]) => ({ name, bookings }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);
      setClassPopularity(popularClasses);

      // Fetch engagement stats
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: totalWorkouts } = await supabase
        .from("workouts")
        .select("*", { count: "exact", head: true });

      const { count: totalBookings } = await supabase
        .from("class_bookings")
        .select("*", { count: "exact", head: true });

      const { data: profilesWithPoints } = await supabase
        .from("profiles")
        .select("total_points");

      const totalPoints = profilesWithPoints?.reduce((sum, p) => sum + (p.total_points || 0), 0) || 0;
      const avgPoints = totalUsers ? Math.round(totalPoints / totalUsers) : 0;

      // Count active users (users with at least one workout in last 30 days)
      const { data: activeWorkouts } = await supabase
        .from("workouts")
        .select("user_id")
        .gte("completed_at", subDays(new Date(), 30).toISOString());

      const uniqueActiveUsers = new Set(activeWorkouts?.map((w) => w.user_id)).size;

      setEngagementStats({
        totalUsers: totalUsers || 0,
        activeUsers: uniqueActiveUsers,
        totalWorkouts: totalWorkouts || 0,
        totalBookings: totalBookings || 0,
        avgPointsPerUser: avgPoints,
      });

    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    }

    setLoading(false);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{engagementStats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {engagementStats.activeUsers} active in last 30 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Workouts
                  </CardTitle>
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{engagementStats.totalWorkouts}</div>
                  <p className="text-xs text-muted-foreground">Logged by all users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Class Bookings
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{engagementStats.totalBookings}</div>
                  <p className="text-xs text-muted-foreground">Total reservations</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg Points/User
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{engagementStats.avgPointsPerUser}</div>
                  <p className="text-xs text-muted-foreground">Points earned</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Workout Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Workout Trends (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  {workoutTrends.every((w) => w.count === 0) ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No workout data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={workoutTrends}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis allowDecimals={false} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Popular Classes */}
              <Card>
                <CardHeader>
                  <CardTitle>Popular Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  {classPopularity.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No booking data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={classPopularity} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" allowDecimals={false} className="text-xs" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={100}
                          className="text-xs"
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* User Engagement Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Engagement Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                  <ResponsiveContainer width={250} height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Active Users", value: engagementStats.activeUsers },
                          {
                            name: "Inactive Users",
                            value: engagementStats.totalUsers - engagementStats.activeUsers,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="hsl(var(--primary))" />
                        <Cell fill="hsl(var(--muted))" />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-primary" />
                      <span className="text-sm">
                        Active Users ({engagementStats.activeUsers})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-muted" />
                      <span className="text-sm">
                        Inactive Users ({engagementStats.totalUsers - engagementStats.activeUsers})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Active = at least 1 workout in last 30 days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
