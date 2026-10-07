import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { div } from "motion/react-client";
import type { ReactNode } from "react";


interface PileCardProps {
  children: ReactNode;
  color: string;
  index: number;
  total: number;
  sectionRef: React.RefObject<HTMLDivElement | null>; // ← we pass this from parent
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

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 300,
    damping: 80,
    mass: 1,
  });


const y = useTransform(smoothProgress, [start, start + slice * 0.08, end], [0, 0, -1020]);

  const rotateX = useTransform(smoothProgress, [start, end], [0, 18]); // tilt forward

  const scale = useTransform(smoothProgress, [start, end], [1, 0.1]); // shrink a bit
  const scaleTop = useTransform(smoothProgress,[start,end],[0,3001])


  const x = useTransform(smoothProgress, [start, end], [0, 50]); // optional side peel
const cardOffset = 5
const cardScaleStep = 0.075
  return (

    

    
    <motion.div
      className={ `absolute left-1/2 m-0 top-1/2 -translate-x-1/2 -translate-y-1/2  shadow-1xl  overflow-hidden will-change-transform [clip-path:polygon(0_0,calc(100%-30px)_0,100%_30px,100%_100%,30px_100%,0_calc(100%-30px))]
         bg-gradient-to-br from-[${color}] to-[#465cc9f0]
        `}
      style={{
        backgroundColor: color,
        width: "min(95vw, 1020px)",
        height: "min(72vh, 540px)",
        zIndex: total - index, // highest z-index = top card
        transformOrigin: "center bottom",
       
       
        
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