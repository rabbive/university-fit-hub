import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dumbbell, Shield, GraduationCap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
        
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 text-foreground">
          Welcome to FitClub
        </h1>
        <p className="text-lg text-muted-foreground mb-12">
          University Fitness Club Management System
        </p>

        {/* Role Selection Cards */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-xl mx-auto">
          {/* Admin Card */}
          <Link to="/auth?role=admin" className="block">
            <div className="glass-hover rounded-2xl p-8 text-center group cursor-pointer border border-border/50 hover:border-primary/50 transition-all">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-semibold mb-2 text-foreground">Admin</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Manage classes, users, and view analytics
              </p>
              <Button className="w-full bg-primary hover:bg-primary/90">
                Login as Admin
              </Button>
            </div>
          </Link>

          {/* Student Card */}
          <Link to="/auth?role=student" className="block">
            <div className="glass-hover rounded-2xl p-8 text-center group cursor-pointer border border-border/50 hover:border-accent/50 transition-all">
              <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/20 transition-colors">
                <GraduationCap className="w-10 h-10 text-accent" />
              </div>
              <h2 className="font-display text-2xl font-semibold mb-2 text-foreground">Student</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Track workouts, book classes, earn points
              </p>
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                Login as Student
              </Button>
            </div>
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Don't have an account? Select your role above to sign up.
        </p>
      </div>
    </div>
  );
};

export default Index;
