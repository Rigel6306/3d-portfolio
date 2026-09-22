import { motion } from "motion/react";
import type { RefObject } from "react";

type CardProps = {
  text?: string;
  className?: string;
  constraintRef: RefObject<HTMLDivElement | null>;
  delay?: number;
  y?: [number, number, number];
  img?: string;
  children?: React.ReactNode;
  /**
   * Whether the surrounding section is actually on screen. When false, the
   * idle float/wobble loop and drag are switched off instead of quietly
   * running forever off-screen. Running 14 infinite Framer Motion loops
   * (each with its own drag gesture listeners) before the user has even
   * scrolled there is wasted main-thread work every single frame, and is
   * what causes scroll to stutter right as the section comes into view.
   */
  active?: boolean;
};

const Card = ({
  text,
  className = "",
  constraintRef,
  delay = 0,
  y = [0, -4, 0],
  children,
  active = true,
}: CardProps) => {
  return (
    <motion.div
      drag={active}
      dragConstraints={constraintRef}
      dragElastic={0.12}
      dragTransition={{ bounceStiffness: 320, bounceDamping: 22 }}
      whileDrag={{ scale: 1.08, zIndex: 20, boxShadow: "0 10px 24px rgba(0,0,0,0.35)" }}
      whileHover={active ? { scale: 1.05 } : undefined}
      animate={active ? { y, rotate: [-1.5, 1.5, -1.5] } : { y: 0, rotate: 0 }}
      transition={
        active
          ? { repeat: Infinity, duration: 4, ease: "easeInOut", delay }
          : { duration: 0.25 }
      }
      role="img"
      aria-label={text}
      title={text}
      className={`toolkit-icon cursor-grab active:cursor-grabbing select-none grid place-items-center rounded-xl bg-white/95 p-2 border border-black/5 shadow-sm ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Card;