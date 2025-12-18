import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string | number;
  height?: string | number;
}

export const SkeletonLoader = ({
  className,
  variant = "rectangular",
  width,
  height,
}: SkeletonLoaderProps) => {
  const baseClasses = "bg-muted/50 overflow-hidden relative";
  
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
    card: "rounded-2xl",
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{ width, height }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
};

export const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("glass rounded-2xl p-6 border border-border/50 space-y-4", className)}>
    <div className="flex items-center gap-4">
      <SkeletonLoader variant="circular" className="w-12 h-12" />
      <div className="space-y-2 flex-1">
        <SkeletonLoader variant="text" className="w-20" />
        <SkeletonLoader variant="text" className="w-32" />
      </div>
    </div>
  </div>
);

export const ListSkeleton = ({ items = 3 }: { items?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
        <SkeletonLoader variant="circular" className="w-10 h-10" />
        <div className="space-y-2 flex-1">
          <SkeletonLoader variant="text" className="w-32" />
          <SkeletonLoader variant="text" className="w-24 h-3" />
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonLoader;
