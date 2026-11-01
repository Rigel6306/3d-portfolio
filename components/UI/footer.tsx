"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
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
import ToothlessModel from "./toothlessModal2";

/* ───────────────────────── Edit your copy here ───────────────────────── */
const COPY = {
    name: "Chari",
    email: "charitha1@live.com",
    headline: ["Let's write the next chapter", "together."],
    body: "I'm open to freelance and full-time work building mobile and web apps. Tell me what you're making.",
    socials: [
        { label: "GitHub", href: "#" },
        { label: "LinkedIn", href: "#" },
    ],
    stack: "Next.js, three.js and Motion",
    /** Small silhouette that flies across the moon. Set to "" to remove. */
    dragon: "/paralax2/toothless.png",
};

/** Night-sky picture that sits behind every parallax layer. Put the file in your public folder. */
const BACKGROUND = {
    src: "/footer/thunderstorm-village.jpg",
    /** Which part of the picture stays visible when the screen is cropped (x y). */
    focus: "68% 40%",
};

/** How much scroll the closing scene gets, in large-viewport heights. */
const SCENE_HEIGHT = 300;

/* ───────────────────────────── Scenery data ───────────────────────────── */

/** Small seeded random generator, so the landscape is identical on server and client. */
const seeded = (seed: number) => {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const W = 1440;
const H = 400;

/** Mountain skyline by midpoint displacement: rough peaks that look natural. */
const ridgePath = (seed: number, base: number, amp: number, rough: number) => {
    const rnd = seeded(seed);
    const n = 256;
    const ys = new Array<number>(n + 1).fill(0);
    ys[0] = (rnd() - 0.5) * amp;
    ys[n] = (rnd() - 0.5) * amp;
    let step = n;
    let disp = amp;
    while (step > 1) {
        const half = step / 2;
        for (let i = half; i < n; i += step) {
            ys[i] = (ys[i - half]! + ys[i + half]!) / 2 + (rnd() - 0.5) * 2 * disp;
        }
        disp *= rough;
        step = half;
    }
    const pts = ys.map((y, i) => {
        const px = (i / n) * W;
        const py = Math.min(H - 4, Math.max(4, base + y));
        return `${px.toFixed(1)} ${py.toFixed(1)}`;
    });
    return `M0 ${H} L${pts.join(" L")} L${W} ${H} Z`;
};

/** Far to near. Far ridges are pale and soft, near ones are almost black. */
const RIDGES = [
    { seed: 7, base: 150, amp: 95, rough: 0.56, top: "#27324f", bottom: "#141c33", rise: "16%", mouse: 4 },
    { seed: 19, base: 205, amp: 85, rough: 0.54, top: "#1a2340", bottom: "#0d1428", rise: "34%", mouse: 8 },
    { seed: 31, base: 255, amp: 70, rough: 0.52, top: "#111830", bottom: "#080d1b", rise: "56%", mouse: 14 },
    { seed: 43, base: 305, amp: 50, rough: 0.5, top: "#090d1a", bottom: "#03050a", rise: "84%", mouse: 24 },
];

const STAR_W = 1440;
const STAR_H = 620;
const STARS = (() => {
    const rnd = seeded(2026);
    return Array.from({ length: 150 }, (_, i) => ({
        x: rnd() * STAR_W,
        y: rnd() * STAR_H * rnd() ** 0.6, // denser toward the top
        r: 0.45 + rnd() * rnd() * 1.5,
        o: 0.35 + rnd() * 0.65,
        g: i % 3, // three groups twinkle out of step
    }));
})();

/* ───────────────────────────── Small pieces ───────────────────────────── */

/** Shifts its content with the pointer to add depth, independent of the scroll motion inside. */
const Depth = ({
    mx, my, dx, dy = 0, className, children,
}: {
    mx: MotionValue<number>; my: MotionValue<number>; dx: number; dy?: number;
    className?: string; children: ReactNode;
}) => {
    const x = useTransform(mx, (v) => v * dx);
    const y = useTransform(my, (v) => v * dy);
    return (
        <motion.div className={className} style={{ x, y }}>
            {children}
        </motion.div>
    );
};

const Ridge = ({
    cfg, progress, mx, my, index,
}: {
    cfg: (typeof RIDGES)[number]; progress: MotionValue<number>;
    mx: MotionValue<number>; my: MotionValue<number>; index: number;
}) => {
    const id = useId().replace(/:/g, "");
    const d = useMemo(() => ridgePath(cfg.seed, cfg.base, cfg.amp, cfg.rough), [cfg]);
    const y = useTransform(progress, [0, 0.6], [cfg.rise, "0%"]);
    return (
        <Depth mx={mx} my={my} dx={-cfg.mouse} className="pointer-events-none absolute inset-x-[-3%] bottom-0 h-[72lvh]">
            <motion.svg
                aria-hidden="true"
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                className="h-full w-full"
                style={{ y, zIndex: index }}
            >
                <defs>
                    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor={cfg.top} />
                        <stop offset="1" stopColor={cfg.bottom} />
                    </linearGradient>
                </defs>
                <path d={d} fill={`url(#${id})`} />
            </motion.svg>
        </Depth>
    );
};

const SOCIAL_CLASS =
    "text-sm text-white/70 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

/* ───────────────────────────────── Scene ───────────────────────────────── */

const Scene = ({ progress }: { progress: MotionValue<number> }) => {
    const reduceMotion = useReducedMotion();
    const [shown, setShown] = useState(reduceMotion === true);
    const [copied, setCopied] = useState(false);
    const copyTimer = useRef(0);

    useMotionValueEvent(progress, "change", (v) => setShown(v > 0.65));
    useEffect(() => () => window.clearTimeout(copyTimer.current), []);

    // Pointer depth (skipped on touch screens and for reduced motion).
    const rawX = useMotionValue(0);
    const rawY = useMotionValue(0);
    const spring = { stiffness: 60, damping: 18, mass: 0.6 };
    const mx = useSpring(rawX, spring);
    const my = useSpring(rawY, spring);
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

    // Scroll-linked motion
    const starsOpacity = useTransform(progress, [0, 0.4], [0, 1]);
    const moonY = useTransform(progress, [0, 0.5], ["26lvh", "0lvh"]);
    const moonOpacity = useTransform(progress, [0.05, 0.3], [0, 1]);
    const moonScale = useTransform(progress, [0, 0.5], [0.85, 1]);
    const glowOpacity = useTransform(progress, [0.1, 0.6], [0, 1]);
    const mistX = useTransform(progress, [0, 1], ["-6%", "6%"]);
    const mistXReverse = useTransform(progress, [0, 1], ["5%", "-5%"]);

    // Backdrop picture: fades up out of the dark and slowly settles (zoom out + drift).
    // Scale always stays ahead of the drift, so the edges never show.
    const bgOpacity = useTransform(progress, [0, 0.3], [0, 1]);
    const bgScale = useTransform(progress, [0, 0.6], [1.2, 1.06]);
    const bgY = useTransform(progress, [0, 0.6], ["-4%", "0%"]);


    const flight = useTransform(progress, [0.06, 0.58], [0, 1]);


    const textOpacity = useTransform(progress, [0.5, 0.72], [0, 1]);
    const textY = useTransform(progress, [0.5, 0.72], [40, 0]);
    const textFilter = useTransform(progress, [0.5, 0.72], ["blur(10px)", "blur(0px)"]);
    const barOpacity = useTransform(progress, [0.68, 0.85], [0, 1]);


    const copy = async () => {
        try {
            await navigator.clipboard.writeText(COPY.email);
            setCopied(true);
            window.clearTimeout(copyTimer.current);
            copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
        } catch {
            window.location.href = `mailto:${COPY.email}`;
        }
    };

    const toStart = () =>
        document.getElementById("hero")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });

    return (
        <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(to_bottom,#04060b,#0a1224_55%,#16223c)]">
            {/* Backdrop picture: the bottom-most layer, everything else parallaxes in front of it.
                The gradient on the wrapper above is the fallback colour while it loads. */}
            <Depth mx={mx} my={my} dx={-3} dy={-2} className="pointer-events-none absolute inset-0">
                <motion.div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ opacity: bgOpacity, scale: bgScale, y: bgY }}
                >
                    <img
                        src={BACKGROUND.src}
                        alt=""
                        decoding="async"
                        draggable={false}
                        className="h-full w-full select-none object-cover"
                        style={{ objectPosition: BACKGROUND.focus }}
                    />
                </motion.div>
            </Depth>

            {/* Twinkle animation (switched off for reduced motion) */}
            <style>{`
        @keyframes footer-twinkle { 0%,100% { opacity: .25 } 50% { opacity: 1 } }
        .footer-stars { animation: footer-twinkle 4s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .footer-stars { animation: none } }
      `}</style>

            {/* Stars */}
            <Depth mx={mx} my={my} dx={-6} dy={-4} className="pointer-events-none absolute inset-0">
                <motion.svg
                    aria-hidden="true"
                    viewBox={`0 0 ${STAR_W} ${STAR_H}`}
                    preserveAspectRatio="xMidYMin slice"
                    className="absolute inset-0 h-full w-full"
                    style={{ opacity: starsOpacity }}
                >
                    {[0, 1, 2].map((g) => (
                        <g
                            key={g}
                            className="footer-stars"
                            style={{ animationDelay: `${g * 1.3}s`, animationDuration: `${3.5 + g}s` }}
                        >
                            {STARS.filter((s) => s.g === g).map((s, i) => (
                                <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e6eeff" fillOpacity={s.o} />
                            ))}
                        </g>
                    ))}
                </motion.svg>
            </Depth>

            {/* Moonlight haze at the horizon */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(ellipse_at_70%_100%,rgba(110,140,220,0.22),transparent_65%)]"
                style={{ opacity: glowOpacity }}
            />

            {/* Moon (the dragon flies across it) */}
            <Depth mx={mx} my={my} dx={-10} dy={-6} className="pointer-events-none absolute inset-0">
                <motion.div
                    aria-hidden="true"
                    className="absolute right-[14%] top-[13%] aspect-square w-[clamp(90px,11vw,190px)] rounded-full bg-[radial-gradient(circle_at_35%_30%,#fbfcff,#dfe6f2_55%,#aeb9cc)] shadow-[0_0_80px_20px_rgba(190,210,255,0.25),0_0_220px_60px_rgba(120,150,230,0.15)]"
                    style={{ y: moonY, opacity: moonOpacity, scale: moonScale }}
                >
                    <span className="absolute left-[58%] top-[22%] h-[16%] w-[16%] rounded-full bg-slate-900/10" />
                    <span className="absolute left-[24%] top-[52%] h-[22%] w-[22%] rounded-full bg-slate-900/10" />
                    <span className="absolute left-[62%] top-[62%] h-[10%] w-[10%] rounded-full bg-slate-900/10" />


                </motion.div>
            </Depth>

            {/* Drifting mist between the sky and the mountains */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute left-[-10%] top-[40%] h-[22lvh] w-[80%] bg-[radial-gradient(ellipse_at_center,rgba(150,170,215,0.13),transparent_70%)] blur-xl"
                style={{ x: mistX }}
            />
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute right-[-10%] top-[52%] h-[20lvh] w-[70%] bg-[radial-gradient(ellipse_at_center,rgba(150,170,215,0.1),transparent_70%)] blur-xl"
                style={{ x: mistXReverse }}
            />

            {/* Mountains, far to near, each rising at its own speed */}
            {RIDGES.map((cfg, i) => (
                <Ridge key={cfg.seed} cfg={cfg} progress={progress} mx={mx} my={my} index={i} />
            ))}

            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <ToothlessModel mode="flyby" flight={flight} src="/paralax2/toothless.glb" />
            </div>

            {/* Seam with the section above */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#04060b] to-transparent"
            />

            {/* Closing message */}
            <motion.div
                className="absolute inset-x-0 bottom-24 px-6 md:bottom-28 md:px-12 lg:px-[clamp(3rem,5vw,8rem)]"
                style={{
                    opacity: textOpacity,
                    y: textY,
                    filter: textFilter,
                    pointerEvents: shown ? "auto" : "none",
                }}
                aria-hidden={!shown}
            >
                <div className="mx-auto max-w-[2000px]">
                    <h2 className="max-w-4xl text-[clamp(2.25rem,5vw,5.5rem)] font-light leading-[1.06] tracking-tight text-white [text-shadow:0_1px_28px_rgba(0,0,0,0.45)]">
                        {COPY.headline[0]}
                        <span className="block text-white/55">{COPY.headline[1]}</span>
                    </h2>

                    <p className="mt-6 max-w-md text-base leading-relaxed text-white/75 xl:max-w-lg xl:text-lg">
                        {COPY.body}
                    </p>

                    <a
                        href={`mailto:${COPY.email}`}
                        tabIndex={shown ? 0 : -1}
                        className="mt-8 inline-block break-all border-b border-white/30 pb-1 text-[clamp(1.25rem,2.6vw,2.5rem)] font-light tracking-tight text-white transition-colors hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                        {COPY.email}
                    </a>

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <a
                            href={`mailto:${COPY.email}`}
                            tabIndex={shown ? 0 : -1}
                            className="rounded-full bg-white px-6 py-3 text-sm font-medium text-neutral-950 transition-colors hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                            Send an email
                        </a>
                        <button
                            type="button"
                            onClick={copy}
                            tabIndex={shown ? 0 : -1}
                            className="rounded-full border border-white/30 bg-white/5 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                            {copied ? "Copied" : "Copy email"}
                        </button>
                        <span aria-live="polite" className="sr-only">
                            {copied ? "Email address copied" : ""}
                        </span>

                        <ul className="flex items-center gap-5 sm:ml-4">
                            {COPY.socials.map((s) => (
                                <li key={s.label}>
                                    <a href={s.href} tabIndex={shown ? 0 : -1} className={SOCIAL_CLASS}>
                                        {s.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </motion.div>

            {/* Footer bar */}
            <motion.footer
                className="absolute inset-x-0 bottom-0 px-6 pb-5 md:px-12 lg:px-[clamp(3rem,5vw,8rem)]"
                style={{ opacity: barOpacity, pointerEvents: shown ? "auto" : "none" }}
            >
                <div className="mx-auto flex max-w-[2000px] flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm text-white/50">
                    <p>
                        © {new Date().getFullYear()} {COPY.name}. Built with {COPY.stack}.
                    </p>
                    <button
                        type="button"
                        onClick={toStart}
                        tabIndex={shown ? 0 : -1}
                        className="text-white/70 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                        Back to the beginning
                    </button>
                </div>
            </motion.footer>
        </div>
    );
};

/* ─────────────────────────────── Entry points ─────────────────────────────── */

const ScrollEnding = () => {
    const ref = useRef<HTMLElement | null>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
    return (
        <section
            ref={ref}
            id="contact"
            aria-label="Contact"
            className="relative"
            style={{ height: `${SCENE_HEIGHT}lvh` }}
        >
            <div className="sticky top-0 h-lvh overflow-hidden">
                <Scene progress={scrollYProgress} />
            </div>
        </section>
    );
};

/** Reduced motion: the finished scene, with no scroll effects. */
const StaticEnding = () => {
    const done = useMotionValue(1);
    return (
        <section id="contact" aria-label="Contact" className="relative h-lvh min-h-[640px] overflow-hidden">
            <Scene progress={done} />
        </section>
    );
};

const Footer = () => {
    const reduceMotion = useReducedMotion();
    return reduceMotion ? <StaticEnding /> : <ScrollEnding />;
};

export default Footer;