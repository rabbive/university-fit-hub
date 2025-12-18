import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Dumbbell, 
  Trophy, 
  Users, 
  Sparkles, 
  ArrowRight, 
  Calendar,
  Target,
  Zap,
  ChevronRight
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background dark">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">FitClub</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#leaderboard" className="text-muted-foreground hover:text-foreground transition-colors">Leaderboard</a>
            <a href="#ai" className="text-muted-foreground hover:text-foreground transition-colors">AI Planner</a>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="hidden sm:inline-flex">Log in</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button className="bg-primary hover:bg-primary/90">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">University Fitness Club Platform</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Level Up Your
              <span className="block gradient-text">Fitness Journey</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Track workouts, compete with friends, book classes, and get AI-powered workout plans. 
              Your complete fitness companion for university life.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/auth?mode=signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 glow">
                  Start Your Journey
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-border/50">
                  Explore Features
                </Button>
              </a>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-display font-bold text-foreground">500+</div>
                <div className="text-sm text-muted-foreground mt-1">Active Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-display font-bold text-foreground">50+</div>
                <div className="text-sm text-muted-foreground mt-1">Weekly Classes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-display font-bold text-foreground">24/7</div>
                <div className="text-sm text-muted-foreground mt-1">Gym Access</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Everything You Need to
              <span className="gradient-text"> Succeed</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our platform combines fitness tracking, social features, and AI-powered guidance in one seamless experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="glass-hover rounded-2xl p-6 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Workout Tracking</h3>
              <p className="text-muted-foreground text-sm">
                Log exercises, track personal records, and visualize your progress over time.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="glass-hover rounded-2xl p-6 group">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Trophy className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Leaderboards</h3>
              <p className="text-muted-foreground text-sm">
                Compete with friends, earn badges, and climb the ranks with our gamification system.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="glass-hover rounded-2xl p-6 group">
              <div className="w-12 h-12 rounded-xl bg-energy/10 flex items-center justify-center mb-4 group-hover:bg-energy/20 transition-colors">
                <Calendar className="w-6 h-6 text-energy" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Class Booking</h3>
              <p className="text-muted-foreground text-sm">
                Browse and book fitness classes, yoga sessions, and more with just a tap.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="glass-hover rounded-2xl p-6 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">AI Workout Planner</h3>
              <p className="text-muted-foreground text-sm">
                Get personalized workout plans generated by AI based on your goals and preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section id="ai" className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
                <Zap className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-accent">AI-Powered</span>
              </div>
              
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
                Your Personal
                <span className="block text-accent">AI Trainer</span>
              </h2>
              
              <p className="text-muted-foreground text-lg mb-8">
                Tell our AI your fitness goals, experience level, and available time. 
                Get customized workout plans that adapt as you progress.
              </p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-foreground">Personalized workout plans</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-foreground">Adapts to your progress</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-foreground">Ask fitness questions anytime</span>
                </li>
              </ul>
              
              <Link to="/auth?mode=signup">
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground glow-accent">
                  Try AI Planner
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            {/* AI Visual */}
            <div className="relative">
              <div className="glass rounded-2xl p-8 border border-accent/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">AI Workout Planner</div>
                    <div className="text-sm text-muted-foreground">Generating your plan...</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">Monday - Upper Body</div>
                    <div className="text-xs text-muted-foreground">Bench Press, Rows, Shoulder Press, Bicep Curls</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">Wednesday - Lower Body</div>
                    <div className="text-xs text-muted-foreground">Squats, Deadlifts, Leg Press, Calf Raises</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">Friday - Full Body</div>
                    <div className="text-xs text-muted-foreground">Clean & Press, Pull-ups, Lunges, Core Work</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section id="leaderboard" className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Compete &
              <span className="gradient-text"> Conquer</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Earn points, unlock achievements, and climb the leaderboard. Turn your fitness journey into an exciting challenge.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-border/50">
                <h3 className="font-display text-xl font-semibold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-warning" />
                  Top Performers
                </h3>
              </div>
              
              <div className="divide-y divide-border/50">
                {[
                  { rank: 1, name: "Alex Johnson", points: 2450, badge: "🥇" },
                  { rank: 2, name: "Sam Wilson", points: 2280, badge: "🥈" },
                  { rank: 3, name: "Jordan Lee", points: 2150, badge: "🥉" },
                  { rank: 4, name: "Taylor Chen", points: 1980, badge: "💪" },
                  { rank: 5, name: "Morgan Davis", points: 1820, badge: "🔥" },
                ].map((user) => (
                  <div key={user.rank} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-semibold text-sm">
                      {user.rank}
                    </div>
                    <div className="text-xl">{user.badge}</div>
                    <div className="flex-1">
                      <div className="font-medium">{user.name}</div>
                    </div>
                    <div className="text-primary font-semibold">{user.points.toLocaleString()} pts</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="glass rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
            
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
                Ready to Transform
                <span className="block gradient-text">Your Fitness?</span>
              </h2>
              
              <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
                Join hundreds of students already crushing their fitness goals. Start your journey today.
              </p>
              
              <Link to="/auth?mode=signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold">FitClub</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            
            <div className="text-sm text-muted-foreground">
              © 2024 FitClub. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
