"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import {
    easeInOut,
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
import Lightning from "./lightning";
import Rain from "./rain";

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
    /** The closing "movie ending" card. */
    thanks: {
        title: "Thank you",
        subtitle: "for scrolling all the way down.",
        credit: "The End",
    },
    /** Small silhouette that flies across the sky. Set to "" to remove. */
    dragon: "/paralax2/toothless.png",
};

/** Storm picture that sits behind every parallax layer. Put the file in your public folder. */
const BACKGROUND = {
    src: "/footer/thunderstorm-village.jpg",
    /** Which part of the picture stays visible when the screen is cropped (x y). */
    focus: "62% 40%",
};

/** Where the main lightning bolt sits in the picture (percent of the screen). Used for glow + flashes. */
const BOLT = { x: 62, y: 38 };

/** How much scroll the whole scene gets, in large-viewport heights (the last third is the movie ending). */
const SCENE_HEIGHT = 400;

/**
 * Scroll timeline (0 to 1 over the whole section):
 *   0 → MAIN_END   the parallax scene builds up and the contact message appears
 *   then           contact fades out, "Thank you" appears, black bars close from top and bottom
 */
const MAIN_END = 0.67;

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

/**
 * Far to near. The far ridge copies the hazy blue-violet mountains in the photo
 * (slightly see-through so the picture shows through), the near ones sink into
 * the dark indigo meadow at the bottom of the photo.
 */
const RIDGES = [
    { seed: 7, base: 170, amp: 70, rough: 0.55, top: "#51459a", bottom: "#2b2560", rise: "14%", mouse: 4, opacity: 0.8 },
    { seed: 19, base: 215, amp: 62, rough: 0.54, top: "#322b6c", bottom: "#1b1747", rise: "26%", mouse: 8, opacity: 0.92 },
    { seed: 31, base: 265, amp: 50, rough: 0.52, top: "#1b1846", bottom: "#0e0c2a", rise: "40%", mouse: 14, opacity: 1 },
    { seed: 43, base: 320, amp: 36, rough: 0.5, top: "#0c0b22", bottom: "#05050f", rise: "58%", mouse: 24, opacity: 1 },
];

/** A few stars, only used in the small clear patch of sky at the top left of the photo. */
const STAR_W = 1440;
const STAR_H = 620;
const STARS = (() => {
    const rnd = seeded(2026);
    return Array.from({ length: 70 }, (_, i) => ({
        x: rnd() * STAR_W * 0.5,
        y: rnd() * STAR_H * 0.45,
        r: 0.45 + rnd() * rnd() * 1.4,
        o: 0.35 + rnd() * 0.6,
        g: i % 3,
    }));
})();

/** Pine-tree silhouettes along the bottom, thicker at the edges and sparse in the middle. */
const TREE_W = 1240;
const TREE_H = 560;
const treePath = (seed: number, hMin: number, hRange: number, density: number) => {
    const rnd = seeded(seed);
    let d = `M-20 ${TREE_H - 8} H${TREE_W + 20} V${TREE_H} H-20 Z`;
    const base = TREE_H - 6;
    for (let x = -20; x < TREE_W + 20; x += 12 + rnd() * 22) {
        const e = Math.min(x, TREE_W - x) / (TREE_W / 2); // 0 at the edges, 1 in the middle
        if (rnd() > density - e * 0.8) continue;
        const h = (hMin + rnd() * hRange) * (1.15 - e * 0.55);
        const w = h * 0.32;
        for (let i = 0; i < 3; i++) {
            const half = w * (0.5 - i * 0.13);
            const bottomY = base - h * 0.28 * i;
            const apexY = base - h * (0.5 + 0.25 * i);
            d += ` M${(x - half).toFixed(1)} ${bottomY.toFixed(1)} L${x.toFixed(1)} ${apexY.toFixed(1)} L${(x + half).toFixed(1)} ${bottomY.toFixed(1)} Z`;
        }
    }
    return d;
};
const TREES_BACK = treePath(91, 50, 70, 0.9);
const TREES_FRONT = treePath(113, 70, 110, 0.85);

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
        <Depth mx={mx} my={my} dx={-cfg.mouse} className="pointer-events-none absolute inset-x-[-3%] bottom-0 h-[38lvh]">
            <motion.svg
                aria-hidden="true"
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                className="h-full w-full"
                style={{ y, zIndex: index, opacity: cfg.opacity }}
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

const Trees = ({
    d, fill, progress, mx, my, dx, rise, height,
}: {
    d: string; fill: string; progress: MotionValue<number>;
    mx: MotionValue<number>; my: MotionValue<number>; dx: number; rise: string; height: string;
}) => {
    const y = useTransform(progress, [0.05, 0.65], [rise, "0%"]);
    return (
        <Depth mx={mx} my={my} dx={-dx} className={`pointer-events-none absolute inset-x-[-4%] bottom-0 ${height}`}>
            <motion.svg
                aria-hidden="true"
                viewBox={`0 0 ${TREE_W} ${TREE_H}`}
                preserveAspectRatio="xMidYMax slice"
                className="h-full w-full"
                style={{ y }}
            >
                <path d={d} fill={fill} />
            </motion.svg>
        </Depth>
    );
};

const SOCIAL_CLASS =
    "text-sm text-white/70 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

/* ───────────────────────────────── Scene ───────────────────────────────── */

/** `progress` is the scroll position of the whole section, 0 to 1. */
const Scene = ({ progress }: { progress: MotionValue<number> }) => {
    const reduceMotion = useReducedMotion();
    const [shown, setShown] = useState(reduceMotion === true);
    const [ending, setEnding] = useState(false);
    const [copied, setCopied] = useState(false);
    const copyTimer = useRef(0);

    // Contact content is clickable only while it is on screen (before it fades out for the ending).
    useMotionValueEvent(progress, "change", (v) => {
        setShown(v > MAIN_END * 0.65 && v < 0.8);
        setEnding(v >= 0.79);
    });
    useEffect(() => () => window.clearTimeout(copyTimer.current), []);

    // The parallax build-up runs on its own 0 to 1 clock, finished when the ending begins.
    const main = useTransform(progress, [0, MAIN_END], [0, 1], { clamp: true });

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

    // Scene motion (all driven by the build-up clock)
    const starsOpacity = useTransform(main, [0, 0.4], [0, 0.8]);
    const stormY = useTransform(main, [0, 0.5], ["18lvh", "0lvh"]);
    const stormOpacity = useTransform(main, [0.05, 0.35], [0, 1]);
    const stormScale = useTransform(main, [0, 0.5], [0.8, 1]);
    const moonY = useTransform(main, [0, 0.5], ["26lvh", "0lvh"]);
    const moonOpacity = useTransform(main, [0.05, 0.3], [0, 1]);
    const moonScale = useTransform(main, [0, 0.5], [0.85, 1]);
    const glowOpacity = useTransform(main, [0.1, 0.6], [0, 1]);
    const mistX = useTransform(main, [0, 1], ["-6%", "6%"]);
    const mistXReverse = useTransform(main, [0, 1], ["5%", "-5%"]);
    const horizonMist = useTransform(main, [0.2, 0.7], [0, 1]);

    // Sound for the Lightning and Rain components: fades in with the scene, fades out with the ending.
    const ambience = useTransform(progress, [0, MAIN_END * 0.4, 0.86, 0.99], [0, 0.8, 0.8, 0]);

    // Backdrop picture: fades up out of the dark and slowly settles (zoom out + drift).
    // Scale always stays ahead of the drift, so the edges never show.
    const bgOpacity = useTransform(main, [0, 0.3], [0, 1]);
    const bgScale = useTransform(main, [0, 0.6], [1.2, 1.06]);
    const bgY = useTransform(main, [0, 0.6], ["-4%", "0%"]);

    const flight = useTransform(main, [0.06, 0.58], [0, 1]);

    // Contact message: in with the build-up, out when the ending starts.
    const textIn = MAIN_END * 0.5;
    const textFull = MAIN_END * 0.72;
    const textOpacity = useTransform(progress, [textIn, textFull, 0.76, 0.82], [0, 1, 1, 0]);
    const textY = useTransform(progress, [textIn, textFull], [40, 0]);
    const textFilter = useTransform(
        progress,
        [textIn, textFull, 0.76, 0.82],
        ["blur(10px)", "blur(0px)", "blur(0px)", "blur(8px)"],
    );
    const barOpacity = useTransform(progress, [MAIN_END * 0.68, MAIN_END * 0.85, 0.76, 0.82], [0, 1, 1, 0]);

    // The movie ending: the scene dims, "Thank you" fades in, then black bars close from top and bottom.
    const dimOpacity = useTransform(progress, [0.78, 0.9], [0, 0.55]);
    const thanksOpacity = useTransform(progress, [0.8, 0.87, 0.93, 0.97], [0, 1, 1, 0]);
    const thanksY = useTransform(progress, [0.8, 0.87], [24, 0]);
    const thanksFilter = useTransform(progress, [0.8, 0.87], ["blur(10px)", "blur(0px)"]);
    const thanksSpacing = useTransform(progress, [0.8, 0.95], ["0.34em", "0.1em"]);
    const barHeight = useTransform(progress, [0.86, 0.97], ["0%", "50.5%"], { ease: easeInOut });
    // The last sliver of light: a thin line where the bars meet, which shrinks away and goes out.
    const lineOpacity = useTransform(progress, [0.95, 0.97, 0.995, 1], [0, 1, 1, 0]);
    const lineScale = useTransform(progress, [0.97, 0.995], [1, 0]);

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
        <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(to_bottom,#080a1e,#1c1450_55%,#3a1b5e)]">
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

            {/* Animations (all switched off for reduced motion) */}
            <style>{`
        @keyframes footer-twinkle { 0%,100% { opacity: .25 } 50% { opacity: 1 } }
        @keyframes footer-rain { from { background-position: 0 0 } to { background-position: 0 var(--tile) } }
        @keyframes footer-flash-a {
          0%, 84%, 100% { opacity: 0 }
          85% { opacity: .95 } 86% { opacity: .2 } 87.5% { opacity: 1 } 90% { opacity: .3 } 94% { opacity: 0 }
        }
        @keyframes footer-flash-b {
          0%, 60%, 100% { opacity: 0 }
          61% { opacity: .6 } 62.5% { opacity: .1 } 64% { opacity: .75 } 68% { opacity: 0 }
        }
        .footer-stars { animation: footer-twinkle 4s ease-in-out infinite }
        .footer-rain { animation: footer-rain var(--dur) linear infinite }
        .footer-flash-a { animation: footer-flash-a 7s linear infinite }
        .footer-flash-b { animation: footer-flash-b 11s linear infinite }
        @media (prefers-reduced-motion: reduce) {
          .footer-stars, .footer-rain, .footer-flash-a, .footer-flash-b { animation: none }
          .footer-flash-a, .footer-flash-b { opacity: 0 }
        }
      `}</style>

            {/* A few stars, only in the clear blue patch at the top left */}
            <Depth mx={mx} my={my} dx={-6} dy={-4} className="pointer-events-none absolute inset-0">
                <motion.svg
                    aria-hidden="true"
                    viewBox={`0 0 ${STAR_W} ${STAR_H}`}
                    preserveAspectRatio="xMidYMin slice"
                    className="absolute inset-0 h-full w-full"
                    style={{
                        opacity: starsOpacity,
                        maskImage: "radial-gradient(ellipse 34% 30% at 14% 14%, black 30%, transparent 100%)",
                        WebkitMaskImage: "radial-gradient(ellipse 34% 30% at 14% 14%, black 30%, transparent 100%)",
                    }}
                >
                    {[0, 1, 2].map((g) => (
                        <g
                            key={g}
                            className="footer-stars"
                            style={{ animationDelay: `${g * 1.3}s`, animationDuration: `${3.5 + g}s` }}
                        >
                            {STARS.filter((s) => s.g === g).map((s, i) => (
                                <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#dfe6ff" fillOpacity={s.o} />
                            ))}
                        </g>
                    ))}
                </motion.svg>
            </Depth>

            {/* Magenta storm haze at the horizon, matching the glow in the photo */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[75%] bg-[radial-gradient(ellipse_at_62%_100%,rgba(236,100,190,0.30),rgba(130,80,230,0.12)_45%,transparent_70%)]"
                style={{ opacity: glowOpacity }}
            />

            {/* Storm glow: a soft pink-violet light behind the bolt */}
            <Depth mx={mx} my={my} dx={-10} dy={-6} className="pointer-events-none absolute inset-0">
                <motion.div
                    aria-hidden="true"
                    className="absolute aspect-square w-[clamp(220px,34vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,160,225,0.38),rgba(190,110,255,0.18)_40%,transparent_70%)] blur-2xl"
                    style={{
                        left: `${BOLT.x}%`,
                        top: `${BOLT.y}%`,
                        y: stormY,
                        opacity: stormOpacity,
                        scale: stormScale,
                    }}
                />
            </Depth>

            {/* Moon: sits in the clear blue gap in the clouds at the top left, so the storm doesn't hide it */}
            <Depth mx={mx} my={my} dx={-10} dy={-6} className="pointer-events-none absolute inset-0">
                <motion.div
                    aria-hidden="true"
                    className="absolute left-[15%] top-[13%] aspect-square w-[clamp(80px,9vw,160px)] rounded-full bg-[radial-gradient(circle_at_35%_30%,#fbfcff,#dfe4f7_55%,#aeb4d6)] shadow-[0_0_70px_18px_rgba(150,180,255,0.3),0_0_200px_60px_rgba(110,130,240,0.2)]"
                    style={{ y: moonY, opacity: moonOpacity, scale: moonScale }}
                >
                    <span className="absolute left-[58%] top-[22%] h-[16%] w-[16%] rounded-full bg-indigo-950/10" />
                    <span className="absolute left-[24%] top-[52%] h-[22%] w-[22%] rounded-full bg-indigo-950/10" />
                    <span className="absolute left-[62%] top-[62%] h-[10%] w-[10%] rounded-full bg-indigo-950/10" />
                </motion.div>
            </Depth>

            {/* Lightning flashes: two overlays flicker out of step with each other */}
            <div
                aria-hidden="true"
                className="footer-flash-a pointer-events-none absolute inset-0 mix-blend-screen"
                style={{
                    opacity: 0,
                    background: `radial-gradient(ellipse 60% 55% at ${BOLT.x}% ${BOLT.y}%, rgba(255,150,220,0.55), rgba(150,100,255,0.2) 45%, transparent 72%)`,
                }}
            />
            <div
                aria-hidden="true"
                className="footer-flash-b pointer-events-none absolute inset-0 mix-blend-screen"
                style={{
                    opacity: 0,
                    background:
                        "radial-gradient(ellipse 50% 45% at 30% 30%, rgba(120,150,255,0.4), rgba(110,90,230,0.12) 50%, transparent 75%)",
                }}
            />

            {/* Drifting mist: violet and blue, like the fog in the photo */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute left-[-10%] top-[42%] h-[24lvh] w-[80%] bg-[radial-gradient(ellipse_at_center,rgba(200,120,230,0.2),transparent_70%)] blur-xl"
                style={{ x: mistX }}
            />
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute right-[-10%] top-[54%] h-[22lvh] w-[70%] bg-[radial-gradient(ellipse_at_center,rgba(110,130,230,0.18),transparent_70%)] blur-xl"
                style={{ x: mistXReverse }}
            />

            {/* Mountains, far to near, each rising at its own speed */}
            {RIDGES.slice(0, 2).map((cfg, i) => (
                <Ridge key={cfg.seed} cfg={cfg} progress={main} mx={mx} my={my} index={i} />
            ))}

            {/* Pink haze sitting between the far and near land */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-[8%] h-[26lvh] bg-[linear-gradient(to_top,transparent,rgba(190,100,200,0.18)_50%,transparent)] blur-md"
                style={{ opacity: horizonMist }}
            />

            {RIDGES.slice(2).map((cfg, i) => (
                <Ridge key={cfg.seed} cfg={cfg} progress={main} mx={mx} my={my} index={i + 2} />
            ))}

            {/* Tree line, back then front */}
            <Trees d={TREES_BACK} fill="#0a0920" progress={main} mx={mx} my={my} dx={18} rise="40%" height="h-[30lvh]" />
            <Trees d={TREES_FRONT} fill="#04040d" progress={main} mx={mx} my={my} dx={30} rise="60%" height="h-[34lvh]" />

            {/* Darken the bottom so the text stays readable over the land */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#04040c]/90 via-[#04040c]/45 to-transparent"
            />

            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <ToothlessModel mode="flyby" flight={flight} src="/paralax2/toothless.glb" />
            </div>

            {/* Seam with the section above */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#080a1e] to-transparent"
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
                    <h2 className="max-w-4xl text-[clamp(2.25rem,5vw,5.5rem)] font-light leading-[1.06] tracking-tight text-white [text-shadow:0_1px_28px_rgba(0,0,0,0.55)]">
                        {COPY.headline[0]}
                        <span className="block text-white/55">{COPY.headline[1]}</span>
                    </h2>

                    <p className="mt-6 max-w-md text-base leading-relaxed text-white/75 xl:max-w-lg xl:text-lg">
                        {COPY.body}
                    </p>

                    <a
                        href={`mailto:${COPY.email}`}
                        tabIndex={shown ? 0 : -1}
                        className="mt-8 inline-block break-all border-b border-white/30 pb-1 text-[clamp(1.25rem,2.6vw,2.5rem)] font-light tracking-tight text-white transition-colors hover:border-pink-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
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

            <Lightning visibility={ambience} volume={0.7} muted={false} />
            <Rain visibility={ambience} volume={0.1} intensity={0.5} muted={false} />

            {/* ── Movie ending ── */}

            {/* Scene dims as the ending starts */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[40] bg-[#02020a]"
                style={{ opacity: dimOpacity }}
            />

            {/* Thank-you card */}
            <motion.div
                className="pointer-events-none absolute inset-0 z-[45] flex flex-col items-center justify-center px-6 text-center"
                style={{ opacity: thanksOpacity, y: thanksY, filter: thanksFilter }}
                aria-hidden={!ending}
            >
                <motion.p
                    className="text-[clamp(2.25rem,7vw,6.5rem)] font-extralight uppercase leading-none text-white [text-shadow:0_0_40px_rgba(200,150,255,0.35)]"
                    style={{ letterSpacing: thanksSpacing }}
                >
                    {COPY.thanks.title}
                </motion.p>
                <p className="mt-6 text-base font-light text-white/70 md:text-xl">{COPY.thanks.subtitle}</p>
                <p className="mt-10 text-xs uppercase tracking-[0.5em] text-white/40">{COPY.thanks.credit}</p>
            </motion.div>

            {/* Black bars close from the top and the bottom */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 z-[60] bg-black"
                style={{ height: barHeight }}
            />
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[60] bg-black"
                style={{ height: barHeight }}
            />

            {/* Last sliver of light where the bars meet, then it shrinks and goes out */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-1/2 z-[61] h-px -translate-y-1/2 bg-white shadow-[0_0_14px_2px_rgba(210,190,255,0.8)]"
                style={{ opacity: lineOpacity, scaleX: lineScale }}
            />
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

/** Reduced motion: the finished scene with the contact message, with no scroll effects and no closing sequence. */
const StaticEnding = () => {
    const done = useMotionValue(0.7);
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