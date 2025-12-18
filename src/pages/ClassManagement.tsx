import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface FitnessClass {
  id: string;
  name: string;
  description: string | null;
  instructor: string | null;
  location: string | null;
  scheduled_at: string;
  duration_minutes: number;
  capacity: number;
  points_reward: number;
  is_active: boolean;
  created_at: string;
}

interface ClassFormData {
  name: string;
  description: string;
  instructor: string;
  location: string;
  scheduled_at: string;
  duration_minutes: number;
  capacity: number;
  points_reward: number;
  is_active: boolean;
}

const initialFormData: ClassFormData = {
  name: "",
  description: "",
  instructor: "",
  location: "",
  scheduled_at: "",
  duration_minutes: 60,
  capacity: 20,
  points_reward: 15,
  is_active: true,
};

const ClassManagement = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<FitnessClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<FitnessClass | null>(null);
  const [formData, setFormData] = useState<ClassFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

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
      fetchClasses();
    };

    checkAuthAndFetch();
  }, [navigate]);

  const fetchClasses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fitness_classes")
      .select("*")
      .order("scheduled_at", { ascending: true });

    if (error) {
      toast.error("Failed to fetch classes");
      console.error(error);
    } else {
      setClasses(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (fitnessClass?: FitnessClass) => {
    if (fitnessClass) {
      setSelectedClass(fitnessClass);
      setFormData({
        name: fitnessClass.name,
        description: fitnessClass.description || "",
        instructor: fitnessClass.instructor || "",
        location: fitnessClass.location || "",
        scheduled_at: fitnessClass.scheduled_at.slice(0, 16),
        duration_minutes: fitnessClass.duration_minutes,
        capacity: fitnessClass.capacity,
        points_reward: fitnessClass.points_reward,
        is_active: fitnessClass.is_active,
      });
    } else {
      setSelectedClass(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const classData = {
      name: formData.name,
      description: formData.description || null,
      instructor: formData.instructor || null,
      location: formData.location || null,
      scheduled_at: new Date(formData.scheduled_at).toISOString(),
      duration_minutes: formData.duration_minutes,
      capacity: formData.capacity,
      points_reward: formData.points_reward,
      is_active: formData.is_active,
    };

    if (selectedClass) {
      const { error } = await supabase
        .from("fitness_classes")
        .update(classData)
        .eq("id", selectedClass.id);

      if (error) {
        toast.error("Failed to update class");
        console.error(error);
      } else {
        toast.success("Class updated successfully");
        setDialogOpen(false);
        fetchClasses();
      }
    } else {
      const { error } = await supabase
        .from("fitness_classes")
        .insert(classData);

      if (error) {
        toast.error("Failed to create class");
        console.error(error);
      } else {
        toast.success("Class created successfully");
        setDialogOpen(false);
        fetchClasses();
      }
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedClass) return;

    const { error } = await supabase
      .from("fitness_classes")
      .delete()
      .eq("id", selectedClass.id);

    if (error) {
      toast.error("Failed to delete class");
      console.error(error);
    } else {
      toast.success("Class deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedClass(null);
      fetchClasses();
    }
  };

  const openDeleteDialog = (fitnessClass: FitnessClass) => {
    setSelectedClass(fitnessClass);
    setDeleteDialogOpen(true);
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
            <h1 className="text-2xl font-bold text-foreground">Class Management</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedClass ? "Edit Class" : "Add New Class"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Class Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="instructor">Instructor</Label>
                  <Input
                    id="instructor"
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="scheduled_at">Scheduled At *</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="15"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="points">Points Reward</Label>
                  <Input
                    id="points"
                    type="number"
                    min="0"
                    value={formData.points_reward}
                    onChange={(e) => setFormData({ ...formData, points_reward: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {selectedClass ? "Update Class" : "Create Class"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Fitness Classes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No classes found. Create your first class!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>{cls.instructor || "-"}</TableCell>
                        <TableCell>{cls.location || "-"}</TableCell>
                        <TableCell>
                          {format(new Date(cls.scheduled_at), "MMM d, yyyy h:mm a")}
                        </TableCell>
                        <TableCell>{cls.duration_minutes} min</TableCell>
                        <TableCell>{cls.capacity}</TableCell>
                        <TableCell>{cls.points_reward}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              cls.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {cls.is_active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleOpenDialog(cls)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openDeleteDialog(cls)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedClass?.name}"? This action cannot be undone.
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

export default ClassManagement;
