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

/* ───────────────────────────────── Moods ─────────────────────────────────
 * Each chapter gets its own light, so the story moves through time as you
 * scroll: dawn -> dusk -> night, ending in the night sky of the footer.
 */
type Mood = "dawn" | "dusk" | "night";

const MOODS: Record<Mood, { tint: string; glow: string; fog: string }> = {
  dawn: {
    tint: "linear-gradient(to top, rgba(255,160,90,0.30), rgba(255,130,90,0.08) 45%, transparent 75%)",
    glow: "radial-gradient(ellipse 60% 50% at 18% 100%, rgba(255,196,130,0.42), transparent 70%)",
    fog: "rgba(255,225,190,0.16)",
  },
  dusk: {
    tint: "linear-gradient(to top, rgba(120,70,160,0.38), rgba(60,50,120,0.12) 50%, transparent 80%)",
    glow: "radial-gradient(ellipse 60% 45% at 80% 100%, rgba(255,140,110,0.34), transparent 70%)",
    fog: "rgba(200,170,235,0.14)",
  },
  night: {
    tint: "linear-gradient(to top, rgba(20,35,80,0.5), rgba(10,18,45,0.18) 55%, transparent)",
    glow: "radial-gradient(ellipse 55% 45% at 70% 0%, rgba(150,180,255,0.28), transparent 70%)",
    fog: "rgba(150,170,215,0.13)",
  },
};

/** Fixed star positions (percent), so server and client always agree. */
const STARS = Array.from({ length: 46 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return { x: r(1) * 100, y: r(2) * 70, s: 1 + r(3) * 1.6, o: 0.35 + r(4) * 0.65, g: i % 3 };
});

/* ───────────────────────────────── Page ───────────────────────────────── */

export const TextParallaxContentContainer = () => {
  // Static tree: built once so scroll-unrelated re-renders don't rebuild
  // About / ProjectShowcase. Animations run on motion values, not React state.
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
          mood={"dawn"}
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
          mood={"dusk"}
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
          mood={"night"}
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
  mood?: Mood;
  children?: React.ReactNode;
}

const TextParallaxContent = ({
  img,
  subHeading,
  heading,
  chapter,
  mood = "dawn",
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
        <StickyImage img={img} mood={mood} progress={chapterProgress} />
        <TextOverlay heading={heading} subHeading={subHeading} chapter={chapter} />
      </div>
      {children}
    </div>
  );
};

/* ─────────────────────────────── Sticky frame ─────────────────────────────── */

const StickyImage = ({
  img,
  mood,
  progress,
}: {
  img: string;
  mood: Mood;
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
  const opacity = scale;

  // Depth inside the frame: the photo drifts slower than the frame, the mist faster.
  const imgY = useTransform(progress, [0, 1], reduceMotion ? ["0%", "0%"] : ["-6%", "6%"]);
  const mistA = useTransform(progress, [0, 1], reduceMotion ? ["0%", "0%"] : ["-14%", "14%"]);
  const mistB = useTransform(progress, [0, 1], reduceMotion ? ["0%", "0%"] : ["12%", "-12%"]);
  const m = MOODS[mood];

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

      {/* This chapter's light */}
      <div aria-hidden="true" className="absolute inset-0" style={{ background: m.tint }} />
      <div aria-hidden="true" className="absolute inset-0" style={{ background: m.glow }} />

      {mood === "night" && (
        <div aria-hidden="true" className="absolute inset-0">
          {STARS.map((s, i) => (
            <span
              key={i}
              className="chapter-star absolute rounded-full bg-[#e6eeff]"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.s,
                height: s.s,
                opacity: s.o,
                animationDelay: `${s.g * 1.3}s`,
                animationDuration: `${3.5 + s.g}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Drifting mist, like the clouds in the hero */}
      <motion.div
        aria-hidden="true"
        className="absolute left-[-15%] top-[55%] h-[28%] w-[80%] blur-2xl"
        style={{ x: mistA, background: `radial-gradient(ellipse at center, ${m.fog}, transparent 70%)` }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute right-[-15%] top-[35%] h-[24%] w-[70%] blur-2xl"
        style={{ x: mistB, background: `radial-gradient(ellipse at center, ${m.fog}, transparent 70%)` }}
      />

      {/* Original dark overlay (fades as the frame shrinks) */}
      <motion.div
        style={{ opacity }}
        className="absolute inset-0 rounded-3xl bg-neutral-950/60"
      />

      {/* Soft vignette keeps the centre text readable */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.5)_100%)]"
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