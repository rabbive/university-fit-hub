import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ArrowLeft, Loader2, TrendingUp, Users, Dumbbell, Calendar, Download, FileText, FileSpreadsheet } from "lucide-react";
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

interface ExportData {
  workouts: any[];
  bookings: any[];
  users: any[];
}

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [exporting, setExporting] = useState(false);
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

  const fetchExportData = async (): Promise<ExportData> => {
    const [workoutsRes, bookingsRes, usersRes] = await Promise.all([
      supabase.from("workouts").select("*, workout_exercises(*)"),
      supabase.from("class_bookings").select("*, fitness_classes(name, instructor)"),
      supabase.from("profiles").select("*"),
    ]);

    return {
      workouts: workoutsRes.data || [],
      bookings: bookingsRes.data || [],
      users: usersRes.data || [],
    };
  };

  const exportToCSV = async (type: "workouts" | "bookings" | "users" | "all") => {
    setExporting(true);
    try {
      const data = await fetchExportData();
      let csvContent = "";
      let filename = "";

      if (type === "workouts" || type === "all") {
        const workoutRows = data.workouts.map((w) => ({
          id: w.id,
          name: w.name,
          completed_at: w.completed_at,
          duration_minutes: w.duration_minutes,
          points_earned: w.points_earned,
          exercises_count: w.workout_exercises?.length || 0,
        }));
        
        if (type === "workouts") {
          csvContent = convertToCSV(workoutRows);
          filename = `workouts_${format(new Date(), "yyyy-MM-dd")}.csv`;
        }
      }

      if (type === "bookings" || type === "all") {
        const bookingRows = data.bookings.map((b) => ({
          id: b.id,
          class_name: (b.fitness_classes as any)?.name || "Unknown",
          instructor: (b.fitness_classes as any)?.instructor || "Unknown",
          booked_at: b.booked_at,
          attended: b.attended ? "Yes" : "No",
        }));
        
        if (type === "bookings") {
          csvContent = convertToCSV(bookingRows);
          filename = `bookings_${format(new Date(), "yyyy-MM-dd")}.csv`;
        }
      }

      if (type === "users" || type === "all") {
        const userRows = data.users.map((u) => ({
          id: u.id,
          full_name: u.full_name || "N/A",
          fitness_level: u.fitness_level,
          total_points: u.total_points,
          current_streak: u.current_streak,
          created_at: u.created_at,
        }));
        
        if (type === "users") {
          csvContent = convertToCSV(userRows);
          filename = `users_${format(new Date(), "yyyy-MM-dd")}.csv`;
        }
      }

      if (type === "all") {
        const allData = {
          summary: {
            total_users: engagementStats.totalUsers,
            active_users: engagementStats.activeUsers,
            total_workouts: engagementStats.totalWorkouts,
            total_bookings: engagementStats.totalBookings,
            avg_points_per_user: engagementStats.avgPointsPerUser,
            export_date: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
          },
        };
        csvContent = convertToCSV([allData.summary]);
        filename = `analytics_summary_${format(new Date(), "yyyy-MM-dd")}.csv`;
      }

      downloadFile(csvContent, filename, "text/csv");
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
    setExporting(false);
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Analytics Report - ${format(new Date(), "yyyy-MM-dd")}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
    .stat-card { background: #f3f4f6; padding: 20px; border-radius: 8px; }
    .stat-value { font-size: 32px; font-weight: bold; color: #3b82f6; }
    .stat-label { color: #6b7280; margin-top: 5px; }
    .chart-section { margin: 30px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <h1>FitClub Analytics Report</h1>
  <p>Generated on: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
  
  <h2>Overview Statistics</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${engagementStats.totalUsers}</div>
      <div class="stat-label">Total Users</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${engagementStats.activeUsers}</div>
      <div class="stat-label">Active Users (30 days)</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${engagementStats.totalWorkouts}</div>
      <div class="stat-label">Total Workouts</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${engagementStats.totalBookings}</div>
      <div class="stat-label">Class Bookings</div>
    </div>
  </div>

  <h2>Workout Trends (Last 7 Days)</h2>
  <table>
    <tr><th>Date</th><th>Workouts</th></tr>
    ${workoutTrends.map((w) => `<tr><td>${w.date}</td><td>${w.count}</td></tr>`).join("")}
  </table>

  <h2>Popular Classes</h2>
  <table>
    <tr><th>Class Name</th><th>Bookings</th></tr>
    ${classPopularity.length > 0 
      ? classPopularity.map((c) => `<tr><td>${c.name}</td><td>${c.bookings}</td></tr>`).join("")
      : "<tr><td colspan='2'>No booking data available</td></tr>"
    }
  </table>

  <h2>User Engagement</h2>
  <p>Average points per user: <strong>${engagementStats.avgPointsPerUser}</strong></p>
  <p>User activity rate: <strong>${engagementStats.totalUsers > 0 ? Math.round((engagementStats.activeUsers / engagementStats.totalUsers) * 100) : 0}%</strong></p>

  <div class="footer">
    <p>This report was automatically generated by FitClub Admin Dashboard.</p>
  </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      toast.success("PDF report opened - use browser print to save as PDF");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to generate PDF");
    }
    setExporting(false);
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        const escaped = String(value ?? "").replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={exporting}>
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportToCSV("all")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Summary (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToCSV("workouts")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Workouts (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToCSV("bookings")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Bookings (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToCSV("users")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Users (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Export Report (PDF)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
