"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

type Project = {
  id: string;
  title: string;
  kind: string;
  description: string;
  highlights: string[];
  stack: string[];
  device: "web" | "mobile";
  image: string;
  accent: string;
  host?: string;
  href?: string;
  repo?: string;
};

const PROJECTS: Project[] = [
  {
    id: "superbody",
    title: "Superbody",
    kind: "Mobile app",
    description:
      "A fitness app built with React Native and Expo, designed to feel fast and native on both platforms.",
    highlights: [
      "Custom design system and reusable component library",
      "One TypeScript codebase for iOS and Android",
    ],
    stack: ["React Native", "Expo", "TypeScript"],
    device: "mobile",
    image: "/projects/fitness.png",
    accent: "#5b8cff",
    href: "#",
  },
  {
    id: "portfolio",
    title: "3d Showcase",
    kind: "Website",
    description:
      "A scroll-driven site with a WebGL fluid simulation, layered parallax and a 3D objects .",
    highlights: [
      "Real-time fluid simulation written in GLSL",
      "Scroll-linked animation on motion values, not React state",
    ],
    stack: ["Next.js", "three.js", "Motion", "TypeScript"],
    device: "web",
    image: "/projects/portfolio.jpg",
    accent: "#34d399",
    host: "yourname.dev",
    href: "#",
    repo: "#",
  },
  {
    id: "project-three",
    title: "Bypaser",
    kind: "Web app",
    description: "Automated payload generator",
    highlights: ["Updated Payloads", "One Click generation"],
    stack: ["Next.js", "TypeScript"],
    device: "web",
    image: "/projects/",
    accent: "#c084fc",
    host: "project.app",
    href: "#",
  },

   {
    id: "project-three",
    title: "Bypaser",
    kind: "Web app",
    description: "Automated payload generator",
    highlights: ["Updated Payloads", "One Click generation"],
    stack: ["Next.js", "TypeScript"],
    device: "web",
    image: "/projects/",
    accent: "#c084fc",
    host: "project.app",
    href: "#",
  },
];

const SCROLL_PER_PROJECT = 140;

const btnPrimary =
  "rounded-full bg-white px-6 py-3 text-sm font-medium text-neutral-950 transition-colors hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const btnSecondary =
  "rounded-full border border-white/30 bg-white/5 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const Details = memo(({ project, interactive }: { project: Project; interactive: boolean }) => (
  <div className="max-w-xl">
    <p className="text-sm text-white/55">{project.kind}</p>
    <h3 className="mt-2 text-4xl font-light leading-[1.08] tracking-tight text-white md:text-6xl">
      {project.title}
    </h3>
    <p className="mt-5 max-w-md text-base leading-relaxed text-white/75 max-lg:line-clamp-3">
      {project.description}
    </p>

    <ul className="mt-6 hidden flex-col gap-3 md:flex">
      {project.highlights.map((h) => (
        <li key={h} className="border-l border-white/15 pl-4 text-sm leading-relaxed text-white/70">
          {h}
        </li>
      ))}
    </ul>

    <ul aria-label="Built with" className="mt-6 flex flex-wrap gap-2">
      {project.stack.map((s) => (
        <li
          key={s}
          className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm text-white/90 backdrop-blur-md"
        >
          {s}
        </li>
      ))}
    </ul>

    {(project.href || project.repo) && (
      <div className="mt-8 flex flex-wrap gap-3">
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

const DeviceFrame = memo(({ project }: { project: Project }) => {
  const screen = {
    backgroundImage: `url(${project.image}), linear-gradient(135deg, ${project.accent}66, #0b0d12 70%)`,
    backgroundSize: "cover",
    backgroundPosition: "top center",
  };

  if (project.device === "mobile") {
    return (
      <div className="relative aspect-[9/19] h-[88%] rounded-[2.6rem] border border-white/15 bg-neutral-950 p-2 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
        <div className="relative h-full w-full overflow-hidden rounded-[2.1rem]" style={screen}>
          <span className="absolute left-1/2 top-2.5 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-[min(100%,860px,calc(60lvh*1.6))] overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
      <div className="flex h-9 items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        {project.host && (
          <span className="ml-3 truncate rounded-md bg-white/[0.06] px-3 py-1 text-xs text-white/50">
            {project.host}
          </span>
        )}
      </div>
      <div className="aspect-[16/10] w-full" style={screen} />
    </div>
  );
});

DeviceFrame.displayName = "DeviceFrame";

const useSlot = (p: MotionValue<number>, i: number, n: number) => {
  const s = 1 / n;
  const c = (i + 0.5) * s;
  const first = i === 0;
  const last = i === n - 1;

  const cut = <T,>(inputs: number[], outputs: T[]): [number[], T[]] =>
    first ? [inputs.slice(2), outputs.slice(2)] : last ? [inputs.slice(0, 2), outputs.slice(0, 2)] : [inputs, outputs];

  const fade = [c - 0.9 * s, c - 0.35 * s, c + 0.25 * s, c + 0.7 * s];
  const fly = [c - s, c - 0.2 * s, c + 0.2 * s, c + s];
  const text = [c - 0.5 * s, c - 0.2 * s, c + 0.2 * s, c + 0.5 * s];

  const opacity = useTransform(p, ...cut(fade, [0, 1, 1, 0]));
  const scale = useTransform(p, ...cut(fly, [0.6, 1, 1, 1.45]));
  const y = useTransform(p, ...cut(fly, ["8lvh", "0lvh", "0lvh", "-8lvh"]));
  const blur = useTransform(p, ...cut(fade, [10, 0, 0, 12]));
  const filter = useTransform(blur, (v) => `blur(${v}px)`);

  const textOpacity = useTransform(p, ...cut(text, [0, 1, 1, 0]));
  const textY = useTransform(p, ...cut(text, [40, 0, 0, -40]));

  return { opacity, scale, y, filter, textOpacity, textY };
};

const SceneVisual = memo(({
  project, index, total, progress,
}: { project: Project; index: number; total: number; progress: MotionValue<number> }) => {
  const { opacity, scale, y, filter } = useSlot(progress, index, total);
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{ opacity, scale, y, filter, zIndex: total - index, willChange: "transform, opacity, filter" }}
    >
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-35 blur-[90px]"
        style={{ background: project.accent }}
      />
      <DeviceFrame project={project} />
    </motion.div>
  );
});

SceneVisual.displayName = "SceneVisual";

const SceneText = memo(({
  project, index, total, progress, interactive,
}: { project: Project; index: number; total: number; progress: MotionValue<number>; interactive: boolean }) => {
  const { textOpacity, textY } = useSlot(progress, index, total);
  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center"
      style={{ opacity: textOpacity, y: textY, pointerEvents: interactive ? "auto" : "none" }}
      aria-hidden={!interactive}
    >
      <Details project={project} interactive={interactive} />
    </motion.div>
  );
});

SceneText.displayName = "SceneText";

const RailItem = memo(({
  project, index, total, progress, active, onSelect,
}: {
  project: Project; index: number; total: number; progress: MotionValue<number>;
  active: boolean; onSelect: (index: number) => void;
}) => {
  const fill = useTransform(progress, [index / total, (index + 1) / total], [0, 1]);
  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      aria-label={`Go to ${project.title}`}
      aria-current={active}
      className="group pointer-events-auto flex flex-col items-start gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
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
});

RailItem.displayName = "RailItem";

const ScrollStage = () => {
  const ref = useRef<HTMLElement | null>(null);
  const n = PROJECTS.length;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Prevent heavy React state recalculations on scroll by utilizing derived active tracking
  const [active, setActive] = useState(0);

  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      const currentIdx = Math.min(n - 1, Math.max(0, Math.floor(v * n)));
      setActive((prev) => (prev !== currentIdx ? currentIdx : prev));
    });
  }, [scrollYProgress, n]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), { stiffness: 120, damping: 20 });
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), { stiffness: 120, damping: 20 });

  const goTo = useCallback((i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + ((i + 0.5) / n) * range, behavior: "smooth" });
  }, [n]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }, [mx, my]);

  const handlePointerLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  return (
    <section
      ref={ref}
      id="work"
      aria-label="Selected projects"
      className="relative w-screen"
      style={{ height: `${n * SCROLL_PER_PROJECT}lvh` }}
    >
      <div
        className="sticky top-0 h-lvh overflow-hidden"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_45%,rgba(255,255,255,0.05),transparent_10%)]"
        />

        <h2 className="mt-10 z-10 font-semibold text-4xl font-light tracking-wide uppercase text-center text-white/80 md:left-12">
         My Work
        </h2>

        <div className="relative mx-auto grid h-full max-w-[1400px] grid-rows-[1fr_1fr] gap-4 px-6 pb-24 pt-24 md:px-12 lg:grid-cols-12 lg:grid-rows-1 lg:gap-10">
          <div className="relative order-2 lg:order-1 lg:col-span-5">
            {PROJECTS.map((p, i) => (
              <SceneText
                key={p.id}
                project={p}
                index={i}
                total={n}
                progress={scrollYProgress}
                interactive={active === i}
              />
            ))}
          </div>

          <motion.div
            className="relative order-1 lg:order-2 lg:col-span-7"
            style={{ rotateX, rotateY, transformPerspective: 1200 }}
          >
            {PROJECTS.map((p, i) => (
              <SceneVisual key={p.id} project={p} index={i} total={n} progress={scrollYProgress} />
            ))}
          </motion.div>
        </div>

        <nav
          aria-label="Projects"
          className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center gap-4 px-6 md:gap-8"
        >
          {PROJECTS.map((p, i) => (
            <RailItem
              key={p.id}
              project={p}
              index={i}
              total={n}
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

const StaticList = () => (
  <section id="work" aria-label="Selected projects" className="mx-auto max-w-[1400px]  px-6 py-24 md:px-12">
    <div className="heading flex items-center">
<h2 className="text-lg font-light tracking-tight text-white/80 text-center">Selected projects</h2>
    </div>
    
    <ol className="mt-12 flex flex-col gap-28">
      {PROJECTS.map((p) => (
        <li key={p.id} className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative flex h-[60lvh] items-center justify-center">
            <DeviceFrame project={p} />
          </div>
          <Details project={p} interactive />
        </li>
      ))}
    </ol>
  </section>
);

const ProjectShowcase = () => {
  const reduceMotion = useReducedMotion();
  return reduceMotion ? <StaticList /> : <ScrollStage />;
};

export default ProjectShowcase;