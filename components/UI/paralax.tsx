"use client";

import {  useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ToothlessModel from "./toothlessModal";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

import Lightning from "./lightning";
import Rain from "./rain";

interface ParallaxBackgroundProps {
  /**
   * Revealed underneath the parallax layers (your FluidCanvas).
   * Can be a render function that receives `fluidActive` so the fluid
   * simulation only runs while it can actually be seen.
   */
  children?: ReactNode | ((fluidActive: boolean) => ReactNode);
  /** Text / UI that sits above every layer. Receives scroll progress (0 → 1). */
  overlay?: (
    progress: MotionValue<number>,
    isMute: boolean,
    setIsMute: any
  ) => ReactNode;
}

type Mouse = { x: MotionValue<number>; y: MotionValue<number> };

const IMG = "absolute inset-0 bg-cover bg-no-repeat";

const SLIDE_EXTRA = 40; // vw of spare image beside the screen
const SLIDE_TRAVEL = 36; // vw the layer moves (always < SLIDE_EXTRA)

/**
 * Wrapper that adds a small pointer-driven offset (depth) to a layer.
 * `disabled` skips the wrapper's transforms entirely (touch devices have no
 * pointer parallax, so this saves one compositor layer per Layer).
 */
export const Layer = ({
  z,
  depth,
  mouse,
  bleed = true,
  disabled = false,
  children,
}: {
  z: number;
  depth: number;
  mouse: Mouse;
  bleed?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) => {
  const x = useTransform(mouse.x, (v) => `${v * depth}%`);
  const y = useTransform(mouse.y, (v) => `${v * depth}%`);
  const scale = bleed ? Math.max(1.06, 1 + Math.abs(depth) / 100 + 0.02) : 1;

  if (disabled) {
    return (
      <div className="absolute inset-0" style={{ zIndex: z }}>
        {children}
      </div>
    );
  }

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
  const [isMute, setIsMute] = useState(true);

  // Phones / narrow windows use lighter layers.
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

  // ── Which heavy stages are actually visible right now ───────────
  // setState only re-renders when the boolean really flips, so this is cheap.
  // Heavy things are mounted EARLY (from the start) and unmounted LATE, with
  // hysteresis, so nothing is ever created in the middle of a scroll gesture.
  // The functional setState returns the same value when nothing changes, so
  // React skips the re-render on almost every scroll event.
  const [fluidActive, setFluidActive] = useState(false);
  const [dragonActive, setDragonActive] = useState(true);
  const [skyActive, setSkyActive] = useState(true);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // Fluid is revealed as mountain/clouds fade (0.5 → 0.7); start a bit early.
    setFluidActive((p) => (p ? v > 0.38 : v > 0.42));
    // Dragon is visible 0.06 → 0.5, fully invisible beyond that.
    setDragonActive((p) => (p ? v < 0.7 : v < 0.64));
    // Rain / lightning fade out by 0.5.
    setSkyActive((p) => (p ? v < 0.7 : v < 0.64));
  });

  // ── Scroll transforms ───────────────────────────────────────────
  const layer1X = useTransform(scrollYProgress, [0, 0.7], ["0%", "200%"]);
  const layer2X = useTransform(scrollYProgress, [0, 0.7], ["0%", "-170%"]);
  const layer1XCompact = useTransform(
    scrollYProgress,
    [0, 0.7],
    ["0vw", `${SLIDE_TRAVEL}vw`]
  );
  const layer2XCompact = useTransform(
    scrollYProgress,
    [0, 0.7],
    ["0vw", `-${SLIDE_TRAVEL}vw`]
  );
  const scaleDesktop = useTransform(scrollYProgress, [0, 0.7], [1, 4.7]);
  // Smaller max scale on phones = far less GPU memory / fill-rate.
  const scaleCompact = useTransform(scrollYProgress, [0, 0.7], [1, 2.4]);
  const cloudScale = compact ? scaleCompact : scaleDesktop;

  const mountainOpacity = useTransform(scrollYProgress, [0.5, 0.7], [1, 0]);
  const mountainScale = useTransform(scrollYProgress, [0, 0.7], [1, 1.2]);
  const cloudOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // ── Toothless flight path ───────────────────────────────────────
  const dragonX = useTransform(scrollYProgress, [0.0, 0.2], ["-55vw", "110vw"]);
  const dragonY = useTransform(
    scrollYProgress,
    [0.06, 0.28, 0.5],
    ["14lvh", "4lvh", "-8lvh"]
  );
  const dragonRotate = useTransform(scrollYProgress, [0.19, 1.5], [14, -17]);
  const dragonScale = useTransform(scrollYProgress, [0.06, 0.5], [0.75, 1.2]);
  const dragonOpacity = useTransform(
    scrollYProgress,
    [0.06, 0.12, 0.44, 0.5],
    [0, 1, 1, 0]
  );

  // ── Pointer depth ───────────────────────────────────────────────
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const spring = { stiffness: 60, damping: 18, mass: 0.6 };
  const sx = useSpring(rawX, spring);
  const sy = useSpring(rawY, spring);
  const mouse = useMemo<Mouse>(() => ({ x: sx, y: sy }), [sx, sy]);

  useEffect(() => {
    if (reduceMotion) return;
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

    <section  ref={containerRef}  id="parallax-bg" className="relative h-[450lvh]">
      <div className="sticky top-0 isolate h-lvh w-full overflow-hidden">
        {/* Child content (fluid) */}
        <div className="absolute inset-0 z-0">
          {typeof children === "function" ? children(fluidActive) : children}
        </div>

        {/* Mountain */}
        <Layer z={20} depth={1.2} mouse={mouse} disabled={compact}>
          <motion.div
            className={`${IMG} bg-bottom`}
            style={{
              backgroundImage: "url(/paralax2/mountain1.jpg)",
              backgroundSize: "cover",
              willChange: "transform, opacity",
              opacity: mountainOpacity,
              scale: mountainScale,
            }}
          />
        </Layer>

        {/* Dark cloud */}
        <Layer z={30} depth={2.4} mouse={mouse} disabled={compact}>
          <motion.div
            className={`${IMG} bg-top`}
            style={{
              backgroundImage: "url(/paralax2/darkCloud2.png)",
              willChange: "transform, opacity",
              scale: cloudScale,
              opacity: cloudOpacity,
            }}
          />
        </Layer>

        {/* Small cloud 2 */}
        <Layer z={20} depth={1.6} mouse={mouse} disabled={compact}>
          {compact ? (
            <motion.div
              className="absolute inset-y-0 -right-[4%] bg-cover bg-center bg-no-repeat"
              style={{
                left: `-${SLIDE_EXTRA}vw`,
                backgroundImage: "url(/paralax2/smallCloud2.png)",
                willChange: "transform, opacity",
                x: layer1XCompact,
                opacity: cloudOpacity,
              }}
            />
          ) : (
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
        <Layer z={20} depth={2.1} mouse={mouse} disabled={compact}>
          {compact ? (
            <motion.div
              className="absolute inset-y-0 -left-[4%] bg-cover bg-center bg-no-repeat"
              style={{
                right: `-${SLIDE_EXTRA}vw`,
                backgroundImage: "url(/paralax2/whiteCloud.png)",
                willChange: "transform, opacity",
                x: layer2XCompact,
                opacity: cloudOpacity,
              }}
            />
          ) : (
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
                scale: scaleDesktop,
              }}
            />
          )}
        </Layer>

        {/* Toothless: only mounted while visible; phones get the flat PNG
            instead of a second live WebGL context. */}
        {dragonActive && (
          <Layer z={20} depth={2.8} mouse={mouse} bleed={false} disabled={compact}>
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
              {compact ? (
                <img
                  src="/paralax2/toothless.png"
                  alt=""
                  draggable={false}
                  decoding="async"
                  className="h-auto w-full select-none"
                />
              ) : (
                <ToothlessModel
                  src="/paralax2/toothless.glb"
                  fallbackSrc="/paralax2/toothless.png"
                />
              )}
            </motion.div>
          </Layer>
        )}

        {/* Weather: unmounted once the sky has faded out */}
        {skyActive && (
          <>
            <Lightning visibility={cloudOpacity} volume={0.7} muted={isMute} />
            <Rain
              visibility={cloudOpacity}
              volume={0.1}
              intensity={compact ? 0.25 : 0.5}
              muted={isMute}
            />
          </>
        )}

        {/* Soft scrim */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[35] bg-[linear-gradient(to_top,rgba(4,6,10,0.6),rgba(4,6,10,0)_55%),radial-gradient(ellipse_at_center,transparent_55%,rgba(4,6,10,0.35)_100%)]"
        />

        {/* Overlay */}
        <div className="pointer-events-none absolute inset-0 z-40">
          {overlay?.(scrollYProgress, isMute, setIsMute)}
        </div>

        {/* Scroll progress */}
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