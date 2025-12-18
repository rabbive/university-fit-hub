import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  getDay,
} from "date-fns";

interface AttendanceData {
  date: string; // YYYY-MM-DD
  attended: boolean;
  className?: string;
}

interface AttendanceCalendarProps {
  data: AttendanceData[];
  month?: Date;
  className?: string;
  onDayClick?: (date: Date, attended: boolean) => void;
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const AttendanceCalendar = ({
  data,
  month = new Date(),
  className,
  onDayClick,
}: AttendanceCalendarProps) => {
  const calendarDays = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });

    // Add padding for days before the month starts
    const startDayOfWeek = getDay(start);
    const paddingDays = Array(startDayOfWeek).fill(null);

    return [...paddingDays, ...days];
  }, [month]);

  const attendanceMap = useMemo(() => {
    return new Map(data.map((d) => [d.date, d]));
  }, [data]);

  const getAttendanceForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return attendanceMap.get(dateStr);
  };

  return (
    <div className={cn("", className)}>
      {/* Month header */}
      <h3 className="font-display text-lg font-semibold text-foreground mb-4">
        {format(month, "MMMM yyyy")}
      </h3>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs text-muted-foreground font-medium py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`padding-${index}`} className="aspect-square" />;
          }

          const attendance = getAttendanceForDay(day);
          const isCurrentDay = isToday(day);

          return (
            <motion.button
              key={format(day, "yyyy-MM-dd")}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: index * 0.01,
                duration: 0.2,
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDayClick?.(day, !!attendance?.attended)}
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-colors relative",
                attendance?.attended
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50",
                isCurrentDay && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              <span>{format(day, "d")}</span>
              {attendance?.attended && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                />
              )}
              {attendance?.className && (
                <span className="text-[8px] truncate max-w-full px-1">
                  {attendance.className}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-accent" />
          <span>Attended</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-secondary/30" />
          <span>Not attended</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded ring-2 ring-primary" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
