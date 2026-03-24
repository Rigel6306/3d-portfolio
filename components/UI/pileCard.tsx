import { motion, transform, useScroll, useTransform } from "framer-motion";
import type { ReactNode } from "react";


interface PileCardProps {
  children: ReactNode;
  color: string;
  index: number;
  total: number;
  sectionRef: React.RefObject<HTMLDivElement>; // ← we pass this from parent
}

export default function PileCard({
  children,
  color,
  index,
  total,
  sectionRef,
}: PileCardProps) {
  const { scrollYProgress } = useScroll({
    target: sectionRef,                    // track progress of the whole tall section
      // from section top hits viewport top → section bottom hits viewport top
  });

  // Each card animates across its own portion of the section's progress
  // index 0 = first (top) card → animates earliest
  const slice = 1 / total;

  const start = index * slice;

  const end = start + slice;
 // slightly extended → smoother reveal of next card



  const y = useTransform(scrollYProgress, [start, end], [0, -1020]); // lift upward/out

  const rotateX = useTransform(scrollYProgress, [start, end], [0, 68]); // tilt forward

  const scale = useTransform(scrollYProgress, [start, end], [1, 0.1]); // shrink a bit
  const scaleTop = useTransform(scrollYProgress,[start,end],[20,3001])


  const x = useTransform(scrollYProgress, [start, end], [0, 50]); // optional side peel
const cardOffset = 5
const cardScaleStep = 0.075
  return (
    <motion.div
      className={ `absolute left-1/2 m-0 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-3xl shadow-1xl overflow-hidden will-change-transform`}
      style={{
        backgroundColor: color,
        width: "min(95vw, 1020px)",
        height: "min(72vh, 540px)",
        zIndex: total - index, // highest z-index = top card
        transformOrigin: "center bottom",
        perspective: "1400px", // enhances 3D tilt
       
        
        y,
        x,
        rotateX,
        scale,
      }}
    >
      {children}
    </motion.div>
  );
}