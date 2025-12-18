import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Zap, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface LevelUpAnimationProps {
  isVisible: boolean;
  level: number;
  onComplete?: () => void;
}

export const LevelUpAnimation = ({
  isVisible,
  level,
  onComplete,
}: LevelUpAnimationProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => {
            setTimeout(() => onComplete?.(), 2000);
          }}
        >
          <motion.div
            className="relative flex flex-col items-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
          >
            {/* Glow effect */}
            <motion.div
              className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-primary via-accent to-warning opacity-30 blur-3xl"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />

            {/* Stars */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  x: Math.cos((i * Math.PI) / 3) * 100,
                  y: Math.sin((i * Math.PI) / 3) * 100,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.3 + i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }}
              >
                <Star className="w-6 h-6 text-warning fill-warning" />
              </motion.div>
            ))}

            {/* Main badge */}
            <motion.div
              className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary via-accent to-warning p-1 shadow-2xl"
              animate={{
                rotate: [0, 5, -5, 0],
                boxShadow: [
                  "0 0 30px rgba(59,130,246,0.5)",
                  "0 0 60px rgba(52,211,153,0.5)",
                  "0 0 30px rgba(251,191,36,0.5)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                <Trophy className="w-12 h-12 text-warning" />
              </div>
            </motion.div>

            {/* Level text */}
            <motion.div
              className="mt-6 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm text-muted-foreground uppercase tracking-widest mb-1">
                Level Up!
              </p>
              <h2 className="text-4xl font-display font-bold gradient-text">
                Level {level}
              </h2>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface StreakFlameProps {
  streak: number;
  size?: "sm" | "md" | "lg";
}

const flameColors = {
  1: "text-orange-400",
  2: "text-orange-500",
  3: "text-red-500",
  4: "text-red-600",
  5: "text-purple-500",
};

export const StreakFlame = ({ streak, size = "md" }: StreakFlameProps) => {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const getFlameColor = (streak: number) => {
    if (streak >= 30) return "text-purple-500";
    if (streak >= 14) return "text-red-600";
    if (streak >= 7) return "text-red-500";
    if (streak >= 3) return "text-orange-500";
    return "text-orange-400";
  };

  return (
    <motion.div
      className="relative inline-flex items-center justify-center"
      animate={{
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 0.5,
        repeat: Infinity,
        repeatType: "reverse",
      }}
    >
      <Flame className={cn(sizeClasses[size], getFlameColor(streak))} />
      {streak >= 7 && (
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
          }}
        >
          <Flame className={cn(sizeClasses[size], getFlameColor(streak), "blur-sm")} />
        </motion.div>
      )}
    </motion.div>
  );
};

export default LevelUpAnimation;
