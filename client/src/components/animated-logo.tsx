import { motion } from "framer-motion";

export function AnimatedLogo() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-2 rounded-lg"
    >
      <img
        src="/attached_assets/IM_Logo_Full-Color (2).png"
        alt="FitFund Logo"
        className="h-16 w-auto"
      />
    </motion.div>
  );
}