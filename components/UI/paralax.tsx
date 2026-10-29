"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import ToothlessModel from "./toothlessModal";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

import Lightning from "./lightning";
import Rain from "./rain";

interface ParallaxBackgroundProps {
  /** Revealed underneath the parallax layers (your FluidCanvas). */
  children?: ReactNode;
  /** Text / UI that sits above every layer. Receives scroll progress (0 → 1). */
  overlay?: (progress: MotionValue<number>,isMute:boolean,setIsMute:any) => ReactNode;
}

type Mouse = { x: MotionValue<number>; y: MotionValue<number> };

/**
 * Shared classes for every full-bleed image layer. `bg-cover` makes each image
 * fill the viewport at any aspect ratio (phone portrait -> ultrawide); the
 * per-layer background-position decides which part of the image stays visible
 * when it has to be cropped.
 */
const IMG = "absolute inset-0 bg-cover bg-no-repeat";

/**
 * The two sliding cloud layers are made wider than the screen on the side they
 * travel away from (SLIDE_EXTRA vw of spare image), and they only travel
 * SLIDE_TRAVEL vw. The spare image is always bigger than the travel, so the
 * PNG's own edge stays off-screen for the whole scroll and can never show as a
 * hard line, at any screen size or aspect ratio.
 */
const SLIDE_EXTRA = 40; // vw of spare image beside the screen
const SLIDE_TRAVEL = 36; // vw the layer moves (always < SLIDE_EXTRA)

/**
 * Wrapper that adds a small pointer-driven offset (depth) to a layer without
 * touching the scroll-driven transforms on the layer inside it.
 *
 * `depth` is a percentage of the viewport (not pixels), so the parallax feels
 * identical on a phone and on a 4K display. The layer is scaled up by exactly
 * the amount needed to hide its edges at maximum offset, so no gaps ever show.
 */
export const Layer = ({
  z,
  depth,
  mouse,
  bleed = true,
  children,
}: {
  z: number;
  depth: number;
  mouse: Mouse;
  /** Over-scale the layer so pointer movement never exposes its edges. */
  bleed?: boolean;
  children: ReactNode;
}) => {
  const x = useTransform(mouse.x, (v) => `${v * depth}%`);
  const y = useTransform(mouse.y, (v) => `${v * depth}%`);
  // Always over-scale by at least 6% (3% per edge). This hides sub-pixel
  // anti-aliasing seams on high-DPI / fullscreen displays, and any thin
  // border or semi-transparent edge pixels baked into the image files.
  const scale = bleed ? Math.max(1.06, 1 + Math.abs(depth) / 100 + 0.02) : 1;

  return (
    <motion.div
      className="absolute inset-0"
      style={{ zIndex: z, x, y, scale, willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
};

const ParallaxBackground = ({ children, overlay }: ParallaxBackgroundProps) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  const [isMute,setIsMute]=useState(true)
  // Phones / narrow windows use the "spare image" cloud layers; everything
  // wider keeps the original full-travel parallax.
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // ── Scroll transforms (all in % / vw / vh so they scale with the screen) ──
  // Desktop: the original full-travel slide (200% / -170% of the layer width).
  const layer1X = useTransform(scrollYProgress, [0, 0.7], ["0%", "200%"]);
  const layer2X = useTransform(scrollYProgress, [0, 0.7], ["0%", "-170%"]);
  // Mobile: short slide that stays inside the spare image (see SLIDE_* above).
  const layer1XCompact = useTransform(scrollYProgress, [0, 0.7], ["0vw", `${SLIDE_TRAVEL}vw`]);
  const layer2XCompact = useTransform(scrollYProgress, [0, 0.7], ["0vw", `-${SLIDE_TRAVEL}vw`]);
  const scaleProgress = useTransform(scrollYProgress, [0, 0.7], [1, 4.7]);

  const scaleProgressInvert = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const mountainOpacity = useTransform(scrollYProgress, [0.5, 0.7], [1, 0]);
  const mountainScale = useTransform(scrollYProgress,[0,0.7], [1, 1.2])
  const cloudOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // ── Toothless flight path (scroll-driven, left → right) ─────────
  const dragonX = useTransform(scrollYProgress, [0.0, 0.2], ["-55vw", "110vw"]);
  const dragonY = useTransform(scrollYProgress, [0.06, 0.28, 0.5], ["14lvh", "4lvh", "-8lvh"]);
  const dragonRotate = useTransform(scrollYProgress, [0.19, 1.5], [14, -17]); // nose dips, then climbs
  const dragonScale = useTransform(scrollYProgress, [0.06, 0.5], [0.75, 1.2]); // drifts toward camera
  const dragonOpacity = useTransform(scrollYProgress, [0.06, 0.12, 0.44, 0.5], [0, 1, 1, 0]);

  // ── Pointer depth: far layers barely move, near layers move more ─
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const spring = { stiffness: 60, damping: 18, mass: 0.6 };
  const sx = useSpring(rawX, spring);
  const sy = useSpring(rawY, spring);
  const mouse: Mouse = { x: sx, y: sy };

  useEffect(() => {
    if (reduceMotion) return;
    // Touch devices have no hover pointer; skip the listener entirely there.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!fine.matches) return;

    const onMove = (e: PointerEvent) => {
      rawX.set(e.clientX / window.innerWidth - 0.5);
      rawY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduceMotion, rawX, rawY]);

  return (
    // lvh = the *large* viewport (toolbar hidden). Unlike plain vh/dvh it never
    // changes while the mobile browser bars collapse, so images don't resize or
    // jump mid-scroll, and no gap appears under the sticky stage.
    <section ref={containerRef} id="parallax-bg" className="relative h-[450lvh]">
      <div className="sticky top-0 isolate h-lvh w-full overflow-hidden">
        {/* Child content (fluid) */}
        <div className="absolute inset-0 z-0">{children}</div>

        {/* Mountain: anchored to the bottom so the peaks/base always stay in
            frame; on tall or wide screens only the sky gets cropped. */}
        <Layer z={20} depth={1.2} mouse={mouse}>
          <motion.div
            className={`${IMG} bg-bottom`}
            style={{
              backgroundImage: "url(/paralax2/mountain1.jpeg)",
              backgroundSize: "cover",
              willChange: "transform, opacity",
              opacity: mountainOpacity,
              scale:mountainScale
            }}
          />
        </Layer>

        {/* Dark cloud: anchored to the top (it sits in the sky). */}
        <Layer z={30} depth={2.4} mouse={mouse}>
          <motion.div
            className={`${IMG} bg-top`}
            style={{
              backgroundImage: "url(/paralax2/darkCloud2.png)",
              willChange: "transform, opacity",
              scale: scaleProgress,
              opacity: cloudOpacity,
            }}
          />
        </Layer>

        {/* Small cloud 2 */}
        <Layer z={20} depth={1.6} mouse={mouse}>
          {compact ? (
            <motion.div
              className="absolute inset-y-0 -right-[4%] bg-cover bg-center bg-no-repeat"
              style={{
                // spare image sits to the LEFT, because this layer moves right
                left: `-${SLIDE_EXTRA}vw`,
                backgroundImage: "url(/paralax2/smallCloud2.png)",
                willChange: "transform, opacity",
                x: layer1XCompact,
                opacity: cloudOpacity,
              }}
            />
          ) : (
            // An <img> sized by height is never cropped sideways, so the PNG's
            // transparent margins survive at every screen size: no hard edge
            // can appear while it slides. min-w-full only kicks in on screens
            // wider than the image, where it scales up instead of leaving gaps.
            <motion.img
              src="/paralax2/smallCloud2.png"
              alt=""
              aria-hidden="true"
              draggable={false}
              decoding="async"
              className="absolute left-0 top-0 h-full w-auto min-w-full max-w-none select-none object-cover object-center"
              style={{ willChange: "transform", x: layer1X }}
            />
          )}
        </Layer>

        {/* White cloud */}
        <Layer z={20} depth={2.1} mouse={mouse}>
          {compact ? (
            <motion.div
              className="absolute inset-y-0 -left-[4%] bg-cover bg-center bg-no-repeat"
              style={{
                // spare image sits to the RIGHT, because this layer moves left
                right: `-${SLIDE_EXTRA}vw`,
                backgroundImage: "url(/paralax2/whiteCloud.png)",
                willChange: "transform, opacity",
                x: layer2XCompact,
                opacity: cloudOpacity,
              }}
            />
          ) : (
            // Same idea, keeping the original 25rem left offset.
            <motion.img
              src="/paralax2/whiteCloud.png"
              alt=""
              aria-hidden="true"
              draggable={false}
              decoding="async"
              className="absolute left-100 top-0 h-full w-auto min-w-[calc(100%-25rem)] max-w-none select-none object-cover object-center"
              style={{
                willChange: "transform",
                x: layer2X,
                opacity: cloudOpacity,
                scale: scaleProgress

              }}
            />
          )}
        </Layer>


        <Layer z={20} depth={2.8} mouse={mouse} bleed={false}>
          <motion.div
            aria-hidden="true"
            className="absolute left-0 top-[12%] w-[clamp(280px,min(34vw,130lvh),1400px)]"
            style={{
              x: dragonX,
              y: dragonY,
              rotate: dragonRotate,
              scale: dragonScale,
              opacity: dragonOpacity,
              willChange: "transform, opacity",
            }}
          >
            <ToothlessModel
              src="/paralax2/toothless.glb"
              fallbackSrc="/paralax2/toothless.png"
            />
          </motion.div>
        </Layer>

        <Lightning visibility={cloudOpacity} volume={0.7} muted={isMute} />
       <Rain visibility={cloudOpacity} volume={0.1} intensity={0.5} muted={isMute} />

        {/* Soft scrim so white text stays readable on every stage */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[35] bg-[linear-gradient(to_top,rgba(4,6,10,0.6),rgba(4,6,10,0)_55%),radial-gradient(ellipse_at_center,transparent_55%,rgba(4,6,10,0.35)_100%)]"
        />

        {/* Overlay: all hero copy / UI */}
        <div className="pointer-events-none absolute inset-0 z-40">
          {overlay?.(scrollYProgress,isMute,setIsMute)}
        </div>

        {/* Scroll progress for this long section */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-6 top-1/2 z-50 hidden h-24 w-px -translate-y-1/2 bg-white/20 md:block"
        >
          <motion.div
            className="h-full w-full origin-top bg-white"
            style={{ scaleY: scrollYProgress }}
          />
        </div>
      </div>
    </section>
  );
};

export default ParallaxBackground;