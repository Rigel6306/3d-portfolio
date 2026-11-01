import {
  memo,
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

import { useSlot } from "hooks/useSlot";
import type { Project } from "constants/consts";
import { PROJECTS } from "constants/consts";

const SCROLL_PER_PROJECT = 140;
const COUNT = PROJECTS.length;

type Fit = "stage" | "flow";

const btnPrimary =
  "rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const btnSecondary =
  "rounded-full border border-white/30 bg-white/5 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

// PROJECTS is static, so resolve each project's image list once instead of on every render.
const imageCache = new WeakMap<Project, string[]>();
const getImages = (project: Project): string[] => {
  let cached = imageCache.get(project);
  if (!cached) {
    const list = (project as Project & { images?: string[] }).images;
    cached = list && list.length ? list : project.image ? [project.image] : [];
    imageCache.set(project, cached);
  }
  return cached;
};

// Hydration-safe reduced-motion check (server snapshot is always `false`, so SSR and the
// first client render agree; React re-renders afterwards if the user prefers reduced motion).
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const getReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;
const getServerReducedMotion = () => false;

const useReducedMotionSafe = () =>
  useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getServerReducedMotion);

// Fully hidden scenes are removed from layout/paint (no blur, no compositing, no focus).
const MIN_VISIBLE = 0.01;

/* -------------------------------------------------------------------------- */
/* presentational pieces                                                       */
/* -------------------------------------------------------------------------- */

const Details = memo(({ project, interactive }: { project: Project; interactive: boolean }) => (
  <div className="max-w-xl">
    <p className="text-xs text-white/55 md:text-sm">{project.kind}</p>
    {/* Title scales with viewport HEIGHT so short laptop screens don't overflow */}
    <h3 className="mt-1.5 text-3xl font-light leading-[1.08] tracking-tight text-white md:text-[length:clamp(1.875rem,4.8lvh,3.5rem)]">
      {project.title}
    </h3>
    <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75 md:mt-4 md:text-[0.95rem] max-lg:line-clamp-3">
      {project.description}
    </p>

    <ul className="mt-4 hidden flex-col gap-2 md:flex">
      {project.highlights.map((h) => (
        <li
          key={h}
          className="border-l border-white/15 pl-3.5 text-[0.8rem] leading-snug text-white/70 xl:text-sm"
        >
          {h}
        </li>
      ))}
    </ul>

    <ul aria-label="Built with" className="mt-4 flex flex-wrap gap-1.5">
      {project.stack.map((s) => (
        <li
          key={s}
          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90 backdrop-blur-md md:text-[0.8rem]"
        >
          {s}
        </li>
      ))}
    </ul>

    {(project.href || project.repo) && (
      <div className="mt-5 flex flex-wrap gap-2.5 md:mt-6">
        {project.href && (
          <a href={project.href} tabIndex={interactive ? 0 : -1} className={btnPrimary}>
            View project
          </a>
        )}
        {project.repo && (
          <a href={project.repo} tabIndex={interactive ? 0 : -1} className={btnSecondary}>
            Source code
          </a>
        )}
      </div>
    )}
  </div>
));

Details.displayName = "Details";

/**
 * Display only: cross-fades between the project's images.
 *
 * Memory / network strategy:
 * - `near` = false mounts nothing, so decoded bitmaps of far-away projects are released.
 * - Only the current image and its two neighbours (prev/next) are mounted. That keeps the
 *   cross-fade smooth and next/prev instant, without decoding every screenshot at once.
 * - `lazy` is for the in-flow list (reduced motion). In the sticky stage every scene sits in the
 *   same viewport rect, so native lazy-loading can't help; mounting is gated by `near` instead.
 */
const Gallery = memo(
  ({
    project,
    current,
    near = true,
    priority = false,
    lazy = false,
  }: {
    project: Project;
    current: number;
    near?: boolean;
    priority?: boolean;
    lazy?: boolean;
  }) => {
    if (!near) return null;
    const images = getImages(project);
    const count = images.length;

    return (
      <div className="absolute inset-0 overflow-hidden">
        {images.map((src, k) => {
          const isCurrent = k === current;
          const isNeighbour = k === (current + 1) % count || k === (current - 1 + count) % count;
          if (!isCurrent && !isNeighbour) return null;

          return (
            <img
              key={`${src}-${k}`}
              src={src}
              alt={`${project.title} screenshot ${k + 1}`}
              aria-hidden={!isCurrent}
              decoding="async"
              loading={lazy ? "lazy" : "eager"}
              fetchPriority={priority && isCurrent ? "high" : isCurrent ? "auto" : "low"}
              draggable={false}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                isCurrent ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
              }`}
            />
          );
        })}
      </div>
    );
  },
);

Gallery.displayName = "Gallery";

/** Image switcher that sits BELOW the device frame, outside the tilting layer. */
const GalleryControls = memo(
  ({
    project,
    current,
    onChange,
    interactive = true,
  }: {
    project: Project;
    current: number;
    onChange: (index: number) => void;
    interactive?: boolean;
  }) => {
    const count = getImages(project).length;
    if (count < 2) return null;

    const tab = interactive ? 0 : -1;
    const ctrl =
      "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";

    return (
      <div
        role="group"
        aria-label={`${project.title} screenshots`}
        className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1 backdrop-blur-md"
      >
        <button
          type="button"
          tabIndex={tab}
          aria-label="Previous image"
          onClick={() => onChange((current - 1 + count) % count)}
          className={ctrl}
        >
          ‹
        </button>
        {Array.from({ length: count }, (_, k) => (
          <button
            key={k}
            type="button"
            tabIndex={tab}
            aria-label={`Show image ${k + 1} of ${count}`}
            aria-current={k === current}
            onClick={() => onChange(k)}
            className="flex h-6 w-4 cursor-pointer items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <span
              className={`block h-1.5 rounded-full transition-all ${
                k === current ? "w-4 bg-white" : "w-1.5 bg-white/40"
              }`}
            />
          </button>
        ))}
        <button
          type="button"
          tabIndex={tab}
          aria-label="Next image"
          onClick={() => onChange((current + 1) % count)}
          className={ctrl}
        >
          ›
        </button>
      </div>
    );
  },
);

GalleryControls.displayName = "GalleryControls";

const DeviceFrame = memo(
  ({
    project,
    current,
    fit,
    near = true,
    priority = false,
    lazy = false,
  }: {
    project: Project;
    current: number;
    fit: Fit;
    near?: boolean;
    priority?: boolean;
    lazy?: boolean;
  }) => {
    const fallback = {
      backgroundImage: `linear-gradient(135deg, ${project.accent}66, #0b0d12 70%)`,
    };

    if (project.device === "mobile") {
      // Fills the full height of its slot; width follows from the aspect ratio.
      return (
        <div className="relative aspect-9/19 h-full rounded-[2.5rem] border border-white/15 bg-neutral-950 p-2 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
          <div className="relative h-full w-full overflow-hidden rounded-[2.1rem]" style={fallback}>
            <Gallery project={project} current={current} near={near} priority={priority} lazy={lazy} />
            <span className="absolute left-1/2 top-2.5 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
          </div>
        </div>
      );
    }

    // Stage: width derived from the viewport height so the whole frame fits the free space
    // (viewport minus heading, rail and controls). Stacked (<lg) layout only gets ~half the height.
    const width =
      fit === "stage"
        ? "w-[min(100%,1040px,calc((100lvh_-_15rem)*1.6))] max-lg:w-[min(100%,calc((50lvh_-_9rem)*1.6))]"
        : "w-full max-w-[860px]";

    return (
      <div
        className={`relative ${width} overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]`}
      >
        <div className="flex h-9 items-center gap-2 border-b border-white/10 bg-white/4 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          {project.host && (
            <span className="ml-3 truncate rounded-md bg-white/6 px-3 py-1 text-xs text-white/50">
              {project.host}
            </span>
          )}
        </div>
        <div className="relative aspect-16/9 w-full" style={fallback}>
          <Gallery project={project} current={current} near={near} priority={priority} lazy={lazy} />
        </div>
      </div>
    );
  },
);

DeviceFrame.displayName = "DeviceFrame";

/* -------------------------------------------------------------------------- */
/* scroll-driven scenes                                                        */
/* -------------------------------------------------------------------------- */

const SceneVisual = memo(
  ({
    project,
    index,
    total,
    progress,
    current,
    near,
  }: {
    project: Project;
    index: number;
    total: number;
    progress: MotionValue<number>;
    current: number;
    near: boolean;
  }) => {
    const { opacity, scale, y, filter } = useSlot(progress, index, total);
    // blur(0px) still forces a filter layer that softens text; drop it entirely at rest.
    const crispFilter = useTransform(filter, (f) => (f === "blur(0px)" ? "none" : f));
    // Invisible scenes cost nothing: no layout, paint or compositing.
    const display = useTransform(opacity, (o) => (o > MIN_VISIBLE ? "flex" : "none"));

    return (
      <motion.div
        className="pointer-events-none absolute inset-0 items-end justify-center"
        // No `willChange: transform`: it makes the browser rasterize once (at the initial 0.6 scale)
        // and then stretch that bitmap, which is what made the screenshots look soft.
        style={{ opacity, scale, y, filter: crispFilter, display, zIndex: total - index }}
      >
        {/* Radial gradient instead of a 90px CSS blur: same soft glow, no per-frame blur pass. */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-[90%] w-[90%] -translate-x-1/2 -translate-y-1/2 opacity-35"
          style={{ background: `radial-gradient(closest-side, ${project.accent}, transparent)` }}
        />
        <DeviceFrame
          project={project}
          current={current}
          fit="stage"
          near={near}
          priority={index === 0}
        />
      </motion.div>
    );
  },
);

SceneVisual.displayName = "SceneVisual";

const SceneText = memo(
  ({
    project,
    index,
    total,
    progress,
    interactive,
  }: {
    project: Project;
    index: number;
    total: number;
    progress: MotionValue<number>;
    interactive: boolean;
  }) => {
    const { textOpacity, textY } = useSlot(progress, index, total);
    const display = useTransform(textOpacity, (o) => (o > MIN_VISIBLE ? "flex" : "none"));

    return (
      <motion.div
        className="absolute inset-0 flex-col justify-center"
        style={{
          opacity: textOpacity,
          y: textY,
          display,
          pointerEvents: interactive ? "auto" : "none",
        }}
        aria-hidden={!interactive}
      >
        <Details project={project} interactive={interactive} />
      </motion.div>
    );
  },
);

SceneText.displayName = "SceneText";

const RailItem = memo(
  ({
    project,
    index,
    total,
    progress,
    active,
    onSelect,
  }: {
    project: Project;
    index: number;
    total: number;
    progress: MotionValue<number>;
    active: boolean;
    onSelect: (index: number) => void;
  }) => {
    const fill = useTransform(progress, [index / total, (index + 1) / total], [0, 1]);
    return (
      <button
        type="button"
        onClick={() => onSelect(index)}
        aria-label={`Go to ${project.title}`}
        aria-current={active}
        className="group pointer-events-auto flex cursor-pointer flex-col items-start gap-2 py-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        <span
          className={`hidden text-sm transition-colors md:block ${
            active ? "text-white" : "text-white/45 group-hover:text-white/75"
          }`}
        >
          {project.title}
        </span>
        <span className="relative block h-px w-10 bg-white/20 md:w-28">
          <motion.span className="absolute inset-0 origin-left bg-white" style={{ scaleX: fill }} />
        </span>
      </button>
    );
  },
);

RailItem.displayName = "RailItem";

const ScrollStage = () => {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Don't touch the network until the section is about to scroll into view; release
  // decoded images again once the user is well past it.
  const inRange = useInView(ref, { margin: "150% 0px" });

  const [active, setActive] = useState(0);
  // Selected image index per project (lifted so controls can live outside the tilting layer).
  const [shots, setShots] = useState<number[]>(() => PROJECTS.map(() => 0));

  // useMotionValueEvent subscribes/unsubscribes with the component lifecycle.
  // setState bails out when the value is unchanged, so this re-renders only on project changes.
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(COUNT - 1, Math.max(0, Math.floor(v * COUNT))));
  });

  // Passed to memoised children, so the identity must be stable.
  const setShot = useCallback((projectIndex: number, imageIndex: number) => {
    setShots((prev) => {
      if (prev[projectIndex] === imageIndex) return prev;
      const next = [...prev];
      next[projectIndex] = imageIndex;
      return next;
    });
  }, []);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  // Subtle tilt: +/-3deg and a slower, softer spring.
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-3, 3]), { stiffness: 80, damping: 22 });
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [2, -2]), { stiffness: 80, damping: 22 });

  // Passed to memoised RailItems, so the identity must be stable.
  const goTo = useCallback((i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    setActive(i);
    window.scrollTo({ top: top + ((i + 0.5) / COUNT) * range, behavior: "instant" });
  }, []);

  // Plain DOM handlers: no memoisation needed.
  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Mouse only (no tilt from touch), measured against the frame slot, which never rotates.
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const handlePointerLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const activeProject = PROJECTS[active];

  return (
    <section
      ref={ref}
      id="work"
      aria-label="Selected projects"
      className="relative w-screen"
      style={{ height: `${COUNT * SCROLL_PER_PROJECT}lvh` }}
    >
      <h2 className="pointer-events-none inset-x-0 text-center top-15 z-10 left-12 text-2xl uppercase tracking-wide text-white/80 md:top-17 md:text-3xl font-bold">
        My Work
      </h2>

      <div className="sticky top-0 h-lvh overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_45%,rgba(255,255,255,0.05),transparent_10%)]"
        />

        {/* Tight vertical padding = more room for the frame: 4rem top (heading) / 4.5rem bottom (rail) */}
        <div className="relative mx-auto grid h-full max-w-[1600px] grid-rows-[minmax(0,1.15fr)_minmax(0,1fr)] gap-3 px-5 pb-[4.5rem] pt-16 md:px-10 lg:grid-cols-12 lg:grid-rows-1 lg:gap-8 lg:px-12 xl:gap-12">
          <div className="relative order-2 lg:order-1 lg:col-span-4">
            {PROJECTS.map((p, i) => (
              <SceneText
                key={p.id}
                project={p}
                index={i}
                total={COUNT}
                progress={scrollYProgress}
                interactive={active === i}
              />
            ))}
          </div>

          {/* Visual column: tilting frame on top, static controls underneath */}
          <div className="relative order-1 flex min-h-0 flex-col lg:order-2 lg:col-span-8">
            {/* Static hit-area: tilt is driven only while the pointer is over the frame slot.
                The controls row below is a sibling, so entering it fires pointerleave and resets the tilt. */}
            <div
              className="relative min-h-0 flex-1"
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
            >
              <motion.div
                className="absolute inset-0"
                style={{ rotateX, rotateY, transformPerspective: 1200 }}
              >
                {PROJECTS.map((p, i) => (
                  <SceneVisual
                    key={p.id}
                    project={p}
                    index={i}
                    total={COUNT}
                    progress={scrollYProgress}
                    current={shots[i] ?? 0}
                    near={inRange && Math.abs(active - i) <= 1}
                  />
                ))}
              </motion.div>
            </div>

            <div className="relative z-10 flex h-12 shrink-0 items-center justify-center">
              {activeProject && (
                <GalleryControls
                  key={activeProject.id}
                  project={activeProject}
                  current={shots[active] ?? 0}
                  onChange={(k) => setShot(active, k)}
                />
              )}
            </div>
          </div>
        </div>

        <nav
          aria-label="Projects"
          className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-4 px-6 md:gap-8"
        >
          {PROJECTS.map((p, i) => (
            <RailItem
              key={p.id}
              project={p}
              index={i}
              total={COUNT}
              progress={scrollYProgress}
              active={active === i}
              onSelect={goTo}
            />
          ))}
        </nav>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* reduced-motion fallback                                                     */
/* -------------------------------------------------------------------------- */

const StaticItem = ({ project, first }: { project: Project; first: boolean }) => {
  const [current, setCurrent] = useState(0);
  return (
    <li className="grid gap-10 lg:grid-cols-2 lg:items-center">
      <div className="flex h-[70lvh] flex-col">
        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          {/* In normal flow, native lazy-loading works: only the first item is eager/high priority. */}
          <DeviceFrame
            project={project}
            current={current}
            fit="flow"
            priority={first}
            lazy={!first}
          />
        </div>
        <div className="flex h-12 shrink-0 items-center justify-center">
          <GalleryControls project={project} current={current} onChange={setCurrent} />
        </div>
      </div>
      <Details project={project} interactive />
    </li>
  );
};

const StaticList = () => (
  <section id="work" aria-label="Selected projects" className="mx-auto max-w-[1400px] px-6 py-24 md:px-12">
    <div className="heading flex items-center">
      <h2 className="text-center text-lg font-light tracking-tight text-white/80">Selected projects</h2>
    </div>

    <ol className="mt-12 flex flex-col gap-28">
      {PROJECTS.map((p, i) => (
        <StaticItem key={p.id} project={p} first={i === 0} />
      ))}
    </ol>
  </section>
);

const ProjectShowcase = () => {
  const reduceMotion = useReducedMotionSafe();
  return reduceMotion ? <StaticList /> : <ScrollStage />;
};

export default ProjectShowcase;