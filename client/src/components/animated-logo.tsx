import { useState } from "react";
import { motion } from "framer-motion";

export function AnimatedLogo() {
  const [currentVariant, setCurrentVariant] = useState<'green' | 'black' | 'gold'>('green');
  const [isLoading, setIsLoading] = useState(true);

  // Simple loading animation
  const variants = {
    loading: {
      opacity: [0.5, 1, 0.5],
      transition: { duration: 1.5, repeat: Infinity }
    }
  };

  const getLogoPath = (variant: string) => {
    switch (variant) {
      case 'green':
        return '/attached_assets/IM_Initials_Green.png';
      case 'black':
        return '/attached_assets/IM_Initials_Black (1).png';
      case 'gold':
        return '/attached_assets/IM_Initials_Gold.png';
      default:
        return '/attached_assets/IM_Logo_Full-Color (2).png';
    }
  };

  const handleImageError = () => {
    console.error(`Failed to load ${currentVariant} variant at path: ${getLogoPath(currentVariant)}`);
    // Try next variant
    if (currentVariant === 'green') {
      setCurrentVariant('black');
    } else if (currentVariant === 'black') {
      setCurrentVariant('gold');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={isLoading ? "loading" : { opacity: 1 }}
      variants={variants}
      className="p-2 rounded-lg"
    >
      <img
        src={getLogoPath(currentVariant)}
        alt="Logo"
        className="h-16 w-auto"
        onLoad={() => {
          console.log(`Successfully loaded ${currentVariant} variant at path: ${getLogoPath(currentVariant)}`);
          setIsLoading(false);
        }}
        onError={handleImageError}
      />
    </motion.div>
  );
}