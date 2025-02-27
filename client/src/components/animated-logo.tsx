import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedLogoProps {
  className?: string;
}

export function AnimatedLogo({ className }: AnimatedLogoProps) {
  const [currentLogo, setCurrentLogo] = useState<'green' | 'black' | 'gold'>('green');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const logoVariants = {
    loading: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    loaded: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setLoadError(false);
  };

  const handleImageError = () => {
    setLoadError(true);
    setIsLoading(false);
    
    // Attempt to load the next logo variant
    if (currentLogo === 'green') {
      setCurrentLogo('black');
    } else if (currentLogo === 'black') {
      setCurrentLogo('gold');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentLogo}
          initial={{ opacity: 0 }}
          animate={isLoading ? "loading" : "loaded"}
          exit="exit"
          variants={logoVariants}
          className="relative"
        >
          <img
            src={`/IM_Initials_${currentLogo}.png`}
            alt={`Ilana Muhlstein Logo (${currentLogo})`}
            className="h-16 w-auto"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {isLoading && (
            <motion.div
              className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-lg"
              animate={{
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
