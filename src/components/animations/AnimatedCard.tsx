import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hoverScale?: number;
  onClick?: () => void;
}

export const AnimatedCard = ({
  children,
  className,
  delay = 0,
  hoverScale = 1.02,
  onClick,
}: AnimatedCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: "easeOut",
      }}
      whileHover={{
        scale: hoverScale,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
      className={cn("cursor-pointer", className)}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
