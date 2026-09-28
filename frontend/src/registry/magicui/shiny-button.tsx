import React from "react";
import { motion, type MotionProps } from "motion/react";
import { cn } from "@/lib/utils";

const animationProps: MotionProps = {
  initial: { "--x": "100%", scale: 0.98 },
  animate: { "--x": "-100%", scale: 1 },
  whileTap: { scale: 0.96 },
  transition: {
    repeat: Infinity,
    repeatType: "loop",
    repeatDelay: 1.2,
    type: "spring",
    stiffness: 25,
    damping: 15,
    mass: 2,
    scale: {
      type: "spring",
      stiffness: 300,
      damping: 10,
      mass: 0.5,
    },
  },
};

export interface ShinyButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof MotionProps>,
    MotionProps {
  children: React.ReactNode;
  className?: string;
}

export const ShinyButton = React.forwardRef<
  HTMLButtonElement,
  ShinyButtonProps
>(({ children, className, ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-xl border border-sky-400/50 bg-gradient-to-r from-sky-600 to-ocean-600 hover:from-sky-500 hover:to-ocean-500 px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-sky-600/20 backdrop-blur-xl transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-sky-500/30 select-none flex items-center justify-center gap-1.5",
        className
      )}
      {...animationProps}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-1.5 font-bold tracking-wide text-white text-xs select-none">
        {children}
      </span>
      {/* Reflective sweep shimmer sheen */}
      <motion.span
        style={{
          backgroundImage:
            "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.45) 50%, transparent 80%)",
        }}
        className="absolute inset-0 z-20 pointer-events-none block rounded-[inherit] opacity-75"
        animate={{
          x: ["-100%", "200%"],
        }}
        transition={{
          repeat: Infinity,
          repeatType: "loop",
          duration: 2.2,
          ease: "easeInOut",
          repeatDelay: 1,
        }}
      />
    </motion.button>
  );
});

ShinyButton.displayName = "ShinyButton";
