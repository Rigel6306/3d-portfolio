import { memo, useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

/* -------------------------------------------------------------------------- */
/*  The credits                                                               */
/*  `role` is the film credit, `group` is the real category it stands for.    */
/* -------------------------------------------------------------------------- */

type Credit = { role: string; group: string; accent: string; names: string[] };

const CREDITS: Credit[] = [
  {
    role: "Starring",
    group: "Frontend",
    accent: "#5b8cff",
    names: ["JavaScript ES6+","React", "Next.js", "TypeScript", "Tailwind CSS"],
  },
  {
    role: "Continuity",
    group: "State Management",
    accent: "#38bdf8",
    names: ["Redux Toolkit", "Context API"],
  },
  {
    role: "Visual Effects",
    group: "UI & Motion",
    accent: "#c084fc",
    names: ["Framer Motion", "GSAP", "Three.js", "Responsive Design", "Glassmorphism"],
  },
  {
    role: "On Location",
    group: "Mobile",
    accent: "#34d399",
    names: ["React Native", "Expo", "Native Device APIs", "Native Modules"],
  },
  {
    role: "Production",
    group: "Backend",
    accent: "#fbbf24",
    names: ["Node.js", "Express.js", "REST APIs", "Authentication"],
  },
  {
    role: "Archives",
    group: "Database",
    accent: "#22d3ee",
    names: ["MongoDB", "SQL", "Redis", "Firebase Firestore"],
  },
  {
    role: "Stunts & Safety",
    group: "Security",
    accent: "#fb7185",
    names: ["JWT","AES/RSA Encryption", "MFA", "Auth0","OAuth", "Secure API Design"],
  },
  {
    role: "Distribution",
    group: "DevOps",
    accent: "#a3e635",
    names: ["Git", "GitHub", "Docker", "GitHub Actions", "CI/CD"],
  },
];

/** How much longer the credits take to roll than a normal page scroll would (1 = same speed). */
const SLOWNESS = 1.25;
/** Fake runtime shown on the timecode, in seconds. */
const RUNTIME = 210;

const nameClass =
  "origin-center text-[length:clamp(1.25rem,min(5.5lvh,7vw),3.25rem)] font-light uppercase leading-[1.15] tracking-[0.08em] text-white md:origin-left";

const btnPrimary =
  "inline-block rounded-full bg-white px-6 py-3 text-sm font-medium text-neutral-950 transition-colors hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/* -------------------------------------------------------------------------- */
/*  Atmosphere                                                                */
/* -------------------------------------------------------------------------- */

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.55'/></svg>\")";

// Deterministic so server and client markup match.
const DUST = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  top: 30 + ((i * 53) % 70),
  size: 1 + (i % 3),
  dur: 14 + ((i * 7) % 18),
  delay: -((i * 5) % 20),
  o: 0.15 + ((i * 13) % 5) * 0.07,
  dx: ((i * 17) % 40) - 20,
}));

const KEYFRAMES = `
@keyframes credits-grain {
  0% { transform: translate(0,0) } 20% { transform: translate(-3%,2%) }
  40% { transform: translate(2%,-3%) } 60% { transform: translate(-2%,-1%) }
  80% { transform: translate(3%,3%) } 100% { transform: translate(0,0) }
}
@keyframes credits-drift {
  0% { transform: translate3d(0,0,0); opacity: 0 }
  15%, 85% { opacity: var(--o) }
  100% { transform: translate3d(var(--dx),-140px,0); opacity: 0 }
}
@keyframes credits-hint {
  0%, 100% { transform: translateY(0); opacity: .35 }
  50% { transform: translateY(6px); opacity: 1 }
}
`;

const Dust = memo(() => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0">
    {DUST.map((d, i) => (
      <span
        key={i}
        className="absolute rounded-full bg-white"
        style={
          {
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            animation: `credits-drift ${d.dur}s linear ${d.delay}s infinite`,
            "--o": d.o,
            "--dx": `${d.dx}px`,
            opacity: 0,
          } as CSSProperties
        }
      />
    ))}
  </div>
));

Dust.displayName = "Dust";

/* -------------------------------------------------------------------------- */
/*  Credit blocks (shared by the rolling and the static version)              */
/* -------------------------------------------------------------------------- */

const CreditGroup = memo(({ credit, index }: { credit: Credit; index: number }) => (
  <div
    data-group={index}
    className="grid gap-4 py-[6lvh] text-center md:grid-cols-2 md:gap-x-14 md:gap-y-0 md:py-[7lvh]"
  >
    <dt data-credit className="opacity-30 md:origin-right md:text-right">
      <span className="block text-[0.7rem] uppercase tracking-[0.35em] text-white/55 md:text-xs">
        {credit.role}
      </span>
      <span
        className="mt-2 block text-sm uppercase tracking-[0.2em] md:text-base"
        style={{ color: credit.accent }}
      >
        {credit.group}
      </span>
    </dt>
    <dd>
      <ul className="flex flex-col gap-3 md:gap-4 md:text-left">
        {credit.names.map((name) => (
          <li key={name} data-credit className={`${nameClass} opacity-30`}>
            {name}
          </li>
        ))}
      </ul>
    </dd>
  </div>
));

CreditGroup.displayName = "CreditGroup";

const Title = () => (
  <div className="flex min-h-lvh flex-col items-center justify-center text-center">
    <p data-credit className="text-[0.7rem] uppercase tracking-[0.5em] text-white/50 opacity-30 md:text-xs">
      Charitha production
    </p>
    <h2
      data-credit
      className="mt-5 text-[length:clamp(2.75rem,min(12lvh,12vw),7rem)] font-extralight uppercase leading-none tracking-[0.15em] text-white opacity-30"
    >
      The Stack
    </h2>
    <p data-credit className="mt-6 max-w-md text-sm leading-relaxed text-white/60 opacity-30 md:text-base">
      Starring the technologies behind the work.
    </p>
    <span
      aria-hidden="true"
      className="mt-12 text-xs uppercase tracking-[0.4em] text-white/50"
      style={{ animation: "credits-hint 2.4s ease-in-out infinite" }}
    >
      Scroll ↓
    </span>
  </div>
);

const Closing = ({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) => (
  <div className="flex min-h-lvh flex-col items-center justify-center text-center">
    <div data-credit className="opacity-30">
      <p className="text-[0.7rem] uppercase tracking-[0.5em] text-white/50 md:text-xs">
        Thanks for watching
      </p>
      <p className="mt-5 max-w-3xl text-balance text-[length:clamp(1.75rem,min(6lvh,7vw),3.5rem)] font-extralight leading-[1.1] tracking-tight text-white">
        Every story needs a next chapter.
      </p>
    </div>
    <a href={ctaHref} className={`${btnPrimary} mt-10`}>
      {ctaLabel}
    </a>
  </div>
);

/* -------------------------------------------------------------------------- */
/*  The rolling stage                                                         */
/* -------------------------------------------------------------------------- */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const fmt = (n: number) => String(n).padStart(2, "0");

type Layout = { h: number; els: HTMLElement[]; centers: number[]; groupCenters: number[] };

const Stage = ({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const tcRef = useRef<HTMLSpanElement | null>(null);
  const layout = useRef<Layout>({ h: 0, els: [], centers: [], groupCenters: [] });
  const activeRef = useRef(-1);

  const [sectionH, setSectionH] = useState<number | null>(null);
  const [activeGroup, setActiveGroup] = useState(-1);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  // The whole credit roll is a single transform: content slides up by (its height - one screen).
  const y = useTransform(scrollYProgress, (p) => {
    if (typeof window === "undefined") return 0;
    return -p * Math.max(0, layout.current.h - window.innerHeight);
  });

  // Letterbox bars slide in over the first few percent.
  const barScale = useTransform(scrollYProgress, [0, 0.04], [0, 1]);

  /** Names in the middle of the screen are bright and full-size; the rest recede. */
  const apply = useCallback((yPx: number) => {
    const { els, centers, groupCenters } = layout.current;
    const vh = window.innerHeight;
    const mid = vh / 2;
    const span = vh * 0.42;

    for (let i = 0; i < els.length; i++) {
      const t = clamp01(1 - Math.abs(centers[i] + yPx - mid) / span);
      const f = t * t * (3 - 2 * t);
      const el = els[i];
      el.style.opacity = String(0.22 + 0.78 * f);
      el.style.transform = `scale(${0.94 + 0.06 * f})`;
    }

    let best = -1;
    let bestD = vh * 0.9;
    for (let i = 0; i < groupCenters.length; i++) {
      const d = Math.abs(groupCenters[i] + yPx - mid);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best !== activeRef.current) {
      activeRef.current = best;
      setActiveGroup(best);
    }
  }, []);

  const measure = useCallback(() => {
    const content = contentRef.current;
    if (!content) return;
    const top = content.getBoundingClientRect().top;
    const center = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return r.top - top + r.height / 2; // centre is unaffected by the scale we apply
    };
    const els = Array.from(content.querySelectorAll<HTMLElement>("[data-credit]"));
    const groups = Array.from(content.querySelectorAll<HTMLElement>("[data-group]"));
    layout.current = {
      h: content.offsetHeight,
      els,
      centers: els.map(center),
      groupCenters: groups.map(center),
    };
    const vh = window.innerHeight;
    setSectionH(vh + Math.max(0, layout.current.h - vh) * SLOWNESS);
    apply(y.get());
  }, [apply, y]);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useMotionValueEvent(y, "change", apply);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const el = tcRef.current;
    if (!el) return;
    const s = Math.round(clamp01(p) * RUNTIME);
    el.textContent = `${fmt(Math.floor(s / 60))}:${fmt(s % 60)} / ${fmt(Math.floor(RUNTIME / 60))}:${fmt(RUNTIME % 60)}`;
  });

  const skip = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + el.offsetHeight - window.innerHeight, behavior: "instant" });
  }, []);

  const accent = CREDITS[activeGroup]?.accent ?? "#ffffff";
  const fade = "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)";

  return (
    <section
      ref={sectionRef}
      id="stack"
      aria-label="Tech stack"
      className="relative w-screen bg-black"
      style={{ height: sectionH ?? "900lvh" }}
    >
      <style>{KEYFRAMES}</style>

      <div className="sticky top-0 h-lvh overflow-hidden">
        {/* light that changes colour with whoever is in the spotlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[65lvh] w-[65lvh] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.18] blur-[120px] transition-colors duration-1000"
          style={{ background: accent }}
        />
        <Dust />

        {/* the roll */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ maskImage: fade, WebkitMaskImage: fade }}
        >
          <motion.div
            ref={contentRef}
            style={{ y }}
            className="relative mx-auto max-w-5xl px-6 will-change-transform"
          >
            <Title />
            <dl>
              {CREDITS.map((c, i) => (
                <CreditGroup key={c.group} credit={c} index={i} />
              ))}
            </dl>
            <Closing ctaHref={ctaHref} ctaLabel={ctaLabel} />
          </motion.div>
        </div>

        {/* film grain, vignette */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -inset-[10%] opacity-[0.07] mix-blend-overlay"
            style={{ backgroundImage: GRAIN, animation: "credits-grain 0.9s steps(5) infinite" }}
          />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.75)_100%)]"
        />

        {/* letterbox bars */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[4lvh] origin-top bg-black md:h-[7lvh]"
          style={{ scaleY: barScale }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[4lvh] origin-bottom bg-black md:h-[7lvh]"
          style={{ scaleY: barScale }}
        />

        {/* timecode + skip, sitting on the bars */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex h-[4lvh] items-center justify-between px-5 md:h-[7lvh] md:px-10">
          <span
            ref={tcRef}
            aria-hidden="true"
            className="font-mono text-[0.65rem] tracking-widest text-white/45 md:text-xs"
          >
            00:00 / {fmt(Math.floor(RUNTIME / 60))}:{fmt(RUNTIME % 60)}
          </span>
          <button
            type="button"
            onClick={skip}
            className="pointer-events-auto cursor-pointer text-[0.65rem] uppercase tracking-[0.3em] text-white/45 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:text-xs"
          >
            Skip credits ↓
          </button>
        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*  Reduced motion: same credits, no rolling                                  */
/* -------------------------------------------------------------------------- */

const StaticList = ({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) => (
  <section id="stack" aria-label="Tech stack" className="bg-black px-6 py-24">
    <div className="mx-auto max-w-5xl">
      <h2 className="text-center text-[length:clamp(2.75rem,12vw,6rem)] font-extralight uppercase tracking-[0.15em] text-white">
        The Stack
      </h2>
      <dl className="mt-12 [&_[data-credit]]:opacity-100">
        {CREDITS.map((c, i) => (
          <CreditGroup key={c.group} credit={c} index={i} />
        ))}
      </dl>
      <div className="mt-16 text-center">
        <p className="text-2xl font-extralight text-white">Every story needs a next chapter.</p>
        <a href={ctaHref} className={`${btnPrimary} mt-8`}>
          {ctaLabel}
        </a>
      </div>
    </div>
  </section>
);

const TechStory = ({
  ctaHref = "#contact",
  ctaLabel = "Let's build something together",
}: {
  ctaHref?: string;
  ctaLabel?: string;
}) => {
  const reduceMotion = useReducedMotion();
  return reduceMotion ? (
    <StaticList ctaHref={ctaHref} ctaLabel={ctaLabel} />
  ) : (
    <Stage ctaHref={ctaHref} ctaLabel={ctaLabel} />
  );
};

export default TechStory;