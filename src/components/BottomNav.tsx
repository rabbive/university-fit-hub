import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Dumbbell, Calendar, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/workout/log", icon: Dumbbell, label: "Workout" },
  { path: "/classes", icon: Calendar, label: "Classes" },
  { path: "/leaderboard", icon: Trophy, label: "Ranks" },
  { path: "/profile", icon: User, label: "Profile" },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 h-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 w-8 h-1 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <item.icon className="w-5 h-5" />
              </motion.div>
              <span className={cn(
                "text-[10px] mt-1 font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
