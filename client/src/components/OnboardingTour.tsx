import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FitMascot } from "./FitMascot";
import { Button } from "@/components/ui/button";

const tourSteps = [
  {
    id: 'welcome',
    title: "Welcome to FitFund! 💪",
    description: "Ready to start your fitness journey? Let me show you around!",
    position: { bottom: '1rem', right: '1rem', left: 'auto', top: 'auto' }
  },
  {
    id: 'challenges',
    title: "Fitness Challenges",
    description: "Here you can browse and join exciting fitness challenges!",
    position: { top: '50%', left: '50%', bottom: 'auto', right: 'auto' }
  },
  {
    id: 'create',
    title: "Create Challenges",
    description: "Ready to lead? Create your own challenge and inspire others!",
    position: { top: '5rem', right: '1rem', bottom: 'auto', left: 'auto' }
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
        className="fixed z-50 p-4 sm:p-0"
        style={{
          ...step.position,
          transform: step.id === 'welcome' ? 'none' : 'translate(-50%, -50%)',
          maxWidth: '90vw',
          width: '300px'
        }}
      >
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 relative">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2">
            <FitMascot />
          </div>
          <div className="pt-8 text-center">
            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              {step.description}
            </p>
            <div className="flex justify-between gap-2">
              {currentStep === 0 ? (
                <>
                  <Button variant="outline" onClick={() => setIsVisible(false)} className="text-sm sm:text-base">
                    Maybe Later
                  </Button>
                  <Button onClick={handleNext} className="text-sm sm:text-base">
                    Let's Go!
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsVisible(false)} className="text-sm sm:text-base">
                    Skip Tour
                  </Button>
                  <Button onClick={handleNext} className="text-sm sm:text-base">
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