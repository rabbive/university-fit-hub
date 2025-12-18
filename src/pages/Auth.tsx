import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dumbbell, ArrowLeft, Loader2, Mail, Lock, User, Shield, GraduationCap } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const role = searchParams.get("role") || "student";
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [isLoading, setIsLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});

  const getDashboardRoute = () => {
    return role === "admin" ? "/admin" : "/dashboard";
  };

  // Check if user is already logged in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate(getDashboardRoute());
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(getDashboardRoute());
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, role]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; fullName?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    if (isSignUp && !fullName.trim()) {
      newErrors.fullName = "Please enter your name";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
            },
          },
        });
        
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please log in instead.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Welcome to FitClub!",
            description: "Your account has been created successfully.",
          });
          navigate(getDashboardRoute());
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Login failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You've been logged in successfully.",
          });
          navigate(getDashboardRoute());
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              role === "admin" 
                ? "bg-gradient-to-br from-primary to-primary/80" 
                : "bg-gradient-to-br from-accent to-accent/80"
            }`}>
              {role === "admin" ? (
                <Shield className="w-6 h-6 text-primary-foreground" />
              ) : (
                <GraduationCap className="w-6 h-6 text-accent-foreground" />
              )}
            </div>
            <div>
              <span className="font-display text-2xl font-bold text-foreground">FitClub</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                role === "admin" 
                  ? "bg-primary/10 text-primary" 
                  : "bg-accent/10 text-accent"
              }`}>
                {role === "admin" ? "Admin" : "Student"}
              </span>
            </div>
          </div>
          
          <h1 className="font-display text-3xl font-bold mb-2 text-foreground">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {isSignUp 
              ? `Sign up as ${role === "admin" ? "an administrator" : "a student"}` 
              : `Log in to your ${role} account`
            }
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12 bg-secondary/50 border-border/50"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-secondary/50 border-border/50"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-secondary/50 border-border/50"
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isSignUp ? "Creating account..." : "Logging in..."}
                </>
              ) : (
                isSignUp ? "Create Account" : "Log In"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? (
                <>Already have an account? <span className="text-primary font-medium">Log in</span></>
              ) : (
                <>Don't have an account? <span className="text-primary font-medium">Sign up</span></>
              )}
            </button>
          </div>

          {/* Demo Credentials Box */}
          <div className="mt-8 p-4 rounded-xl bg-secondary/50 border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎮</span>
              <span className="font-medium text-foreground">Demo Credentials</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-medium text-primary">Admin Login</span>
                </div>
                <div className="text-muted-foreground space-y-0.5">
                  <div>Email: <span className="text-foreground font-mono">admin@test.com</span></div>
                  <div>Password: <span className="text-foreground font-mono">password123</span></div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="w-4 h-4 text-accent" />
                  <span className="font-medium text-accent">Student Login</span>
                </div>
                <div className="text-muted-foreground space-y-0.5">
                  <div>Email: <span className="text-foreground font-mono">student@test.com</span></div>
                  <div>Password: <span className="text-foreground font-mono">password123</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-background" />
        
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="glass rounded-3xl p-8 max-w-md animate-fade-in">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-3xl">🏆</span>
                </div>
                <div>
                  <div className="font-display text-2xl font-bold">2,450 pts</div>
                  <div className="text-muted-foreground">Current Ranking: #3</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-secondary/50 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">💪</div>
                  <div className="text-sm text-muted-foreground">42 Workouts</div>
                </div>
                <div className="bg-secondary/50 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">🔥</div>
                  <div className="text-sm text-muted-foreground">14 Day Streak</div>
                </div>
                <div className="bg-secondary/50 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-sm text-muted-foreground">8 PRs</div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border/50">
                <div className="text-sm text-muted-foreground mb-3">Recent Achievements</div>
                <div className="flex gap-2">
                  <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center text-lg">🥇</div>
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-lg">🌅</div>
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-lg">💯</div>
                  <div className="w-10 h-10 rounded-lg bg-energy/20 flex items-center justify-center text-lg">🔥</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-20 w-20 h-20 rounded-2xl bg-primary/20 backdrop-blur animate-float" />
        <div className="absolute bottom-32 right-20 w-16 h-16 rounded-full bg-accent/20 backdrop-blur animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-32 w-12 h-12 rounded-lg bg-energy/20 backdrop-blur animate-float" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
};

export default Auth;
