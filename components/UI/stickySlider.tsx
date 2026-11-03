"use client";

import { memo, useRef, useSyncExternalStore } from "react";
import About from "components/about";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import ProjectShowcase from "./projectSchowcase";
import "../../app/styles/parallax.css";
import TechStory from "./techStory";

const IMG_PADDING = 42;

/* ───────────────────────────── Lite mode (phones) ─────────────────────────────
 * Per-frame blur filters, letter-spacing (forces layout) and huge blurred
 * shadows are what make this section stutter on phones. On narrow / touch
 * screens we keep the same layout and the same transform + opacity motion,
 * and drop only those expensive effects.
 * useSyncExternalStore => SSR-safe (server snapshot is `false`), no hydration
 * mismatch, and it updates if the window is resized / rotated.
 */
const LITE_QUERY = "(max-width: 767px), (pointer: coarse)";
const subscribeLite = (onChange: () => void) => {
  const mq = window.matchMedia(LITE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const getLite = () => window.matchMedia(LITE_QUERY).matches;
const getLiteServer = () => false;
const useLite = () => useSyncExternalStore(subscribeLite, getLite, getLiteServer);

/* ─────────────────────────────── Container ─────────────────────────────── */

const TextParallaxContentContainerBase = () => (
  <div className="bg-linear-to-b from-[#060606fe] via-[#141716c7] to-[#0000]">
    <TextParallaxContent
      img={"/parallax1.jpg"}
      chapter={"Chapter one"}
      subHeading={"Get to know the developer behind the code."}
      heading={"The Story Begins!"}
    >
      <div className="aboutUsSection">
        <h1 className="parallaxPageHeading text-white">About Me</h1>
        <div className="aboutContainer h-[300vh]">
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
      <TechStory />
    </TextParallaxContent>
  </div>
);

// memo: the parent (Home) re-renders on loader state changes; this section
// has no props, so it should never re-render with it.
export const TextParallaxContentContainer = memo(TextParallaxContentContainerBase);

interface TextParalaxPropsType {
  img: string;
  /** Optional smaller image for phones (e.g. 1000px wide WebP). */
  imgMobile?: string;
  subHeading: string;
  heading: string;
  chapter?: string;
  children?: React.ReactNode;
}

const TextParallaxContent = ({
  img,
  imgMobile,
  subHeading,
  heading,
  chapter,
  children,
}: TextParalaxPropsType) => {
  const lite = useLite();
  const chapterRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: chapterProgress } = useScroll({
    target: chapterRef,
    offset: ["start end", "end start"],
  });

  return (
    <div className="mt-10 w-full max-w-full overflow-clip">
      <div ref={chapterRef} className="relative h-[150vh] p-3">
        <StickyImage
          img={img}
          imgMobile={imgMobile}
          progress={chapterProgress}
          lite={lite}
        />
        <TextOverlay
          heading={heading}
          subHeading={subHeading}
          chapter={chapter}
          lite={lite}
        />
      </div>
      {children}
    </div>
  );
};

/* ─────────────────────────────── Sticky frame ─────────────────────────────── */

const StickyImage = ({
  img,
  imgMobile,
  progress,
  lite,
}: {
  img: string;
  imgMobile?: string;
  progress: MotionValue<number>;
  lite: boolean;
}) => {
  const reduceMotion = useReducedMotion();
  const refTarget = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: refTarget,
    offset: ["end end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0]);

  // The photo drifts slower than the frame. ±6% drift needs ≥1.12 over-scale
  // to never show an edge; 1.14 (was 1.2) = smaller layer to rasterize.
  const imgY = useTransform(
    progress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["-6%", "6%"]
  );

  return (
    <motion.div
      style={{
        height: `calc(97vh - ${IMG_PADDING * 2}px)`,
        top: 50,
        scale,
        willChange: "transform",
      }}
      ref={refTarget}
      className={`sticky z-0 overflow-hidden rounded-3xl bg-neutral-900 ring-1 ring-white/10 ${
        // A 120px-blur shadow on a full-screen scaling layer is very costly on phones.
        lite ? "" : "shadow-[0_30px_120px_-30px_rgba(0,0,0,0.9)]"
      }`}
    >
      {/* <img> instead of CSS background: lazy-loaded, decoded off the main
          thread, and the browser can drop its decoded bitmap when far
          off-screen (three full-screen photos otherwise stay in memory). */}
      <picture aria-hidden="true">
        {imgMobile && <source media="(max-width: 767px)" srcSet={imgMobile} />}
        <motion.img
          src={img}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-cover object-center"
          style={{ scale: 1.14, y: imgY, willChange: "transform" }}
        />
      </picture>
    </motion.div>
  );
};

/* ─────────────────────────────── Chapter text ─────────────────────────────── */

const TextOverlay = ({
  heading,
  subHeading,
  chapter,
  lite,
}: {
  heading: string;
  subHeading: string;
  chapter?: string;
  lite: boolean;
}) => {
  const refTarget = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: refTarget,
    offset: ["start end", "end start"],
  });

  // Text rises through the frame and fades in and out.
  const y = useTransform(scrollYProgress, [0, 1], [250, -250]);
  const opacity = useTransform(scrollYProgress, [0.1, 0.5, 0.75], [0, 1, 0]);
  const ySub = useTransform(scrollYProgress, [0, 1], [170, -170]);
  const yChapter = useTransform(scrollYProgress, [0, 1], [120, -120]);

  // Desktop-only extras (blur-in and letter-spacing settle). Both are skipped
  // in lite mode: animated filter:blur repaints every frame, and animated
  // letter-spacing re-lays-out the text every frame.
  const blurPx = useTransform(scrollYProgress, [0.1, 0.4, 0.5, 0.75], [14, 0, 0, 12]);
  const filter = useTransform(blurPx, (v) => `blur(${v}px)`);
  const tracking = useTransform(scrollYProgress, [0.1, 0.5], ["0.14em", "-0.02em"]);

  return (
    <motion.div
      ref={refTarget}
      style={{
        opacity,
        ...(lite ? null : { filter }),
        willChange: lite ? "opacity" : "opacity, filter",
      }}
      className="absolute left-0 top-1/2 -translate-y-1/2 flex w-full flex-col items-center justify-center px-4"
    >
      {chapter && (
        <motion.div
          style={{ y: yChapter, willChange: "transform" }}
          className="mb-5 flex items-center gap-4 text-sm text-white/60"
        >
          <span aria-hidden="true" className="h-px w-8 bg-white/30 sm:w-14" />
          {chapter}
          <span aria-hidden="true" className="h-px w-8 bg-white/30 sm:w-14" />
        </motion.div>
      )}

      <motion.p
        style={{ y: ySub, willChange: "transform" }}
        className={`overlaySubHead mb-2 text-center text-sm text-white/85 sm:text-[3rem] ${
          lite
            ? "[text-shadow:0_2px_14px_rgba(0,0,0,0.55)]"
            : "[text-shadow:0_2px_40px_rgba(0,0,0,0.5)]"
        }`}
      >
        {subHeading}
      </motion.p>

      <motion.h2
        style={{
          y,
          letterSpacing: lite ? "-0.02em" : tracking,
          willChange: "transform",
        }}
        className={`overlayHead text-center text-3xl font-bold text-white sm:text-[6rem] ${
          lite
            ? "[text-shadow:0_2px_16px_rgba(0,0,0,0.6)]"
            : "[text-shadow:0_2px_50px_rgba(0,0,0,0.55)]"
        }`}
      >
        {heading}
      </motion.h2>
    </motion.div>
  );
};