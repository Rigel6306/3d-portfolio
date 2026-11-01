"use client";

import {
  motion,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { FaVolumeLow, FaVolumeXmark } from "react-icons/fa6";

const COPY = {
  name: "Chari",
  status: "Open to new projects",
  nav: [
    { label: "Work", href: "#work" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ],
  intro: {
    lines: ["Charitha Iravana", "Pentester / Developer", "Building the Future, Securely"],
    body: "I transform ideas into secure, seamless digital experiences accessible across all devices.",
    cue: "Scroll to continue",
  },
  reveal: {
    lines: ["Engineering Confidence", "Without Compromising Security."],
    body: "Behind every successful application is a foundation of thoughtful design, robust architecture, and uncompromising security. I build products that empower businesses and earn users' trust.",
    primary: { label: "See my work", href: "#work" },
    secondary: { label: "Get in touch", href: "#contact" },
    stack: ["React Native", "Expo", "Next.js", "TypeScript", "three.js"],
  },
};
/* ──────────────────────────────────────────────────────────────────────── */

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const shadow = "[text-shadow:0_1px_28px_rgba(0,0,0,0.35)]";

/** One masked line-by-line reveal on page load. This is the only auto-playing motion. */
const MaskedLines = ({ lines }: { lines: string[] }) => {
  const reduce = useReducedMotion();
  return (
    <h1
      className={`text-4xl font-light leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl ${shadow}`}
    >
      {lines.map((line, i) => (
        <span key={line} className="block overflow-hidden pb-[0.12em]">
          <motion.span
            className={`block ${i === 0 ? "text-white/55 text-3xl" : i === 1 ? "" : i === 2 ? "text-white/55 text-5xl " : ""}`}
            initial={reduce ? false : { y: "110%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.3 + i * 0.14 }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </h1>
  );
};

const Nav = () => (
  <header className="pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-center px-6 py-6 md:px-12">


    <nav aria-label="Primary" className="hidden items-center gap-8 sm:flex">
      {COPY.nav.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="text-sm text-black/75 tracking-wider uppercase  transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          {item.label}
        </a>
      ))}
    </nav>


  </header>
);

const HeroContent = ({ progress, isMute,setIsMute }: { progress: MotionValue<number>, isMute: boolean ,setIsMute: any}) => {
  // Stage 1 (mountain) blurs and lifts away as the clouds part…
  const introOpacity = useTransform(progress, [0, 0.16], [1, 0]);
  const introY = useTransform(progress, [0, 0.16], [0, -48]);
  const introFilter = useTransform(progress, [0, 0.16], ["blur(0px)", "blur(12px)"]);
  const cueOpacity = useTransform(progress, [0, 0.06], [1, 0]);

  // …and stage 2 (fluid) resolves in the same spot once the surface is exposed.
  const revealOpacity = useTransform(progress, [0.5, 0.68], [0, 1]);
  const revealY = useTransform(progress, [0.5, 0.68], [36, 0]);
  const revealFilter = useTransform(progress, [0.5, 0.68], ["blur(10px)", "blur(0px)"]);
  const revealPointer = useTransform(progress, (v) => (v > 0.6 ? "auto" : "none"));

  return (
    <>
    

      {/* Stage 1 — over the mountain */}
      <motion.div
        className="absolute inset-x-0 bottom-0 px-6 pb-20 md:px-12 md:pb-24"
        style={{ opacity: introOpacity, y: introY, filter: introFilter }}
      >


        <MaskedLines lines={COPY.intro.lines} />
        <p className={`mt-6 max-w-md text-base leading-relaxed text-white/75 ${shadow}`}>
          {COPY.intro.body}
        </p>



      </motion.div>

      <motion.div
        aria-hidden="true"
        className="absolute bottom-8 right-6 flex items-center  gap-6 text-sm text-white/70 md:right-12"
        style={{ opacity: cueOpacity }}
      >

        <div
          onClick={() => setIsMute((prev: boolean)=>!prev)}
          className="pointer-events-auto cursor-pointer inline-flex items-center  z-350 "
        >
          {isMute ? (
            <FaVolumeXmark key="muted" size={24} />
          ) : (
            <FaVolumeLow key="unmuted" size={24} />
          )}
        </div>

        <div className="flex items-center gap-3">
          <h1>
            {COPY.intro.cue}
          </h1>
          <span className="relative block h-10 w-px overflow-hidden bg-white/25">
            <motion.span
              className="absolute inset-x-0 top-0 block h-1/2 bg-white"
              animate={{ y: ["-100%", "200%"] }}
              transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
            />
          </span>

        </div>
      </motion.div>

      {/* Stage 2 — over the fluid */}
      <motion.section
        aria-label="Introduction"
        className="absolute inset-x-0 bottom-0 flex flex-col gap-10 px-6 pb-20 md:flex-row md:items-end md:justify-between md:px-12 md:pb-24"
        style={{
          opacity: revealOpacity,
          y: revealY,
          filter: revealFilter,
          pointerEvents: revealPointer,
        }}
      >


        <div className="max-w-2xl">
          <h2
            className={`text-4xl font-light leading-[1.08] tracking-tight text-white sm:text-6xl ${shadow}`}
          >

            {COPY.reveal.lines[0]}
            <span className="block text-white/55">{COPY.reveal.lines[1]}</span>
          </h2>
          <p className={`mt-6 max-w-md text-base leading-relaxed text-white/75 ${shadow}`}>
            {COPY.reveal.body}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={COPY.reveal.primary.href}
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-neutral-950 transition-colors hover:bg-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {COPY.reveal.primary.label}
            </a>
            <a
              href={COPY.reveal.secondary.href}
              className="rounded-full border border-white/30 bg-white/5 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {COPY.reveal.secondary.label}
            </a>
          </div>
        </div>


      </motion.section>
    </>
  );
};

export default HeroContent;