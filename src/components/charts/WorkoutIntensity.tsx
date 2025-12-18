import { motion } from "framer-motion";
import { Flame, Zap, Battery, BatteryLow, BatteryMedium, BatteryFull } from "lucide-react";
import { cn } from "@/lib/utils";

type IntensityLevel = "low" | "moderate" | "high" | "extreme";

interface WorkoutIntensityProps {
  level: IntensityLevel;
  value?: number; // 0-100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const intensityConfig = {
  low: {
    color: "text-green-500",
    bgColor: "bg-green-500",
    label: "Light",
    icon: BatteryLow,
    gradient: "from-green-400 to-green-600",
  },
  moderate: {
    color: "text-yellow-500",
    bgColor: "bg-yellow-500",
    label: "Moderate",
    icon: BatteryMedium,
    gradient: "from-yellow-400 to-amber-500",
  },
  high: {
    color: "text-orange-500",
    bgColor: "bg-orange-500",
    label: "High",
    icon: BatteryFull,
    gradient: "from-orange-400 to-orange-600",
  },
  extreme: {
    color: "text-red-500",
    bgColor: "bg-red-500",
    label: "Extreme",
    icon: Flame,
    gradient: "from-red-500 to-red-700",
  },
};

const sizeConfig = {
  sm: { bar: "h-2", icon: "w-4 h-4", text: "text-xs" },
  md: { bar: "h-3", icon: "w-5 h-5", text: "text-sm" },
  lg: { bar: "h-4", icon: "w-6 h-6", text: "text-base" },
};

export const WorkoutIntensity = ({
  level,
  value,
  showLabel = true,
  size = "md",
  className,
}: WorkoutIntensityProps) => {
  const config = intensityConfig[level];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <motion.div
        animate={{
          scale: level === "extreme" ? [1, 1.1, 1] : 1,
        }}
        transition={{
          duration: 0.5,
          repeat: level === "extreme" ? Infinity : 0,
        }}
      >
        <Icon className={cn(sizes.icon, config.color)} />
      </motion.div>

      <div className="flex-1">
        {showLabel && (
          <div className="flex items-center justify-between mb-1">
            <span className={cn("font-medium", sizes.text, config.color)}>
              {config.label}
            </span>
            {value !== undefined && (
              <span className="text-muted-foreground text-xs">{value}%</span>
            )}
          </div>
        )}
        <div className={cn("w-full rounded-full bg-muted/50 overflow-hidden", sizes.bar)}>
          <motion.div
            className={cn("h-full rounded-full bg-gradient-to-r", config.gradient)}
            initial={{ width: 0 }}
            animate={{ width: value !== undefined ? `${value}%` : "100%" }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
};

interface IntensityBarsProps {
  level: 1 | 2 | 3 | 4 | 5;
  className?: string;
  animated?: boolean;
}

export const IntensityBars = ({
  level,
  className,
  animated = true,
}: IntensityBarsProps) => {
  const colors = [
    "bg-green-500",
    "bg-yellow-500",
    "bg-orange-500",
    "bg-red-500",
    "bg-red-600",
  ];

  return (
    <div className={cn("flex items-end gap-1", className)}>
      {[1, 2, 3, 4, 5].map((bar) => (
        <motion.div
          key={bar}
          className={cn(
            "w-1.5 rounded-full",
            bar <= level ? colors[bar - 1] : "bg-muted/50"
          )}
          style={{ height: `${bar * 4 + 4}px` }}
          initial={animated ? { scaleY: 0 } : false}
          animate={{ scaleY: 1 }}
          transition={{
            delay: bar * 0.1,
            duration: 0.3,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

interface HeartRateIndicatorProps {
  bpm?: number;
  zone?: "rest" | "warmup" | "fat-burn" | "cardio" | "peak";
  className?: string;
}

const zoneConfig = {
  rest: { color: "text-slate-400", range: "< 100 BPM", label: "Rest" },
  warmup: { color: "text-blue-400", range: "100-120 BPM", label: "Warm Up" },
  "fat-burn": { color: "text-green-500", range: "120-140 BPM", label: "Fat Burn" },
  cardio: { color: "text-orange-500", range: "140-160 BPM", label: "Cardio" },
  peak: { color: "text-red-500", range: "160+ BPM", label: "Peak" },
};

export const HeartRateIndicator = ({
  bpm = 0,
  zone = "rest",
  className,
}: HeartRateIndicatorProps) => {
  const config = zoneConfig[zone];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: zone === "peak" ? 0.4 : zone === "cardio" ? 0.6 : 0.8,
          repeat: Infinity,
        }}
      >
        <Zap className={cn("w-5 h-5", config.color)} />
      </motion.div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className={cn("text-xl font-bold", config.color)}>{bpm}</span>
          <span className="text-xs text-muted-foreground">BPM</span>
        </div>
        <p className="text-xs text-muted-foreground">{config.label}</p>
      </div>
    </div>
  );
};

export default WorkoutIntensity;
