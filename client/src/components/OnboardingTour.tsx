import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FitMascot } from "./FitMascot";
import { Button } from "@/components/ui/button";

export function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <div className="bg-white rounded-lg shadow-lg p-6 w-[300px] relative">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2">
            <FitMascot />
          </div>
          <div className="pt-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Welcome to FitFund! 💪</h3>
            <p className="text-muted-foreground mb-4">
              Ready to start your fitness journey? Let me show you around!
            </p>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setIsVisible(false)}>
                Maybe Later
              </Button>
              <Button onClick={() => setIsVisible(false)}>
                Let's Go!
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}