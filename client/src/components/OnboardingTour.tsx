import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FitMascot } from "./FitMascot";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    target: "[data-tour='challenges']",
    title: "Welcome to FitFund! 💪",
    description: "Here you can see all the active fitness challenges. Join one to start your fitness journey!",
    position: "bottom",
  },
  {
    target: "[data-tour='create-challenge']",
    title: "Create Your Own Challenge 🎯",
    description: "Want to start your own challenge? Click here to set up your own fitness goals!",
    position: "left",
  },
  {
    target: "[data-tour='fitbit-connect']",
    title: "Connect Your Fitbit 📱",
    description: "Link your Fitbit to automatically track your progress!",
    position: "right",
  },
];

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const updatePosition = () => {
      const element = document.querySelector(tourSteps[currentStep].target);
      if (element) {
        setTargetElement(element.getBoundingClientRect());
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [currentStep]);

  if (!targetElement || !isVisible) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  const getTooltipPosition = () => {
    if (!targetElement) return {};
    
    switch (step.position) {
      case "top":
        return {
          top: targetElement.top - 10,
          left: targetElement.left + targetElement.width / 2,
          transform: "translate(-50%, -100%)",
        };
      case "bottom":
        return {
          top: targetElement.bottom + 10,
          left: targetElement.left + targetElement.width / 2,
          transform: "translate(-50%, 0)",
        };
      case "left":
        return {
          top: targetElement.top + targetElement.height / 2,
          left: targetElement.left - 10,
          transform: "translate(-100%, -50%)",
        };
      case "right":
        return {
          top: targetElement.top + targetElement.height / 2,
          left: targetElement.right + 10,
          transform: "translate(0, -50%)",
        };
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        style={{
          position: "fixed",
          zIndex: 50,
          ...getTooltipPosition(),
        }}
      >
        <Card className="w-[300px]">
          <CardHeader className="relative pb-0">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
              <FitMascot />
            </div>
            <CardTitle className="pt-12 text-center">{step.title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-muted-foreground text-center">{step.description}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="ghost"
              onClick={() => setIsVisible(false)}
            >
              Skip Tour
            </Button>
            <Button
              onClick={() => {
                if (isLastStep) {
                  setIsVisible(false);
                } else {
                  setCurrentStep(c => c + 1);
                }
              }}
            >
              {isLastStep ? "Finish" : "Next"}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
