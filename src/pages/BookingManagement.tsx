import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface Booking {
  id: string;
  user_id: string;
  class_id: string;
  booked_at: string;
  attended: boolean;
  class_name: string;
  class_date: string;
  user_name: string;
}

const BookingManagement = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!roleData) {
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    await fetchBookings();
  };

  const fetchBookings = async () => {
    setLoading(true);
    
    // Fetch bookings with class info
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("class_bookings")
      .select(`
        id,
        user_id,
        class_id,
        booked_at,
        attended,
        fitness_classes (
          name,
          scheduled_at
        )
      `)
      .order("booked_at", { ascending: false });

    if (bookingsError) {
      toast.error("Failed to fetch bookings");
      setLoading(false);
      return;
    }

    // Fetch profiles for user names
    const userIds = [...new Set(bookingsData?.map(b => b.user_id) || [])];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    const profileMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);

    const formattedBookings: Booking[] = (bookingsData || []).map((booking: any) => ({
      id: booking.id,
      user_id: booking.user_id,
      class_id: booking.class_id,
      booked_at: booking.booked_at,
      attended: booking.attended || false,
      class_name: booking.fitness_classes?.name || "Unknown Class",
      class_date: booking.fitness_classes?.scheduled_at || "",
      user_name: profileMap.get(booking.user_id) || "Unknown User",
    }));

    setBookings(formattedBookings);
    setLoading(false);
  };

  const handleMarkAttendance = async (bookingId: string, attended: boolean) => {
    const { error } = await supabase
      .from("class_bookings")
      .update({ attended })
      .eq("id", bookingId);

    if (error) {
      toast.error("Failed to update attendance");
      return;
    }

    toast.success(attended ? "Marked as attended" : "Marked as not attended");
    setBookings(prev =>
      prev.map(b => (b.id === bookingId ? { ...b, attended } : b))
    );
  };

  const handleCancelBooking = async (bookingId: string) => {
    const { error } = await supabase
      .from("class_bookings")
      .delete()
      .eq("id", bookingId);

    if (error) {
      toast.error("Failed to cancel booking");
      return;
    }

    toast.success("Booking cancelled");
    setBookings(prev => prev.filter(b => b.id !== bookingId));
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.class_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "attended" && booking.attended) ||
      (filterStatus === "pending" && !booking.attended);

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: bookings.length,
    attended: bookings.filter(b => b.attended).length,
    pending: bookings.filter(b => !b.attended).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-foreground">Booking Management</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Attended</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.attended}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user or class name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bookings</SelectItem>
                  <SelectItem value="attended">Attended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Class Date</TableHead>
                  <TableHead>Booked At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.user_name}</TableCell>
                      <TableCell>{booking.class_name}</TableCell>
                      <TableCell>
                        {booking.class_date
                          ? format(new Date(booking.class_date), "MMM d, yyyy h:mm a")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.booked_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={booking.attended ? "default" : "secondary"}>
                          {booking.attended ? "Attended" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!booking.attended ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAttendance(booking.id, true)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark Attended
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAttendance(booking.id, false)}
                            >
                              Undo
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BookingManagement;
