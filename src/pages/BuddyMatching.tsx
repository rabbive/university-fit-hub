import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Users,
  UserPlus,
  MessageCircle,
  Check,
  X,
  Loader2,
  Target,
  Clock,
  Dumbbell,
  Search,
  Heart
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface BuddyProfile {
  user_id: string;
  preferred_times: string[];
  preferred_days: number[];
  workout_types: string[];
  looking_for_buddy: boolean;
  bio: string | null;
  profile?: {
    full_name: string | null;
    fitness_level: string | null;
    goals: string | null;
    avatar_url: string | null;
  };
  match_score?: number;
}

interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  message: string | null;
  requester_profile?: {
    full_name: string | null;
    fitness_level: string | null;
  };
  receiver_profile?: {
    full_name: string | null;
    fitness_level: string | null;
  };
}

const WORKOUT_TYPES = [
  "Weightlifting",
  "Cardio",
  "HIIT",
  "Yoga",
  "CrossFit",
  "Swimming",
  "Running",
  "Cycling",
  "Boxing",
  "Pilates"
];

const TIME_SLOTS = [
  "Early Morning (5-7 AM)",
  "Morning (7-10 AM)",
  "Midday (10 AM-1 PM)",
  "Afternoon (1-5 PM)",
  "Evening (5-8 PM)",
  "Night (8-10 PM)"
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const BuddyMatching = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<"find" | "requests" | "settings">("find");
  const [myPreferences, setMyPreferences] = useState<BuddyProfile | null>(null);
  const [potentialBuddies, setPotentialBuddies] = useState<BuddyProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [myConnections, setMyConnections] = useState<Connection[]>([]);
  
  const [formData, setFormData] = useState({
    preferred_times: [] as string[],
    preferred_days: [] as number[],
    workout_types: [] as string[],
    looking_for_buddy: true,
    bio: ""
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
        fetchData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchData = async (userId: string) => {
    try {
      // Fetch my preferences
      const { data: myPrefs } = await supabase
        .from("buddy_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (myPrefs) {
        setMyPreferences(myPrefs);
        setFormData({
          preferred_times: myPrefs.preferred_times || [],
          preferred_days: myPrefs.preferred_days || [],
          workout_types: myPrefs.workout_types || [],
          looking_for_buddy: myPrefs.looking_for_buddy,
          bio: myPrefs.bio || ""
        });
      }

      // Fetch all buddy preferences with profiles
      const { data: allBuddies } = await supabase
        .from("buddy_preferences")
        .select("*")
        .eq("looking_for_buddy", true)
        .neq("user_id", userId);

      if (allBuddies) {
        // Fetch profiles for each buddy
        const buddiesWithProfiles = await Promise.all(
          allBuddies.map(async (buddy) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, fitness_level, goals, avatar_url")
              .eq("id", buddy.user_id)
              .maybeSingle();

            // Calculate match score
            let score = 0;
            if (myPrefs) {
              const commonTimes = buddy.preferred_times?.filter(t => myPrefs.preferred_times?.includes(t)).length || 0;
              const commonDays = buddy.preferred_days?.filter(d => myPrefs.preferred_days?.includes(d)).length || 0;
              const commonTypes = buddy.workout_types?.filter(t => myPrefs.workout_types?.includes(t)).length || 0;
              score = (commonTimes * 15) + (commonDays * 10) + (commonTypes * 20);
            }

            return { ...buddy, profile, match_score: score };
          })
        );

        // Sort by match score
        buddiesWithProfiles.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
        setPotentialBuddies(buddiesWithProfiles);
      }

      // Fetch pending requests received
      const { data: requests } = await supabase
        .from("buddy_connections")
        .select("*")
        .eq("receiver_id", userId)
        .eq("status", "pending");

      if (requests) {
        const requestsWithProfiles = await Promise.all(
          requests.map(async (req) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, fitness_level")
              .eq("id", req.requester_id)
              .maybeSingle();
            return { ...req, requester_profile: profile };
          })
        );
        setPendingRequests(requestsWithProfiles);
      }

      // Fetch my connections
      const { data: connections } = await supabase
        .from("buddy_connections")
        .select("*")
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq("status", "accepted");

      if (connections) {
        const connectionsWithProfiles = await Promise.all(
          connections.map(async (conn) => {
            const otherId = conn.requester_id === userId ? conn.receiver_id : conn.requester_id;
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, fitness_level")
              .eq("id", otherId)
              .maybeSingle();
            return { 
              ...conn, 
              [conn.requester_id === userId ? 'receiver_profile' : 'requester_profile']: profile 
            };
          })
        );
        setMyConnections(connectionsWithProfiles);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const data = {
        user_id: user.id,
        ...formData,
        updated_at: new Date().toISOString()
      };

      if (myPreferences) {
        const { error } = await supabase
          .from("buddy_preferences")
          .update(data)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("buddy_preferences")
          .insert(data);
        if (error) throw error;
      }

      toast({
        title: "Preferences saved!",
        description: "Your buddy preferences have been updated."
      });

      fetchData(user.id);
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: error.message || "Could not save preferences.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const sendBuddyRequest = async (buddyId: string, buddyName: string) => {
    if (!user) return;
    setSendingRequest(buddyId);

    try {
      const { error } = await supabase
        .from("buddy_connections")
        .insert({
          requester_id: user.id,
          receiver_id: buddyId,
          message: `Hey! I'd love to work out together!`
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Request already sent",
            description: "You've already sent a request to this person.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Request sent! 🤝",
          description: `Your buddy request has been sent to ${buddyName}.`
        });
      }
    } catch (error: any) {
      console.error("Error sending request:", error);
      toast({
        title: "Error",
        description: error.message || "Could not send request.",
        variant: "destructive"
      });
    } finally {
      setSendingRequest(null);
    }
  };

  const handleRequest = async (connectionId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from("buddy_connections")
        .update({ status: accept ? "accepted" : "declined" })
        .eq("id", connectionId);

      if (error) throw error;

      toast({
        title: accept ? "Buddy request accepted! 🎉" : "Request declined",
        description: accept ? "You have a new workout buddy!" : "The request has been declined."
      });

      if (user) fetchData(user.id);
    } catch (error: any) {
      console.error("Error handling request:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">Workout Buddies</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border/50">
        <div className="container mx-auto px-6">
          <div className="flex gap-6">
            {[
              { id: "find", label: "Find Buddies", icon: Search },
              { id: "requests", label: "Requests", icon: MessageCircle, count: pendingRequests.length },
              { id: "settings", label: "My Preferences", icon: Target }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count && tab.count > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* My Buddies */}
        {myConnections.length > 0 && activeTab === "find" && (
          <div className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              Your Workout Buddies ({myConnections.length})
            </h2>
            <div className="flex flex-wrap gap-3">
              {myConnections.map((conn) => {
                const profile = conn.requester_id === user?.id ? conn.receiver_profile : conn.requester_profile;
                return (
                  <div key={conn.id} className="flex items-center gap-2 px-3 py-2 rounded-full bg-accent/10 border border-accent/30">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                      <Users className="w-3 h-3 text-accent" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{profile?.full_name || "Anonymous"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Find Buddies Tab */}
        {activeTab === "find" && (
          <div>
            {!myPreferences ? (
              <div className="glass rounded-2xl p-8 text-center border border-border/50">
                <Target className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  Set Up Your Profile First
                </h3>
                <p className="text-muted-foreground mb-4">
                  Tell us about your workout preferences to find compatible buddies.
                </p>
                <Button onClick={() => setActiveTab("settings")}>
                  Set Preferences
                </Button>
              </div>
            ) : potentialBuddies.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center border border-border/50">
                <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  No Buddies Available Yet
                </h3>
                <p className="text-muted-foreground">
                  Check back soon! More people are joining every day.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {potentialBuddies.map((buddy) => (
                  <div key={buddy.user_id} className="glass-hover rounded-2xl p-6 border border-border/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <Users className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">
                              {buddy.profile?.full_name || "Anonymous"}
                            </h3>
                            {buddy.match_score && buddy.match_score > 30 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                                {buddy.match_score}% match
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">
                            {buddy.profile?.fitness_level || "Not specified"} level
                          </p>
                          {buddy.bio && (
                            <p className="text-sm text-muted-foreground mt-2 italic">"{buddy.bio}"</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {buddy.workout_types?.slice(0, 3).map((type) => (
                              <span key={type} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => sendBuddyRequest(buddy.user_id, buddy.profile?.full_name || "this person")}
                        disabled={sendingRequest === buddy.user_id}
                        size="sm"
                      >
                        {sendingRequest === buddy.user_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-1" />
                            Connect
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div>
            {pendingRequests.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center border border-border/50">
                <MessageCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  No Pending Requests
                </h3>
                <p className="text-muted-foreground">
                  You'll see buddy requests here when someone wants to connect.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="glass rounded-2xl p-6 border border-primary/30">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {request.requester_profile?.full_name || "Anonymous"}
                          </h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {request.requester_profile?.fitness_level || "Not specified"} level
                          </p>
                          {request.message && (
                            <p className="text-sm text-muted-foreground mt-1">"{request.message}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRequest(request.id, false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRequest(request.id, true)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="glass rounded-2xl p-6 border border-border/50">
            <h2 className="font-display text-lg font-semibold mb-6 text-foreground">My Buddy Preferences</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Looking for a workout buddy</Label>
                  <p className="text-sm text-muted-foreground">Allow others to find and connect with you</p>
                </div>
                <Switch
                  checked={formData.looking_for_buddy}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, looking_for_buddy: checked }))}
                />
              </div>

              <div>
                <Label className="text-base mb-3 block">Preferred Workout Times</Label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {TIME_SLOTS.map((time) => (
                    <label key={time} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 cursor-pointer">
                      <Checkbox
                        checked={formData.preferred_times.includes(time)}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            preferred_times: checked
                              ? [...prev.preferred_times, time]
                              : prev.preferred_times.filter(t => t !== time)
                          }));
                        }}
                      />
                      <span className="text-sm">{time}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base mb-3 block">Preferred Days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          preferred_days: prev.preferred_days.includes(index)
                            ? prev.preferred_days.filter(d => d !== index)
                            : [...prev.preferred_days, index]
                        }));
                      }}
                      className={`w-12 h-12 rounded-lg font-medium transition-colors ${
                        formData.preferred_days.includes(index)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base mb-3 block">Workout Types</Label>
                <div className="flex flex-wrap gap-2">
                  {WORKOUT_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          workout_types: prev.workout_types.includes(type)
                            ? prev.workout_types.filter(t => t !== type)
                            : [...prev.workout_types, type]
                        }));
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.workout_types.includes(type)
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio (optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell potential buddies about yourself, your goals, and what you're looking for..."
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="mt-2 bg-secondary/50 border-border/50 min-h-[100px]"
                />
              </div>

              <Button onClick={savePreferences} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BuddyMatching;
