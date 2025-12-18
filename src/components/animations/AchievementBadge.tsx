import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface AchievementBadgeProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  earned?: boolean;
  tier?: "bronze" | "silver" | "gold" | "platinum";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  showAnimation?: boolean;
}

const tierColors = {
  bronze: {
    bg: "from-amber-700 to-amber-900",
    ring: "ring-amber-600/50",
    glow: "shadow-amber-500/30",
  },
  silver: {
    bg: "from-slate-300 to-slate-500",
    ring: "ring-slate-400/50",
    glow: "shadow-slate-400/30",
  },
  gold: {
    bg: "from-yellow-400 to-amber-500",
    ring: "ring-yellow-400/50",
    glow: "shadow-yellow-500/40",
  },
  platinum: {
    bg: "from-cyan-300 via-violet-400 to-fuchsia-400",
    ring: "ring-violet-400/50",
    glow: "shadow-violet-500/40",
  },
};

const sizes = {
  sm: { container: "w-16 h-16", icon: "w-6 h-6", text: "text-xs" },
  md: { container: "w-20 h-20", icon: "w-8 h-8", text: "text-sm" },
  lg: { container: "w-24 h-24", icon: "w-10 h-10", text: "text-base" },
};

export const AchievementBadge = ({
  icon: Icon,
  title,
  description,
  earned = false,
  tier = "bronze",
  size = "md",
  onClick,
  showAnimation = true,
}: AchievementBadgeProps) => {
  const colors = tierColors[tier];
  const sizeClasses = sizes[size];

  return (
    <motion.div
      className="flex flex-col items-center gap-2 cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <motion.div
        className={cn(
          "relative rounded-full flex items-center justify-center",
          sizeClasses.container,
          earned
            ? `bg-gradient-to-br ${colors.bg} ring-4 ${colors.ring} shadow-lg ${colors.glow}`
            : "bg-muted/50 ring-2 ring-border/50"
        )}
        initial={showAnimation ? { scale: 0, rotate: -180 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
        }}
      >
        {earned && (
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
        <Icon
          className={cn(
            sizeClasses.icon,
            earned ? "text-white" : "text-muted-foreground"
          )}
        />
      </motion.div>
      <div className="text-center">
        <p
          className={cn(
            "font-medium",
            sizeClasses.text,
            earned ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {title}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </motion.div>
  );
};

export default AchievementBadge;
