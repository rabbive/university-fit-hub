import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInDays, isPast } from "date-fns";
import { 
  ArrowLeft, 
  Swords,
  Trophy,
  Clock,
  Users,
  CheckCircle2,
  Target,
  Loader2,
  Flame
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Challenge {
  id: string;
  name: string;
  description: string | null;
  challenge_type: string | null;
  target_value: number;
  points_reward: number;
  start_date: string;
  end_date: string;
  participant_count?: number;
  user_progress?: number;
  user_joined?: boolean;
  user_completed?: boolean;
}

const Challenges = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

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
        fetchChallenges(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchChallenges = async (userId: string) => {
    try {
      // Fetch active challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .order("end_date", { ascending: true });

      if (challengesError) throw challengesError;

      // Fetch user's participations
      const { data: participations, error: participationsError } = await supabase
        .from("challenge_participants")
        .select("challenge_id, progress, completed")
        .eq("user_id", userId);

      if (participationsError) throw participationsError;

      const participationMap = new Map(
        participations?.map(p => [p.challenge_id, { progress: p.progress || 0, completed: p.completed }])
      );

      // Get participant counts
      const challengesWithData = await Promise.all(
        (challengesData || []).map(async (challenge) => {
          const { count } = await supabase
            .from("challenge_participants")
            .select("*", { count: "exact", head: true })
            .eq("challenge_id", challenge.id);

          const userParticipation = participationMap.get(challenge.id);

          return {
            ...challenge,
            participant_count: count || 0,
            user_progress: userParticipation?.progress || 0,
            user_joined: participationMap.has(challenge.id),
            user_completed: userParticipation?.completed || false
          };
        })
      );

      setChallenges(challengesWithData);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challenge: Challenge) => {
    if (!user) return;

    setJoiningId(challenge.id);

    try {
      const { error } = await supabase
        .from("challenge_participants")
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          progress: 0
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already joined",
            description: "You've already joined this challenge.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Challenge joined! 💪",
          description: `You've joined "${challenge.name}". Good luck!`
        });

        setChallenges(prev => prev.map(c =>
          c.id === challenge.id
            ? { ...c, user_joined: true, participant_count: (c.participant_count || 0) + 1, user_progress: 0 }
            : c
        ));
      }
    } catch (error: any) {
      console.error("Error joining challenge:", error);
      toast({
        title: "Error",
        description: error.message || "Could not join challenge.",
        variant: "destructive"
      });
    } finally {
      setJoiningId(null);
    }
  };

  const getChallengeTypeIcon = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case "workout":
        return <Target className="w-5 h-5" />;
      case "streak":
        return <Flame className="w-5 h-5" />;
      default:
        return <Swords className="w-5 h-5" />;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(parseISO(endDate), new Date());
    if (days < 0) return "Ended";
    if (days === 0) return "Ends today";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeChallenges = challenges.filter(c => !isPast(parseISO(c.end_date)));
  const joinedChallenges = activeChallenges.filter(c => c.user_joined);
  const availableChallenges = activeChallenges.filter(c => !c.user_joined);

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
                <Swords className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">Challenges</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Joined Challenges */}
        {joinedChallenges.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              Your Active Challenges
            </h2>
            
            <div className="space-y-4">
              {joinedChallenges.map((challenge) => {
                const progressPercent = challenge.target_value > 0
                  ? Math.min(((challenge.user_progress || 0) / challenge.target_value) * 100, 100)
                  : 0;

                return (
                  <div
                    key={challenge.id}
                    className={`glass rounded-2xl p-6 border transition-all ${
                      challenge.user_completed
                        ? "border-accent/50 bg-accent/5"
                        : "border-primary/30 bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          challenge.user_completed ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                        }`}>
                          {challenge.user_completed ? (
                            <Trophy className="w-6 h-6" />
                          ) : (
                            getChallengeTypeIcon(challenge.challenge_type)
                          )}
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-semibold text-foreground">
                            {challenge.name}
                            {challenge.user_completed && (
                              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                                Completed!
                              </span>
                            )}
                          </h3>
                          {challenge.description && (
                            <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold text-primary">+{challenge.points_reward}</div>
                        <div className="text-xs text-muted-foreground">points</div>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">
                          {challenge.user_progress || 0} / {challenge.target_value}
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getDaysRemaining(challenge.end_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {challenge.participant_count} participants
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Challenges */}
        <div>
          <h2 className="font-display text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            Available Challenges
          </h2>

          {availableChallenges.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center border border-border/50">
              <Swords className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {joinedChallenges.length > 0 ? "You've joined all challenges!" : "No Challenges Available"}
              </h3>
              <p className="text-muted-foreground">
                {joinedChallenges.length > 0 
                  ? "Keep working on your active challenges."
                  : "Check back soon for new challenges!"}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {availableChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="glass-hover rounded-2xl p-6 border border-border/50"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                      {getChallengeTypeIcon(challenge.challenge_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{challenge.name}</h3>
                      {challenge.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{challenge.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Goal: {challenge.target_value}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getDaysRemaining(challenge.end_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {challenge.participant_count}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">+{challenge.points_reward} pts</span>
                    <Button
                      size="sm"
                      onClick={() => handleJoinChallenge(challenge)}
                      disabled={joiningId === challenge.id}
                    >
                      {joiningId === challenge.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Join Challenge"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Challenges;
