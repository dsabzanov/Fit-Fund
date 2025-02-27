import { motion } from "framer-motion";

export function FitMascot() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", bounce: 0.5 }}
      className="relative w-24 h-24"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Cute dumbell mascot body */}
        <motion.g
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -10, 0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Main body - center circle */}
          <circle cx="50" cy="50" r="20" fill="#4CAF50" />
          
          {/* Eyes */}
          <circle cx="43" cy="45" r="4" fill="white" />
          <circle cx="57" cy="45" r="4" fill="white" />
          <circle cx="43" cy="45" r="2" fill="black" />
          <circle cx="57" cy="45" r="2" fill="black" />
          
          {/* Smile */}
          <path
            d="M 40 55 Q 50 65 60 55"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Dumbell weights */}
          <circle cx="15" cy="50" r="12" fill="#2E7D32" />
          <circle cx="85" cy="50" r="12" fill="#2E7D32" />
          
          {/* Connecting bar */}
          <rect x="27" y="45" width="46" height="10" fill="#2E7D32" />
        </motion.g>
      </svg>
    </motion.div>
  );
}
