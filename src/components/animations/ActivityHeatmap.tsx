import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ActivityHeatmapProps {
  data: { date: string; count: number }[];
  weeks?: number;
  className?: string;
}

export const ActivityHeatmap = ({
  data,
  weeks = 12,
  className,
}: ActivityHeatmapProps) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - weeks * 7 + 1);

    const dataMap = new Map(data.map((d) => [d.date, d.count]));
    const cells: { date: Date; count: number; dayIndex: number; weekIndex: number }[] = [];

    for (let i = 0; i < weeks * 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const count = dataMap.get(dateStr) || 0;
      const dayIndex = date.getDay();
      const weekIndex = Math.floor(i / 7);
      cells.push({ date, count, dayIndex, weekIndex });
    }

    return cells;
  }, [data, weeks]);

  const maxCount = Math.max(...heatmapData.map((d) => d.count), 1);

  const getIntensity = (count: number) => {
    if (count === 0) return "bg-muted/30";
    const ratio = count / maxCount;
    if (ratio < 0.25) return "bg-accent/30";
    if (ratio < 0.5) return "bg-accent/50";
    if (ratio < 0.75) return "bg-accent/70";
    return "bg-accent";
  };

  // Group cells by week
  const weekGroups = useMemo(() => {
    const groups: typeof heatmapData[] = [];
    for (let i = 0; i < weeks; i++) {
      groups.push(heatmapData.filter((d) => d.weekIndex === i));
    }
    return groups;
  }, [heatmapData, weeks]);

  return (
    <div className={cn("", className)}>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 text-[10px] text-muted-foreground pr-1">
          {days.map((day, i) => (
            <div key={day} className="h-3 flex items-center">
              {i % 2 === 1 && day.slice(0, 1)}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-1">
          {weekGroups.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {days.map((_, dayIndex) => {
                const cell = week.find((c) => c.dayIndex === dayIndex);
                if (!cell) return <div key={dayIndex} className="w-3 h-3" />;
                
                return (
                  <motion.div
                    key={dayIndex}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: weekIndex * 0.02 + dayIndex * 0.01,
                      duration: 0.3,
                    }}
                    className={cn(
                      "w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary/50",
                      getIntensity(cell.count)
                    )}
                    title={`${cell.date.toLocaleDateString()}: ${cell.count} workouts`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-muted/30" />
          <div className="w-3 h-3 rounded-sm bg-accent/30" />
          <div className="w-3 h-3 rounded-sm bg-accent/50" />
          <div className="w-3 h-3 rounded-sm bg-accent/70" />
          <div className="w-3 h-3 rounded-sm bg-accent" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
