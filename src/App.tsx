import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";
import ClassManagement from "./pages/ClassManagement";
import BookingManagement from "./pages/BookingManagement";
import ChallengeManagement from "./pages/ChallengeManagement";
import AchievementManagement from "./pages/AchievementManagement";
import Analytics from "./pages/Analytics";
import WorkoutLogger from "./pages/WorkoutLogger";
import ClassBooking from "./pages/ClassBooking";
import AIWorkoutPlanner from "./pages/AIWorkoutPlanner";
import Leaderboard from "./pages/Leaderboard";
import Achievements from "./pages/Achievements";
import Challenges from "./pages/Challenges";
import Profile from "./pages/Profile";
import GymOccupancy from "./pages/GymOccupancy";
import WorkoutHistory from "./pages/WorkoutHistory";
import BuddyMatching from "./pages/BuddyMatching";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/classes" element={<ClassManagement />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/bookings" element={<BookingManagement />} />
          <Route path="/admin/challenges" element={<ChallengeManagement />} />
          <Route path="/admin/achievements" element={<AchievementManagement />} />
          <Route path="/workout/log" element={<WorkoutLogger />} />
          <Route path="/workout/history" element={<WorkoutHistory />} />
          <Route path="/classes" element={<ClassBooking />} />
          <Route path="/ai-planner" element={<AIWorkoutPlanner />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/gym-occupancy" element={<GymOccupancy />} />
          <Route path="/buddy-matching" element={<BuddyMatching />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
