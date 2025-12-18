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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Calendar, List, Repeat } from "lucide-react";
import { format, addDays, addWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";

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
  recurrence_type: string | null;
  recurrence_days: number[] | null;
  recurrence_end_date: string | null;
  parent_class_id: string | null;
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
  recurrence_type: string;
  recurrence_days: number[];
  recurrence_end_date: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

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
  recurrence_type: "none",
  recurrence_days: [],
  recurrence_end_date: "",
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
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()));

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
      setClasses((data as FitnessClass[]) || []);
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
        recurrence_type: fitnessClass.recurrence_type || "none",
        recurrence_days: fitnessClass.recurrence_days || [],
        recurrence_end_date: fitnessClass.recurrence_end_date?.slice(0, 10) || "",
      });
    } else {
      setSelectedClass(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const generateRecurringClasses = async (parentId: string, baseData: any) => {
    if (formData.recurrence_type === "none" || !formData.recurrence_end_date) return;

    const startDate = new Date(formData.scheduled_at);
    const endDate = new Date(formData.recurrence_end_date);
    const classesToCreate: any[] = [];
    const baseTime = format(startDate, "HH:mm");

    let currentDate = addDays(startDate, 1);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      if (formData.recurrence_type === "weekly" && formData.recurrence_days.includes(dayOfWeek)) {
        const scheduledAt = new Date(currentDate);
        const [hours, minutes] = baseTime.split(":").map(Number);
        scheduledAt.setHours(hours, minutes, 0, 0);

        classesToCreate.push({
          ...baseData,
          scheduled_at: scheduledAt.toISOString(),
          parent_class_id: parentId,
        });
      } else if (formData.recurrence_type === "biweekly") {
        const weeksDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (weeksDiff % 2 === 0 && formData.recurrence_days.includes(dayOfWeek)) {
          const scheduledAt = new Date(currentDate);
          const [hours, minutes] = baseTime.split(":").map(Number);
          scheduledAt.setHours(hours, minutes, 0, 0);

          classesToCreate.push({
            ...baseData,
            scheduled_at: scheduledAt.toISOString(),
            parent_class_id: parentId,
          });
        }
      }

      currentDate = addDays(currentDate, 1);
    }

    if (classesToCreate.length > 0) {
      const { error } = await supabase.from("fitness_classes").insert(classesToCreate);
      if (error) {
        console.error("Error creating recurring classes:", error);
        toast.error("Some recurring classes failed to create");
      } else {
        toast.success(`Created ${classesToCreate.length} recurring class instances`);
      }
    }
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
      recurrence_type: formData.recurrence_type !== "none" ? formData.recurrence_type : null,
      recurrence_days: formData.recurrence_days.length > 0 ? formData.recurrence_days : null,
      recurrence_end_date: formData.recurrence_end_date ? new Date(formData.recurrence_end_date).toISOString() : null,
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
      const { data, error } = await supabase
        .from("fitness_classes")
        .insert(classData)
        .select()
        .single();

      if (error) {
        toast.error("Failed to create class");
        console.error(error);
      } else {
        toast.success("Class created successfully");
        
        if (formData.recurrence_type !== "none" && formData.recurrence_end_date) {
          await generateRecurringClasses(data.id, {
            name: classData.name,
            description: classData.description,
            instructor: classData.instructor,
            location: classData.location,
            duration_minutes: classData.duration_minutes,
            capacity: classData.capacity,
            points_reward: classData.points_reward,
            is_active: classData.is_active,
          });
        }
        
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

  const toggleRecurrenceDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      recurrence_days: prev.recurrence_days.includes(day)
        ? prev.recurrence_days.filter((d) => d !== day)
        : [...prev.recurrence_days, day],
    }));
  };

  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart),
  });

  const getClassesForDay = (date: Date) => {
    return classes.filter((cls) => {
      const classDate = parseISO(cls.scheduled_at);
      return isSameDay(classDate, date);
    });
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
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "calendar")}>
              <TabsList>
                <TabsTrigger value="list">
                  <List className="h-4 w-4 mr-1" />
                  List
                </TabsTrigger>
                <TabsTrigger value="calendar">
                  <Calendar className="h-4 w-4 mr-1" />
                  Calendar
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Class
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                  <div>
                    <Label htmlFor="scheduled_at">First Class Date & Time *</Label>
                    <Input
                      id="scheduled_at"
                      type="datetime-local"
                      value={formData.scheduled_at}
                      onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
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
                    <div>
                      <Label htmlFor="points">Points</Label>
                      <Input
                        id="points"
                        type="number"
                        min="0"
                        value={formData.points_reward}
                        onChange={(e) => setFormData({ ...formData, points_reward: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* Recurrence Section */}
                  {!selectedClass && (
                    <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-primary" />
                        <Label className="font-semibold">Recurring Schedule</Label>
                      </div>
                      
                      <div>
                        <Label htmlFor="recurrence_type">Repeat</Label>
                        <Select
                          value={formData.recurrence_type}
                          onValueChange={(v) => setFormData({ ...formData, recurrence_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Does not repeat</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Biweekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.recurrence_type !== "none" && (
                        <>
                          <div>
                            <Label className="mb-2 block">Repeat on days</Label>
                            <div className="flex flex-wrap gap-2">
                              {DAYS_OF_WEEK.map((day) => (
                                <div key={day.value} className="flex items-center gap-1.5">
                                  <Checkbox
                                    id={`day-${day.value}`}
                                    checked={formData.recurrence_days.includes(day.value)}
                                    onCheckedChange={() => toggleRecurrenceDay(day.value)}
                                  />
                                  <Label htmlFor={`day-${day.value}`} className="text-sm">
                                    {day.label.slice(0, 3)}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="recurrence_end_date">End Date</Label>
                            <Input
                              id="recurrence_end_date"
                              type="date"
                              value={formData.recurrence_end_date}
                              onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {viewMode === "list" ? (
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
                        <TableHead>Type</TableHead>
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
                            {cls.recurrence_type ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {cls.recurrence_type}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">One-time</span>
                            )}
                          </TableCell>
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
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Class Calendar</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, -1))}
                  >
                    Previous Week
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeekStart(startOfWeek(new Date()))}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
                  >
                    Next Week
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day) => (
                    <div key={day.toISOString()} className="min-h-[200px]">
                      <div
                        className={`text-center p-2 rounded-t-lg font-medium ${
                          isSameDay(day, new Date())
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="text-xs">{format(day, "EEE")}</div>
                        <div className="text-lg">{format(day, "d")}</div>
                      </div>
                      <div className="border border-t-0 rounded-b-lg p-1 space-y-1 min-h-[160px]">
                        {getClassesForDay(day).map((cls) => (
                          <div
                            key={cls.id}
                            className={`text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity ${
                              cls.is_active
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-muted text-muted-foreground"
                            }`}
                            onClick={() => handleOpenDialog(cls)}
                          >
                            <div className="font-medium truncate">{cls.name}</div>
                            <div className="text-[10px] opacity-75">
                              {format(parseISO(cls.scheduled_at), "h:mm a")}
                            </div>
                            {cls.instructor && (
                              <div className="text-[10px] opacity-75 truncate">
                                {cls.instructor}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
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
