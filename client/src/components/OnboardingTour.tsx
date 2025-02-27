import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FitMascot } from "./FitMascot";
import { Button } from "@/components/ui/button";

const tourSteps = [
  {
    id: 'welcome',
    title: "Welcome to FitFund! 💪",
    description: "Ready to start your fitness journey? Let me show you around!",
    position: { bottom: 4, right: 4 }
  },
  {
    id: 'challenges',
    title: "Fitness Challenges",
    description: "Here you can browse and join exciting fitness challenges!",
    position: { top: '50%', left: '50%' }
  },
  {
    id: 'create',
    title: "Create Challenges",
    description: "Ready to lead? Create your own challenge and inspire others!",
    position: { top: 20, right: 20 }
  },
  {
    id: 'fitbit',
    title: "Connect Your Device",
    description: "Link your fitness tracker to automatically log your progress!",
    position: { top: 20, right: 120 }
  }
];

export function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      setIsVisible(false);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed z-50"
        style={{
          ...step.position,
          transform: step.id === 'welcome' ? 'none' : 'translate(-50%, -50%)'
        }}
      >
        <div className="bg-white rounded-lg shadow-lg p-6 w-[300px] relative">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2">
            <FitMascot />
          </div>
          <div className="pt-8 text-center">
            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
            <p className="text-muted-foreground mb-4">
              {step.description}
            </p>
            <div className="flex justify-between">
              {currentStep === 0 ? (
                <>
                  <Button variant="outline" onClick={() => setIsVisible(false)}>
                    Maybe Later
                  </Button>
                  <Button onClick={handleNext}>
                    Let's Go!
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsVisible(false)}>
                    Skip Tour
                  </Button>
                  <Button onClick={handleNext}>
                    {isLastStep ? "Finish" : "Next"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}