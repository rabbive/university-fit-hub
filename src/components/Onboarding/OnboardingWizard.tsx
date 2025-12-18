import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Dumbbell, 
  Target, 
  Sparkles, 
  Trophy,
  ChevronRight,
  ChevronLeft,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  {
    id: "welcome",
    icon: Dumbbell,
    title: "Welcome to FitClub Pro!",
    description: "Your ultimate fitness companion. Track workouts, earn points, and compete with friends.",
    color: "primary",
  },
  {
    id: "goals",
    icon: Target,
    title: "Set Your Goals",
    description: "Track every rep, set, and PR. Log workouts to earn points and climb the leaderboard.",
    color: "accent",
  },
  {
    id: "ai",
    icon: Sparkles,
    title: "AI-Powered Plans",
    description: "Get personalized workout plans tailored to your fitness level and goals.",
    color: "warning",
  },
  {
    id: "compete",
    icon: Trophy,
    title: "Compete & Achieve",
    description: "Join challenges, earn badges, and see how you rank against other members!",
    color: "energy",
  },
];

export const OnboardingWizard = ({ onComplete, onSkip }: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onSkip}
        className="absolute top-4 right-4 text-muted-foreground"
      >
        <X className="w-4 h-4 mr-1" />
        Skip
      </Button>

      <div className="w-full max-w-md">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentStep 
                  ? "w-8 bg-primary" 
                  : index < currentStep 
                    ? "w-2 bg-primary/50" 
                    : "w-2 bg-muted"
              )}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className={cn(
                "w-24 h-24 rounded-3xl mx-auto mb-8 flex items-center justify-center",
                step.color === "primary" && "bg-primary/10",
                step.color === "accent" && "bg-accent/10",
                step.color === "warning" && "bg-warning/10",
                step.color === "energy" && "bg-energy/10"
              )}
            >
              <Icon className={cn(
                "w-12 h-12",
                step.color === "primary" && "text-primary",
                step.color === "accent" && "text-accent",
                step.color === "warning" && "text-warning",
                step.color === "energy" && "text-energy"
              )} />
            </motion.div>

            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              {step.title}
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {step.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={cn(currentStep === 0 && "invisible")}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <Button onClick={handleNext} className="min-w-[120px]">
            {currentStep === steps.length - 1 ? "Get Started" : "Next"}
            {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default OnboardingWizard;
