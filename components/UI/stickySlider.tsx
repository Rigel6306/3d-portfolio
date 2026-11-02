"use client";

import { useMemo, useRef } from "react";
import About from "components/about";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import ProjectShowcase from "./projectSchowcase";
import "../../app/styles/parallax.css";
import TechStory from "./techStory";

const IMG_PADDING = 42;



export const TextParallaxContentContainer = () => {

  return useMemo(
    () => (
      <div className="bg-linear-to-b from-[#060606fe] via-[#141716c7] to-[#0000]">
        <style>{`
          @keyframes chapter-twinkle { 0%,100% { opacity: .3 } 50% { opacity: 1 } }
          .chapter-star { animation: chapter-twinkle 4s ease-in-out infinite }
          @media (prefers-reduced-motion: reduce) { .chapter-star { animation: none } }
        `}</style>

        <TextParallaxContent
          img={"/parallax1.jpg"}
          chapter={"Chapter one"}
       
          subHeading={"Get to know the developer behind the code."}
          heading={"The Story Begins!"}
        >
          <div className="aboutUsSection">
            <h1 className="parallaxPageHeading text-white">About Me</h1>
            <div className="aboutContainer h-[200vh]">
              <About />
            </div>
          </div>
        </TextParallaxContent>

        <TextParallaxContent
          img={"/bck1.jpg"}
          chapter={"CHAPTER TWO"}
          
          subHeading={"Transforming ambitious ideas into functional realities."}
          heading={"Digital Alchemy"}
        >
          {/* No fixed height here: ProjectShowcase sets its own scroll length. */}
          <div className="servicesSection">
            <ProjectShowcase />
          </div>
        </TextParallaxContent>

        <TextParallaxContent
          img={"/parallax3.jpg"}
          chapter={"The final chapter"}
         
          subHeading={"The magic behind every build."}
          heading={"Weapons of Choice"}
        >
          <div />
               <TechStory/>
        </TextParallaxContent>
        
      </div>
    ),
    []
  );
};

interface TextParalaxPropsType {
  img: string;
  subHeading: string;
  heading: string;
  chapter?: string;

  children?: React.ReactNode;
}

const TextParallaxContent = ({
  img,
  subHeading,
  heading,
  chapter,

  children,
}: TextParalaxPropsType) => {
  // Progress of this whole chapter passing through the screen. Shared by the
  // layers inside the frame so they drift at different speeds.
  const chapterRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: chapterProgress } = useScroll({
    target: chapterRef,
    offset: ["start end", "end start"],
  });

  return (
    <div className="mt-10 w-full max-w-full overflow-clip">
      <div ref={chapterRef} className="relative h-[150vh]  p-3">
        <StickyImage img={img} progress={chapterProgress} />
        <TextOverlay heading={heading} subHeading={subHeading} chapter={chapter} />
      </div>
      {children}
    </div>
  );
};

/* ─────────────────────────────── Sticky frame ─────────────────────────────── */

const StickyImage = ({
  img,

  progress,
}: {
  img: string;

  progress: MotionValue<number>;
}) => {
  const reduceMotion = useReducedMotion();
  const refTarget = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: refTarget,
    offset: ["end end", "end start"],
  });

  // scale and opacity used the exact same mapping, so compute it once
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0]);


  // Depth inside the frame: the photo drifts slower than the frame, the mist faster.
  const imgY = useTransform(progress, [0, 1], reduceMotion ? ["0%", "0%"] : ["-6%", "6%"]);


  return (
    <motion.div
      style={{
        height: `calc(97vh - ${IMG_PADDING * 2}px)`,
        top: 50,
        scale,
        willChange: "transform",
      }}
      ref={refTarget}
      className="sticky z-0 overflow-hidden rounded-3xl ring-1 ring-white/10 shadow-[0_30px_120px_-30px_rgba(0,0,0,0.9)]"
    >
      {/* Photo, over-scaled so it can drift without showing its edges */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${img})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          scale: 1.2,
          y: imgY,
          willChange: "transform",
        }}
      />

  
    </motion.div>
  );
};

/* ─────────────────────────────── Chapter text ─────────────────────────────── */

const TextOverlay = ({
  heading,
  subHeading,
  chapter,
}: {
  heading: string;
  subHeading: string;
  chapter?: string;
}) => {
  const refTarget = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: refTarget,
    offset: ["start end", "end start"],
  });

  // Original motion: the text rises through the frame and fades in and out.
  const y = useTransform(scrollYProgress, [0, 1], [250, -250]);
  const opacity = useTransform(scrollYProgress, [0.1, 0.5, 0.75], [0, 1, 0]);

  // Added: the lines travel at different speeds (depth), the text resolves out of
  // a blur like in the hero, and the heading's letters settle from wide to tight.
  const ySub = useTransform(scrollYProgress, [0, 1], [170, -170]);
  const yChapter = useTransform(scrollYProgress, [0, 1], [120, -120]);
  const blurPx = useTransform(scrollYProgress, [0.1, 0.4, 0.5, 0.75], [14, 0, 0, 12]);
  const filter = useTransform(blurPx, (v) => `blur(${v}px)`);
  const tracking = useTransform(scrollYProgress, [0.1, 0.5], ["0.14em", "-0.02em"]);

  return (
    <motion.div
      ref={refTarget}
      // promote to its own compositor layer so y/opacity don't trigger repaints
      style={{ opacity, filter, willChange: "transform, opacity, filter" }}
      className="absolute left-0 top-1/2 -translate-y-1/2 flex w-full flex-col items-center justify-center px-4"
    >
      {chapter && (
        <motion.div
          style={{ y: yChapter }}
          className="mb-5 flex items-center gap-4 text-sm text-white/60"
        >
          <span aria-hidden="true" className="h-px w-8 bg-white/30 sm:w-14" />
          {chapter}
          <span aria-hidden="true" className="h-px w-8 bg-white/30 sm:w-14" />
        </motion.div>
      )}

      <motion.p
        style={{ y: ySub }}
        className="overlaySubHead mb-2 text-center text-sm text-white/85 [text-shadow:0_2px_40px_rgba(0,0,0,0.5)] sm:text-[3rem]"
      >
        {subHeading}
      </motion.p>

      <motion.h2
        style={{ y, letterSpacing: tracking }}
        className="overlayHead text-center text-3xl font-bold text-white [text-shadow:0_2px_50px_rgba(0,0,0,0.55)] sm:text-[6rem]"
      >
        {heading}
      </motion.h2>
    </motion.div>
  );
};