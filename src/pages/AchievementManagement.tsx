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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Award,
  Users,
  Loader2,
  Star,
} from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  points_value: number | null;
  earned_count?: number;
}

interface AchievementForm {
  name: string;
  description: string;
  icon: string;
  category: string;
  points_value: number;
}

const ICONS = ["🏆", "⭐", "🎯", "💪", "🔥", "🏅", "🌟", "💎", "🚀", "👑", "🎖️", "🏃"];
const CATEGORIES = ["workout", "streak", "social", "class", "challenge", "special"];

const initialForm: AchievementForm = {
  name: "",
  description: "",
  icon: "🏆",
  category: "workout",
  points_value: 50,
};

const AchievementManagement = () => {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [form, setForm] = useState<AchievementForm>(initialForm);
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
    await fetchAchievements();
  };

  const fetchAchievements = async () => {
    setLoading(true);
    
    const { data: achievementsData, error } = await supabase
      .from("achievements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch achievements");
      setLoading(false);
      return;
    }

    // Get earned counts
    const { data: earnedCounts } = await supabase
      .from("user_achievements")
      .select("achievement_id");

    const countMap = new Map<string, number>();
    earnedCounts?.forEach(e => {
      countMap.set(e.achievement_id, (countMap.get(e.achievement_id) || 0) + 1);
    });

    const formattedAchievements: Achievement[] = (achievementsData || []).map(a => ({
      ...a,
      earned_count: countMap.get(a.id) || 0,
    }));

    setAchievements(formattedAchievements);
    setLoading(false);
  };

  const handleOpenDialog = (achievement?: Achievement) => {
    if (achievement) {
      setSelectedAchievement(achievement);
      setForm({
        name: achievement.name,
        description: achievement.description || "",
        icon: achievement.icon || "🏆",
        category: achievement.category || "workout",
        points_value: achievement.points_value || 50,
      });
    } else {
      setSelectedAchievement(null);
      setForm(initialForm);
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const achievementData = {
      name: form.name,
      description: form.description || null,
      icon: form.icon,
      category: form.category,
      points_value: form.points_value,
    };

    if (selectedAchievement) {
      const { error } = await supabase
        .from("achievements")
        .update(achievementData)
        .eq("id", selectedAchievement.id);

      if (error) {
        toast.error("Failed to update achievement");
        setSaving(false);
        return;
      }
      toast.success("Achievement updated");
    } else {
      const { error } = await supabase
        .from("achievements")
        .insert(achievementData);

      if (error) {
        toast.error("Failed to create achievement");
        setSaving(false);
        return;
      }
      toast.success("Achievement created");
    }

    setSaving(false);
    setDialogOpen(false);
    fetchAchievements();
  };

  const handleDelete = async () => {
    if (!selectedAchievement) return;

    const { error } = await supabase
      .from("achievements")
      .delete()
      .eq("id", selectedAchievement.id);

    if (error) {
      toast.error("Failed to delete achievement");
      return;
    }

    toast.success("Achievement deleted");
    setDeleteDialogOpen(false);
    setSelectedAchievement(null);
    fetchAchievements();
  };

  const stats = {
    total: achievements.length,
    totalEarned: achievements.reduce((sum, a) => sum + (a.earned_count || 0), 0),
    categories: new Set(achievements.map(a => a.category)).size,
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
              <h1 className="text-xl font-bold text-foreground">Achievement Management</h1>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Achievement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {selectedAchievement ? "Edit Achievement" : "Create Achievement"}
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
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ICONS.map((icon) => (
                            <SelectItem key={icon} value={icon}>
                              <span className="text-xl">{icon}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="points_value">Points Value</Label>
                    <Input
                      id="points_value"
                      type="number"
                      min={0}
                      value={form.points_value}
                      onChange={(e) => setForm({ ...form, points_value: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {selectedAchievement ? "Update" : "Create"} Achievement
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
              <CardTitle className="text-sm font-medium">Total Achievements</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Times Earned</CardTitle>
              <Star className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.totalEarned}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categories}</div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Achievement</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Times Earned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {achievements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No achievements found. Create your first achievement!
                    </TableCell>
                  </TableRow>
                ) : (
                  achievements.map((achievement) => (
                    <TableRow key={achievement.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{achievement.icon}</span>
                          <div>
                            <div className="font-medium">{achievement.name}</div>
                            {achievement.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-[250px]">
                                {achievement.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {achievement.category?.charAt(0).toUpperCase() + (achievement.category?.slice(1) || "")}
                        </Badge>
                      </TableCell>
                      <TableCell>{achievement.points_value} pts</TableCell>
                      <TableCell>{achievement.earned_count}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(achievement)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedAchievement(achievement);
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
            <AlertDialogTitle>Delete Achievement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedAchievement?.name}"? Users who earned this
              achievement will lose it. This action cannot be undone.
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

export default AchievementManagement;
