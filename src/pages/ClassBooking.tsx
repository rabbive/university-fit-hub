import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, parseISO } from "date-fns";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users,
  Loader2,
  CheckCircle2,
  Dumbbell
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface FitnessClass {
  id: string;
  name: string;
  description: string | null;
  instructor: string | null;
  capacity: number;
  duration_minutes: number;
  scheduled_at: string;
  location: string | null;
  points_reward: number;
  booked_count?: number;
  is_booked?: boolean;
}

const ClassBooking = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [classes, setClasses] = useState<FitnessClass[]>([]);
  const [userBookings, setUserBookings] = useState<string[]>([]);

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
        fetchClassesAndBookings(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchClassesAndBookings = async (userId: string) => {
    try {
      // Fetch all active classes
      const { data: classesData, error: classesError } = await supabase
        .from("fitness_classes")
        .select("*")
        .eq("is_active", true)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true });

      if (classesError) throw classesError;

      // Fetch user's bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("class_bookings")
        .select("class_id")
        .eq("user_id", userId);

      if (bookingsError) throw bookingsError;

      const bookedClassIds = bookingsData?.map(b => b.class_id) || [];
      setUserBookings(bookedClassIds);

      // Get booking counts for each class
      const classesWithCounts = await Promise.all(
        (classesData || []).map(async (cls) => {
          const { count } = await supabase
            .from("class_bookings")
            .select("*", { count: "exact", head: true })
            .eq("class_id", cls.id);

          return {
            ...cls,
            booked_count: count || 0,
            is_booked: bookedClassIds.includes(cls.id)
          };
        })
      );

      setClasses(classesWithCounts);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast({
        title: "Error loading classes",
        description: "Could not load fitness classes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookClass = async (classItem: FitnessClass) => {
    if (!user) return;
    
    setBookingId(classItem.id);

    try {
      if (classItem.is_booked) {
        // Cancel booking
        const { error } = await supabase
          .from("class_bookings")
          .delete()
          .eq("user_id", user.id)
          .eq("class_id", classItem.id);

        if (error) throw error;

        toast({
          title: "Booking cancelled",
          description: `You've cancelled your spot in ${classItem.name}.`,
        });

        // Update local state
        setClasses(prev => prev.map(c => 
          c.id === classItem.id 
            ? { ...c, is_booked: false, booked_count: (c.booked_count || 1) - 1 }
            : c
        ));
        setUserBookings(prev => prev.filter(id => id !== classItem.id));
      } else {
        // Book class
        const { error } = await supabase
          .from("class_bookings")
          .insert({
            user_id: user.id,
            class_id: classItem.id,
          });

        if (error) {
          if (error.code === "23505") {
            toast({
              title: "Already booked",
              description: "You've already booked this class.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Class booked! 🎉",
            description: `You'll earn ${classItem.points_reward} points when you attend ${classItem.name}.`,
          });

          // Update local state
          setClasses(prev => prev.map(c => 
            c.id === classItem.id 
              ? { ...c, is_booked: true, booked_count: (c.booked_count || 0) + 1 }
              : c
          ));
          setUserBookings(prev => [...prev, classItem.id]);
        }
      }
    } catch (error: any) {
      console.error("Error booking class:", error);
      toast({
        title: "Error",
        description: error.message || "Could not process your request.",
        variant: "destructive",
      });
    } finally {
      setBookingId(null);
    }
  };

  const filteredClasses = classes.filter(cls => 
    isSameDay(parseISO(cls.scheduled_at), selectedDate)
  );

  const datesWithClasses = classes.map(cls => parseISO(cls.scheduled_at));

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">Book Classes</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[340px,1fr] gap-8">
          {/* Calendar Sidebar */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold mb-4 text-foreground">Select Date</h2>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-lg pointer-events-auto"
              modifiers={{
                hasClass: datesWithClasses
              }}
              modifiersStyles={{
                hasClass: {
                  fontWeight: "bold",
                  textDecoration: "underline",
                  textDecorationColor: "hsl(var(--primary))",
                  textUnderlineOffset: "4px"
                }
              }}
            />
            
            <div className="mt-6 pt-6 border-t border-border/50">
              <h3 className="text-sm font-medium text-foreground mb-2">Your Bookings</h3>
              <div className="text-2xl font-display font-bold text-primary">
                {userBookings.length}
              </div>
              <p className="text-xs text-muted-foreground">upcoming classes</p>
            </div>
          </div>

          {/* Classes List */}
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                {format(selectedDate, "EEEE, MMMM d")}
              </h2>
              <p className="text-muted-foreground">
                {filteredClasses.length === 0 
                  ? "No classes scheduled for this day" 
                  : `${filteredClasses.length} class${filteredClasses.length > 1 ? 'es' : ''} available`
                }
              </p>
            </div>

            {filteredClasses.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">No Classes Today</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Select another date to see available classes, or check back later for updates.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClasses.map((classItem) => {
                  const spotsLeft = classItem.capacity - (classItem.booked_count || 0);
                  const isFull = spotsLeft <= 0;
                  const isAlmostFull = spotsLeft <= 3 && spotsLeft > 0;

                  return (
                    <div 
                      key={classItem.id}
                      className={`glass-hover rounded-2xl p-6 transition-all ${
                        classItem.is_booked ? 'ring-2 ring-accent/50 bg-accent/5' : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-display text-xl font-semibold text-foreground">
                              {classItem.name}
                            </h3>
                            {classItem.is_booked && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-medium">
                                <CheckCircle2 className="w-3 h-3" />
                                Booked
                              </span>
                            )}
                          </div>
                          
                          {classItem.description && (
                            <p className="text-muted-foreground text-sm mb-4">
                              {classItem.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2 text-foreground">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>{format(parseISO(classItem.scheduled_at), "h:mm a")}</span>
                              <span className="text-muted-foreground">({classItem.duration_minutes} min)</span>
                            </div>
                            
                            {classItem.location && (
                              <div className="flex items-center gap-2 text-foreground">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span>{classItem.location}</span>
                              </div>
                            )}
                            
                            {classItem.instructor && (
                              <div className="flex items-center gap-2 text-foreground">
                                <Dumbbell className="w-4 h-4 text-muted-foreground" />
                                <span>{classItem.instructor}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          {/* Capacity indicator */}
                          <div className="flex items-center gap-2">
                            <Users className={`w-4 h-4 ${
                              isFull ? 'text-destructive' : 
                              isAlmostFull ? 'text-warning' : 'text-accent'
                            }`} />
                            <span className={`text-sm font-medium ${
                              isFull ? 'text-destructive' : 
                              isAlmostFull ? 'text-warning' : 'text-foreground'
                            }`}>
                              {isFull ? 'Full' : `${spotsLeft} spots left`}
                            </span>
                          </div>

                          {/* Points badge */}
                          <div className="text-xs text-muted-foreground">
                            +{classItem.points_reward} pts
                          </div>

                          {/* Book button */}
                          <Button
                            onClick={() => handleBookClass(classItem)}
                            disabled={isFull && !classItem.is_booked || bookingId === classItem.id}
                            variant={classItem.is_booked ? "outline" : "default"}
                            className={classItem.is_booked 
                              ? "border-accent text-accent hover:bg-accent/10" 
                              : "bg-primary hover:bg-primary/90"
                            }
                          >
                            {bookingId === classItem.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : classItem.is_booked ? (
                              "Cancel Booking"
                            ) : isFull ? (
                              "Class Full"
                            ) : (
                              "Book Now"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClassBooking;
