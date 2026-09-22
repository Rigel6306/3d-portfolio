import type { Route } from "./+types/home";
import { Suspense, lazy, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ReactLenis } from "lenis/react";

// Dynamic imports
const loadHero = () => import("components/hero");
const loadStickySlider = () =>
  import("components/UI/stickySlider").then((mod) => ({
    default: mod.TextParallaxContentContainer,
  }));

const Hero = lazy(loadHero);
const TextParallaxContentContainer = lazy(loadStickySlider);

const MIN_LOADER_DURATION_MS = 2500; // 2.5 seconds minimum display time

function PortfolioLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#050816] text-white"
      aria-live="polite"
      aria-label="Loading portfolio"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(92,51,204,0.3),transparent_35%),radial-gradient(circle_at_bottom,rgba(51,194,204,0.18),transparent_30%)]" />

      <div className="relative flex flex-col items-center gap-5 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/5 shadow-[0_0_30px_rgba(92,51,204,0.35)] backdrop-blur-sm"
        >
          <div className="text-xl font-black tracking-[0.18em] text-[#a7f3d0]">CI</div>
        </motion.div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.45em] text-white/60">
            Preparing experience
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.06em] text-white md:text-4xl">
            Charitha Iravana
          </h1>
        </div>

        <div className="mt-2 flex items-end gap-2">
          {[0, 1, 2].map((bar) => (
            <motion.span
              key={bar}
              animate={{
                height: [8, 28, 8],
                opacity: [0.45, 1, 0.45],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: bar * 0.15,
              }}
              className="block w-1.5 rounded-full bg-linear-to-t from-mint via-aqua to-lavender"
              style={{ height: 8 }}
            />
          ))}
        </div>
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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Minimum delay timer
    const minTimer = new Promise((resolve) =>
      setTimeout(resolve, MIN_LOADER_DURATION_MS)
    );

    // Preload both heavy lazy components
    const componentsLoaded = Promise.all([loadHero(), loadStickySlider()]);

    // Wait for both loading & minimum time to finish
    Promise.all([componentsLoaded, minTimer]).then(() => {
      if (isMounted) {
        setIsReady(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.8, duration: 4.5, smoothWheel: true }}>
      <div className="home bg-[#0000]">
        <AnimatePresence mode="wait">
          {!isReady && <PortfolioLoader key="portfolio-loader" />}
        </AnimatePresence>

        {isReady && (
          <Suspense fallback={null}>
            <Hero />
            <TextParallaxContentContainer />
          </Suspense>
        )}
      </div>
    </ReactLenis>
  );
}