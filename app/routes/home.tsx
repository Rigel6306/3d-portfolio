import type { Route } from "./+types/home";
import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ReactLenis } from "lenis/react";

import Footer from "components/UI/footer";
// Dynamic imports
const loadHero = () => import("components/hero");
const loadStickySlider = () =>
  import("components/UI/stickySlider").then((mod) => ({
    default: mod.TextParallaxContentContainer,
  }));

const Hero = lazy(loadHero);
const TextParallaxContentContainer = lazy(loadStickySlider);

const MIN_LOADER_DURATION_MS = 2500;
const LENIS_OPTIONS = {

  lerp: 0.07,             // Lower = smoother and heavier (default is 0.1)
  smoothWheel: true,     // Keeps mouse wheel scrolling butter-smooth
  syncTouch: true,       // Improves consistency on trackpads and touch devices
  // duration and easing are omitted here to let lerp handle the natural momentum
};

function PortfolioLoader({
  progress,
  error,
}: {
  progress: number;
  error: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-[#070707] text-white select-none"
      aria-live="polite"
      aria-label="Loading portfolio"
    >
      {/* Subtle monochrome ambient glow & vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Main Container */}
      <div className="relative flex flex-col items-center max-w-sm w-full px-6 text-center">
        
        {/* Branding Monogram / Logo */}
      

        {/* Typography */}
        <div className="space-y-1.5 mb-10">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/40"
          >
           Hey Delightfull Essence
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-light tracking-tight text-white/90"
          >
            Hang On
          </motion.h1>
        </div>

        {/* Percentage Loader Bar & Counter */}
        <div className="w-full space-y-3">
          <div className="flex justify-between items-center text-xs tracking-wider text-white/40 font-mono px-0.5">
            <span>{error ? "LOAD ERROR" : "LOADING"}</span>
            {!error && <span className="text-white/80 font-medium">{progress}%</span>}
          </div>

          {/* Track */}
          <div className="relative h-[2px] w-full overflow-hidden rounded-full bg-white/10">
            {/* Filler */}
            <motion.div
              className="absolute top-0 left-0 h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.6)]"
              style={{ width: `${error ? 100 : progress}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 20 }}
            />
          </div>
          {error && (
            <p role="alert" className="text-xs text-white/60">
              Something went wrong while loading.{" "}
              <button
                type="button"
                className="text-white underline underline-offset-4"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </p>
          )}
        </div>

      </div>

      {/* Bottom Status / Micro-detail */}
      <div className="absolute bottom-10 text-[10px] tracking-[0.25em] uppercase text-white/25 font-mono">
        Secure &bull; Interactive &bull; 2026
      </div>
    </motion.div>
  );
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Charitha Iravana | Full-stack developer" },
    {
      name: "description",
      content:
        "Portfolio of Charitha Iravana, a full-stack developer crafting expressive web and mobile experiences.",
    },
    { name: "theme-color", content: "#101820" },
    { property: "og:title", content: "Charitha Iravana | Full-stack developer" },
    {
      property: "og:description",
      content: "Expressive web and mobile experiences, from interface to API.",
    },
  ];
}

export default function Home() {
  const [modulesReady, setModulesReady] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);
  const [sectionReady, setSectionReady] = useState(false);
  const [sectionError, setSectionError] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const isReady = modulesReady && canvasReady && minimumTimeElapsed;
  const progress = isReady ? 100 : modulesReady ? (canvasReady ? 94 : 72) : 28;
  const handleCanvasLoad = useCallback(() => setCanvasReady(true), []);

  useEffect(() => {
    let isMounted = true;

    const minTimer = window.setTimeout(
      () => setMinimumTimeElapsed(true),
      MIN_LOADER_DURATION_MS
    );

    loadHero()
      .then(() => {
        if (isMounted) setModulesReady(true);
      })
      .catch((error: unknown) => {
        console.error("Failed to load the home page components.", error);
        if (isMounted) setLoadError(true);
      });

    return () => {
      isMounted = false;
      window.clearTimeout(minTimer);
    };
  }, []);

  useEffect(() => {
    if (!modulesReady || !canvasReady) return;

    let isMounted = true;
    loadStickySlider()
      .then(() => {
        if (isMounted) setSectionReady(true);
      })
      .catch((error: unknown) => {
        console.error("Failed to load the home page content section.", error);
        if (isMounted) setSectionError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [modulesReady, canvasReady]);

  return (
    <ReactLenis root options={LENIS_OPTIONS}>
      <div className="home bg-[#000000]">
        <AnimatePresence mode="wait">
          {!isReady && (
            <PortfolioLoader
              key="portfolio-loader"
              progress={progress}
              error={loadError}
            />
          )}
        </AnimatePresence>

        {modulesReady && (
          <Suspense fallback={null}>
            <Hero onLoad={handleCanvasLoad} />
            {sectionReady &&
              (
                <div className="div">
                    <TextParallaxContentContainer />
                    <Footer/>
                </div>
              )
             
             
             }
            {sectionError && (
              <p role="alert" className="px-6 py-12 text-center text-white/70">
                The rest of the portfolio could not be loaded. Please refresh to try again.
              </p>
            )}
          </Suspense>
        )}
      </div>
    </ReactLenis>
  );
}