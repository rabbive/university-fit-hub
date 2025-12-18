import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Trophy,
  Target,
  Users,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface Challenge {
  id: string;
  name: string;
  description: string | null;
  challenge_type: string | null;
  start_date: string;
  end_date: string;
  target_value: number | null;
  points_reward: number | null;
  is_active: boolean | null;
  participant_count?: number;
}

interface ChallengeForm {
  name: string;
  description: string;
  challenge_type: string;
  start_date: string;
  end_date: string;
  target_value: number;
  points_reward: number;
  is_active: boolean;
}

const initialForm: ChallengeForm = {
  name: "",
  description: "",
  challenge_type: "workout_count",
  start_date: "",
  end_date: "",
  target_value: 1,
  points_reward: 100,
  is_active: true,
};

const ChallengeManagement = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [form, setForm] = useState<ChallengeForm>(initialForm);
  const [saving, setSaving] = useState(false);

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
    await fetchChallenges();
  };

  const fetchChallenges = async () => {
    setLoading(true);
    
    const { data: challengesData, error } = await supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch challenges");
      setLoading(false);
      return;
    }

    // Get participant counts
    const { data: participantCounts } = await supabase
      .from("challenge_participants")
      .select("challenge_id");

    const countMap = new Map<string, number>();
    participantCounts?.forEach(p => {
      countMap.set(p.challenge_id, (countMap.get(p.challenge_id) || 0) + 1);
    });

    const formattedChallenges: Challenge[] = (challengesData || []).map(c => ({
      ...c,
      participant_count: countMap.get(c.id) || 0,
    }));

    setChallenges(formattedChallenges);
    setLoading(false);
  };

  const handleOpenDialog = (challenge?: Challenge) => {
    if (challenge) {
      setSelectedChallenge(challenge);
      setForm({
        name: challenge.name,
        description: challenge.description || "",
        challenge_type: challenge.challenge_type || "workout_count",
        start_date: challenge.start_date.split("T")[0],
        end_date: challenge.end_date.split("T")[0],
        target_value: challenge.target_value || 1,
        points_reward: challenge.points_reward || 100,
        is_active: challenge.is_active ?? true,
      });
    } else {
      setSelectedChallenge(null);
      setForm(initialForm);
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const challengeData = {
      name: form.name,
      description: form.description || null,
      challenge_type: form.challenge_type,
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      target_value: form.target_value,
      points_reward: form.points_reward,
      is_active: form.is_active,
    };

    if (selectedChallenge) {
      const { error } = await supabase
        .from("challenges")
        .update(challengeData)
        .eq("id", selectedChallenge.id);

      if (error) {
        toast.error("Failed to update challenge");
        setSaving(false);
        return;
      }
      toast.success("Challenge updated");
    } else {
      const { error } = await supabase
        .from("challenges")
        .insert(challengeData);

      if (error) {
        toast.error("Failed to create challenge");
        setSaving(false);
        return;
      }
      toast.success("Challenge created");
    }

    setSaving(false);
    setDialogOpen(false);
    fetchChallenges();
  };

  const handleDelete = async () => {
    if (!selectedChallenge) return;

    const { error } = await supabase
      .from("challenges")
      .delete()
      .eq("id", selectedChallenge.id);

    if (error) {
      toast.error("Failed to delete challenge");
      return;
    }

    toast.success("Challenge deleted");
    setDeleteDialogOpen(false);
    setSelectedChallenge(null);
    fetchChallenges();
  };

  const handleToggleActive = async (challenge: Challenge) => {
    const { error } = await supabase
      .from("challenges")
      .update({ is_active: !challenge.is_active })
      .eq("id", challenge.id);

    if (error) {
      toast.error("Failed to update challenge");
      return;
    }

    setChallenges(prev =>
      prev.map(c => (c.id === challenge.id ? { ...c, is_active: !c.is_active } : c))
    );
  };

  const stats = {
    total: challenges.length,
    active: challenges.filter(c => c.is_active).length,
    totalParticipants: challenges.reduce((sum, c) => sum + (c.participant_count || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-foreground">Challenge Management</h1>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Challenge
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {selectedChallenge ? "Edit Challenge" : "Create Challenge"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={form.start_date}
                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={form.end_date}
                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="target_value">Target Value</Label>
                      <Input
                        id="target_value"
                        type="number"
                        min={1}
                        value={form.target_value}
                        onChange={(e) => setForm({ ...form, target_value: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="points_reward">Points Reward</Label>
                      <Input
                        id="points_reward"
                        type="number"
                        min={0}
                        value={form.points_reward}
                        onChange={(e) => setForm({ ...form, points_reward: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Active</Label>
                    <Switch
                      id="is_active"
                      checked={form.is_active}
                      onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {selectedChallenge ? "Update" : "Create"} Challenge
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Challenges</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
              <Target className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalParticipants}</div>
            </CardContent>
          </Card>
        </div>

        {/* Challenges Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challenges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No challenges found. Create your first challenge!
                    </TableCell>
                  </TableRow>
                ) : (
                  challenges.map((challenge) => (
                    <TableRow key={challenge.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{challenge.name}</div>
                          {challenge.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {challenge.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(challenge.start_date), "MMM d")} -{" "}
                          {format(new Date(challenge.end_date), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>{challenge.target_value}</TableCell>
                      <TableCell>{challenge.points_reward} pts</TableCell>
                      <TableCell>{challenge.participant_count}</TableCell>
                      <TableCell>
                        <Badge
                          variant={challenge.is_active ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => handleToggleActive(challenge)}
                        >
                          {challenge.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(challenge)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedChallenge(challenge);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Challenge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedChallenge?.name}"? This will also remove
              all participant data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChallengeManagement;
