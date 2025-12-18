import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  id: string;
  rank: number;
  previousRank?: number;
  name: string;
  avatar?: string;
  points: number;
  change?: number;
}

interface AnimatedLeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  className?: string;
  showTop?: number;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-slate-400" />;
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />;
    default:
      return null;
  }
};

const getRankChange = (current: number, previous?: number) => {
  if (!previous) return { direction: "same" as const, amount: 0 };
  if (current < previous) return { direction: "up" as const, amount: previous - current };
  if (current > previous) return { direction: "down" as const, amount: current - previous };
  return { direction: "same" as const, amount: 0 };
};

export const AnimatedLeaderboard = ({
  entries,
  currentUserId,
  className,
  showTop = 10,
}: AnimatedLeaderboardProps) => {
  const displayEntries = entries.slice(0, showTop);

  return (
    <div className={cn("space-y-2", className)}>
      <AnimatePresence mode="popLayout">
        {displayEntries.map((entry, index) => {
          const change = getRankChange(entry.rank, entry.previousRank);
          const isCurrentUser = entry.id === currentUserId;

          return (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                delay: index * 0.05,
              }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl transition-colors",
                isCurrentUser
                  ? "bg-primary/10 border-2 border-primary/30"
                  : "bg-secondary/30 hover:bg-secondary/50",
                entry.rank <= 3 && "border border-border/50"
              )}
            >
              {/* Rank */}
              <div className="w-10 flex justify-center">
                {getRankIcon(entry.rank) || (
                  <span className="text-lg font-display font-bold text-muted-foreground">
                    {entry.rank}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className="relative">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold",
                    entry.rank === 1
                      ? "from-yellow-400 to-amber-500"
                      : entry.rank === 2
                      ? "from-slate-300 to-slate-500"
                      : entry.rank === 3
                      ? "from-amber-500 to-amber-700"
                      : "from-primary to-accent"
                  )}
                >
                  {entry.avatar ? (
                    <img
                      src={entry.avatar}
                      alt={entry.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    entry.name.charAt(0).toUpperCase()
                  )}
                </div>
                {entry.rank <= 3 && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-card flex items-center justify-center shadow-lg"
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    {getRankIcon(entry.rank)}
                  </motion.div>
                )}
              </div>

              {/* Name and Change */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {entry.name}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-primary">(You)</span>
                  )}
                </p>
                <div className="flex items-center gap-1 text-sm">
                  {change.direction === "up" && (
                    <motion.span
                      className="flex items-center text-green-500"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                      {change.amount}
                    </motion.span>
                  )}
                  {change.direction === "down" && (
                    <motion.span
                      className="flex items-center text-red-500"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                      {change.amount}
                    </motion.span>
                  )}
                  {change.direction === "same" && (
                    <span className="flex items-center text-muted-foreground">
                      <Minus className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>

              {/* Points */}
              <motion.div
                className="text-right"
                key={entry.points}
                initial={{ scale: 1.2, color: "hsl(var(--primary))" }}
                animate={{ scale: 1, color: "hsl(var(--foreground))" }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-xl font-display font-bold">
                  {entry.points.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground ml-1">pts</span>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedLeaderboard;
