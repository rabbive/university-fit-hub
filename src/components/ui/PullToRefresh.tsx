import { useState, useRef, ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export const PullToRefresh = ({ onRefresh, children, className }: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const pullProgress = useTransform(y, [0, 80], [0, 1]);
  const rotation = useTransform(y, [0, 80], [0, 180]);

  const handleDragEnd = async () => {
    if (y.get() >= 80 && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    animate(y, 0, { type: "spring", stiffness: 400, damping: 30 });
  };

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {/* Pull indicator */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center"
        style={{ 
          top: useTransform(y, [0, 80], [-40, 10]),
          opacity: pullProgress 
        }}
      >
        <motion.div
          className={cn(
            "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center",
            isRefreshing && "bg-primary/20"
          )}
          style={{ rotate: isRefreshing ? undefined : rotation }}
          animate={isRefreshing ? { rotate: 360 } : {}}
          transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
        >
          <RefreshCw className={cn(
            "w-5 h-5 text-primary",
            isRefreshing && "animate-spin"
          )} />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.5, bottom: 0 }}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="touch-pan-x"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
