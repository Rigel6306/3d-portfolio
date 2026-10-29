"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion, type MotionValue } from "motion/react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface RainProps {
  /** 0..1. Rain (and its sound) fade with it and fully pause at ~0. */
  visibility: MotionValue<number>;
  /** 0..1 density of the downpour. */
  intensity?: number;
  /** Wind lean in radians. Positive leans the rain to the right as it falls. */
  wind?: number;
  /** Where the ground is, as a fraction of the height (splashes land here). */
  groundLine?: number;
  /** Rain sound volume, 0..1. */
  volume?: number;
  /** Silence the rain sound without touching the visuals. */
  muted?: boolean;
}

/** One depth layer of individually simulated drops. */
interface Band {
  share: number; // share of all drops
  width: number; // px at 1080p
  len: [number, number]; // px at 1080p (motion-blur streak length)
  speed: [number, number]; // px/s at 1080p
  alpha: number;
  depth: number; // 0 = far, 1 = near (drives landing height + splash size)
  splash: boolean;
}

interface Drop {
  x: number;
  y: number;
  len: number;
  vy: number;
  ground: number;
  band: number;
  tier: 0 | 1; // dim / bright, so the drops aren't all identical
  ph: number; // sway phase
}

interface Bit {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
}

/** Crown splash: droplets thrown up and back down. */
interface Splash {
  age: number; // 0..1
  life: number; // seconds
  a: number;
  bits: Bit[];
}

/** Expanding ring on the wet ground. */
interface Ripple {
  x: number;
  y: number;
  age: number; // 0..1
  life: number;
  r: number;
  a: number;
}

interface SheetCfg {
  tile: number; // css px
  speed: number; // px/s at 1080p
  alpha: number;
  count: number;
  len: [number, number];
  width: [number, number];
  a: [number, number];
}

/* -------------------------------------------------------------------------- */
/*  Tuning                                                                    */
/* -------------------------------------------------------------------------- */

/** Public path of the rain loop: put the file in `public/sounds/rain.mp3`. */
const RAIN_SOUND = "/sounds/rain.mp3";

/**
 * Rain is transparent, so it shows as a LIGHT streak against dark sky but as a
 * DARKER streak against bright clouds. Every drop is therefore drawn twice: a
 * slate-blue shadow underneath and a pale highlight on top. That keeps it
 * clearly visible over the white clouds as well as the dark ones.
 */
const RAIN: [number, number, number] = [228, 236, 250]; // highlight
const RAIN_DARK: [number, number, number] = [56, 70, 94]; // shadow / contrast edge

/** Heavy rain greys the whole scene. Raise to darken more, 0 to disable. */
const HAZE: [number, number, number] = [50, 62, 84];
const HAZE_ALPHA = 0.2;

const BANDS: Band[] = [
  { share: 0.34, width: 0.8, len: [14, 26], speed: [1100, 1300], alpha: 0.3, depth: 0.2, splash: true },
  { share: 0.4, width: 1.2, len: [26, 46], speed: [1650, 1950], alpha: 0.42, depth: 0.5, splash: true },
  { share: 0.22, width: 1.8, len: [46, 80], speed: [2350, 2750], alpha: 0.55, depth: 0.8, splash: true },
  // out-of-focus streaks right in front of the "camera"
  { share: 0.04, width: 3.4, len: [110, 190], speed: [3100, 3800], alpha: 0.13, depth: 1, splash: false },
];

/**
 * Each drop is stroked three times (long faint tail, medium body, short bright
 * head). The overlap makes a tapered streak: bright at the head, fading to
 * nothing behind it, like real motion blur, without a gradient per drop.
 */
const STAGE_FRAC = [1, 0.55, 0.2]; // how much of the streak each stroke covers
const STAGE_ALPHA = [0.3, 0.35, 0.45];
const TIER_ALPHA = [0.65, 1.25];

/**
 * Pre-rendered "curtains" of very fine rain that scroll past. They supply the
 * dense, hazy sheet of rain you see in real storms that individual drops
 * can't without thousands of particles.
 */
const SHEETS: SheetCfg[] = [
  { tile: 512, speed: 900, alpha: 0.75, count: 900, len: [12, 26], width: [0.5, 0.9], a: [0.1, 0.34] },
  { tile: 640, speed: 1450, alpha: 0.8, count: 560, len: [24, 46], width: [0.7, 1.2], a: [0.14, 0.38] },
  { tile: 768, speed: 1900, alpha: 0.7, count: 240, len: [40, 76], width: [1, 1.7], a: [0.16, 0.4] },
];

/** [colour, width multiplier, alpha multiplier]: shadow first, highlight on top. */
const SHEET_PASSES: [[number, number, number], number, number][] = [
  [RAIN_DARK, 1.8, 0.75],
  [RAIN, 1, 1],
];

const MAX_SPLASHES = 90;
const MAX_RIPPLES = 60;
const GRAVITY = 900; // px/s^2 for splash droplets at 1080p

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rgba = (c: [number, number, number], a: number) =>
  `rgba(${c[0]},${c[1]},${c[2]},${clamp(a, 0, 1).toFixed(3)})`;

/** Slow, layered sine "noise": the wind swells and eases instead of sitting still. */
const gust = (t: number) =>
  0.05 * Math.sin(t * 0.0004) +
  0.035 * Math.sin(t * 0.0013 + 1.7) +
  0.03 * Math.sin(t * 0.0031 + 4);

/** Soft blob for ground mist. */
const makeMistSprite = () => {
  const s = document.createElement("canvas");
  s.width = s.height = 128;
  const g = s.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(190,205,225,0.9)");
  grad.addColorStop(0.5, "rgba(190,205,225,0.35)");
  grad.addColorStop(1, "rgba(190,205,225,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return s;
};

/** One seamless tile of fine streaks (wraps top <-> bottom so it can scroll). */
const makeSheet = (cfg: SheetCfg, dpr: number) => {
  const T = cfg.tile;
  const c = document.createElement("canvas");
  c.width = c.height = Math.round(T * dpr);
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  g.lineCap = "round";

  for (let i = 0; i < cfg.count; i++) {
    const x = rand(0, T);
    const y = rand(0, T);
    const len = rand(cfg.len[0], cfg.len[1]);
    const a = rand(cfg.a[0], cfg.a[1]);
    const wd = rand(cfg.width[0], cfg.width[1]);
    const draw = (yy: number) => {
      for (const [col, wMul, aMul] of SHEET_PASSES) {
        const grad = g.createLinearGradient(x, yy, x, yy + len);
        grad.addColorStop(0, rgba(col, 0));
        grad.addColorStop(1, rgba(col, a * aMul));
        g.strokeStyle = grad;
        g.lineWidth = wd * wMul;
        g.beginPath();
        g.moveTo(x, yy);
        g.lineTo(x, yy + len);
        g.stroke();
      }
    };
    draw(y);
    if (y + len > T) draw(y - T); // wrap
  }
  return c;
};

/* -------------------------------------------------------------------------- */
/*  Rain sound                                                                */
/* -------------------------------------------------------------------------- */

const CURVE = 64;
const FADE_IN = new Float32Array(CURVE).map((_, i) => Math.sin((i / (CURVE - 1)) * Math.PI * 0.5));
const FADE_OUT = new Float32Array(CURVE).map((_, i) => Math.cos((i / (CURVE - 1)) * Math.PI * 0.5));

/**
 * Seamless rain bed. MP3s have a tiny gap at the loop point, so instead of
 * `loop = true` the file is played as overlapping copies with an equal-power
 * crossfade. It follows the storm: quieter as the clouds fade, silent when the
 * hero is scrolled away, and the audio engine sleeps when nothing is audible.
 */
const createRainSound = (getLevel: () => number) => {
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;

  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  let buffer: AudioBuffer | null = null;
  let xfade = 2.5;
  let nextAt = 0;
  let started = false;
  let disposed = false;
  let gestureOk = false;
  let lastVis = 0;
  let suspendTimer = 0;

  fetch(RAIN_SOUND)
    .then((r) => r.arrayBuffer())
    .then((d) => ctx.decodeAudioData(d))
    .then((b) => {
      if (disposed) return;
      buffer = b;
      xfade = Math.min(2.5, b.duration / 3);
    })
    .catch(() => {
      /* missing file: the rain stays silent but the visuals still run */
    });

  const layer = (at: number) => {
    if (!buffer) return;
    const dur = buffer.duration;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.setValueCurveAtTime(FADE_IN, at, xfade);
    g.gain.setValueAtTime(1, at + xfade);
    g.gain.setValueCurveAtTime(FADE_OUT, at + dur - xfade, xfade);
    src.connect(g);
    g.connect(master);
    src.onended = () => {
      src.disconnect();
      g.disconnect();
    };
    src.start(at);
    src.stop(at + dur + 0.1);
    nextAt = at + dur - xfade;
  };

  const tick = () => {
    if (!buffer || ctx.state !== "running") return;
    if (!started) {
      started = true;
      nextAt = ctx.currentTime + 0.05;
    }
    while (nextAt < ctx.currentTime + 4) layer(nextAt);
  };
  const timer = window.setInterval(tick, 500);

  /** Re-evaluate level + whether the audio engine should be awake. */
  const apply = (vis: number) => {
    lastVis = vis;
    const level = getLevel() * Math.pow(clamp(vis, 0, 1), 1.5);
    master.gain.setTargetAtTime(level, ctx.currentTime, 0.35);

    const shouldRun = gestureOk && !document.hidden && level > 0.002;
    window.clearTimeout(suspendTimer);
    if (shouldRun) {
      if (ctx.state === "suspended") void ctx.resume();
    } else if (gestureOk && ctx.state === "running") {
      suspendTimer = window.setTimeout(() => {
        if (disposed) return;
        void ctx.suspend().catch(() => {});
      }, 1500);
    }
  };

  // Browsers block audio until the visitor interacts with the page.
  const gestures = ["pointerdown", "pointerup", "keydown", "touchend", "click"];
  const unlock = () => {
    if (gestureOk) return;
    gestureOk = true;
    gestures.forEach((g) => window.removeEventListener(g, unlock));
    apply(lastVis);
  };
  gestures.forEach((g) => window.addEventListener(g, unlock, { passive: true }));
  const onHidden = () => apply(lastVis);
  document.addEventListener("visibilitychange", onHidden);

  const dispose = () => {
    disposed = true;
    window.clearInterval(timer);
    window.clearTimeout(suspendTimer);
    gestures.forEach((g) => window.removeEventListener(g, unlock));
    document.removeEventListener("visibilitychange", onHidden);
    void ctx.close().catch(() => {});
  };

  return { apply, dispose };
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

const Rain = ({
  visibility,
  intensity = 1,
  wind = 0.22,
  groundLine = 0.8,
  volume = 0.5,
  muted = false,
}: RainProps) => {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ---------------------------- sound ---------------------------- */

  const levelRef = useRef(0);
  const soundRef = useRef<ReturnType<typeof createRainSound>>(null);

  // Louder when the downpour is heavier, but never silent at light intensity.
  useEffect(() => {
    levelRef.current = muted ? 0 : clamp(volume, 0, 1) * (0.55 + 0.45 * clamp(intensity, 0, 1));
    soundRef.current?.apply(visibility.get());
  }, [volume, muted, intensity, visibility]);

  useEffect(() => {
    if (reduceMotion) return;
    const sound = createRainSound(() => levelRef.current);
    soundRef.current = sound;
    sound?.apply(visibility.get());
    const unsub = visibility.on("change", (v) => sound?.apply(v));
    return () => {
      unsub();
      sound?.dispose();
      soundRef.current = null;
    };
  }, [reduceMotion, visibility]);

  /* --------------------------- visuals --------------------------- */

  useEffect(() => {
    if (reduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let sc = 1; // scales speeds/lengths so rain looks the same on any screen
    let slope = Math.tan(wind);
    let raf = 0;
    let last = 0;
    let bands: Drop[][] = BANDS.map(() => []);
    let sheets: HTMLCanvasElement[] = [];
    const splashes: Splash[] = [];
    const ripples: Ripple[] = [];

    const mistSprite = makeMistSprite();
    const mist = Array.from({ length: 5 }, () => ({
      x: Math.random(),
      y: rand(0.62, 0.95),
      r: rand(0.25, 0.5),
      s: rand(0.4, 1),
      a: rand(0.04, 0.09),
    }));

    /** (Re)place a drop at the top (or anywhere, on first build). */
    const place = (d: Drop, initial: boolean) => {
      const b = BANDS[d.band]!;
      d.len = rand(b.len[0], b.len[1]) * sc;
      d.vy = rand(b.speed[0], b.speed[1]) * sc;
      d.tier = Math.random() < 0.45 ? 1 : 0;
      d.ground = b.splash
        ? h * (groundLine + (b.depth - 0.5) * 0.14) + rand(-0.025, 0.025) * h
        : h + d.len * 2;
      // widen the spawn range so slanted rain still covers the whole screen
      const lean = -slope * h;
      d.x = rand(Math.min(0, lean), w + Math.max(0, lean));
      d.y = initial ? rand(-d.len, d.ground) : -d.len - rand(0, 40 * sc);
    };

    const build = () => {
      const area = (w * h) / (1920 * 1080);
      const total = Math.round(clamp(1100 * area, 360, 1800) * clamp(intensity, 0, 1));
      bands = BANDS.map((b, bi) => {
        const n = Math.round(total * b.share);
        return Array.from({ length: n }, () => {
          const d: Drop = { x: 0, y: 0, len: 0, vy: 0, ground: 0, band: bi, tier: 0, ph: rand(0, 6.28) };
          place(d, true);
          return d;
        });
      });
      sheets = SHEETS.map((s) => makeSheet(s, dpr));
      splashes.length = 0;
      ripples.length = 0;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      sc = clamp(h / 1080, 0.6, 1.6);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      build();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /** A drop hit the ground: crown of droplets, plus a ring that spreads. */
    const impact = (d: Drop) => {
      const b = BANDS[d.band]!;
      if (splashes.length < MAX_SPLASHES && Math.random() < 0.55) {
        const n = 3 + Math.floor(b.depth * 3);
        splashes.push({
          age: 0,
          life: rand(0.3, 0.5),
          a: 0.5 + b.depth * 0.5,
          bits: Array.from({ length: n }, () => ({
            x: d.x,
            y: d.ground,
            px: d.x,
            py: d.ground,
            vx: rand(-70, 70) * sc,
            vy: -rand(90, 210) * sc * (0.6 + b.depth * 0.6),
          })),
        });
      }
      if (b.depth >= 0.5 && ripples.length < MAX_RIPPLES && Math.random() < 0.5) {
        ripples.push({
          x: d.x,
          y: d.ground,
          age: 0,
          life: rand(0.9, 1.4),
          r: (6 + b.depth * 14) * sc,
          a: 0.5 + b.depth * 0.5,
        });
      }
    };

    const frame = (now: number) => {
      const vis = visibility.get();
      if (vis <= 0.01) {
        // Fully hidden: clear and stop. The change listener restarts us.
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        raf = 0;
        last = 0;
        return;
      }

      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      const dens = clamp(intensity, 0, 1);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Wind: base lean plus slow gusts. Everything shares the same direction.
      slope = Math.tan(wind + gust(now));
      const norm = Math.hypot(slope, 1);
      const ux = slope / norm;
      const uy = 1 / norm;

      /* 0. Heavy-rain haze: greys and darkens the scene so bright clouds
            stop washing the rain out */
      const hz = vis * (0.4 + 0.6 * dens) * HAZE_ALPHA;
      const hg = ctx.createLinearGradient(0, 0, 0, h);
      hg.addColorStop(0, rgba(HAZE, hz));
      hg.addColorStop(1, rgba(HAZE, hz * 0.5));
      ctx.fillStyle = hg;
      ctx.fillRect(0, 0, w, h);

      /* 1. Ground mist drifting with the wind, behind the rain */
      const dir = wind >= 0 ? 1 : -1;
      for (const m of mist) {
        const px = ((((m.x + now * 0.000004 * m.s * dir) % 1.4) + 1.4) % 1.4) - 0.2;
        const size = m.r * Math.max(w, h) * 2;
        ctx.globalAlpha = m.a * vis;
        ctx.drawImage(mistSprite, px * w - size / 2, m.y * h - size / 2, size, size * 0.6);
      }

      /* 2. Fine rain curtains: sheared so they lean with the wind */
      ctx.setTransform(dpr, 0, slope * dpr, dpr, 0, 0);
      for (let i = 0; i < SHEETS.length; i++) {
        const cfg = SHEETS[i]!;
        const tile = sheets[i];
        if (!tile) continue;
        const T = cfg.tile;
        const oy = (now * 0.001 * cfg.speed * sc) % T;
        const x0 = Math.floor(Math.min(0, -slope * h) / T) * T - T;
        const x1 = w + Math.max(0, -slope * h) + T;
        ctx.globalAlpha = cfg.alpha * vis * (0.35 + 0.65 * dens);
        for (let tx = x0; tx < x1; tx += T) {
          for (let ty = -T + oy; ty < h; ty += T) ctx.drawImage(tile, tx, ty, T, T);
        }
      }
      ctx.globalAlpha = 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      /* 3. Individual drops: tapered streaks, batched per depth band */
      ctx.lineCap = "round";
      for (let bi = 0; bi < BANDS.length; bi++) {
        const b = BANDS[bi]!;
        const list = bands[bi]!;
        // [tier][stage] paths so each style is stroked once
        const paths = [
          [new Path2D(), new Path2D(), new Path2D()],
          [new Path2D(), new Path2D(), new Path2D()],
        ];

        for (const d of list) {
          d.x += d.vy * slope * dt + Math.sin(now * 0.003 + d.ph) * 6 * sc * dt; // tiny turbulence
          d.y += d.vy * dt;
          if (d.y >= d.ground) {
            if (b.splash) impact(d);
            place(d, false);
            continue;
          }
          const row = paths[d.tier]!;
          for (let k = 0; k < 3; k++) {
            const f = d.len * STAGE_FRAC[k]!;
            const p = row[k]!;
            p.moveTo(d.x - ux * f, d.y - uy * f);
            p.lineTo(d.x, d.y);
          }
        }

        const wsc = Math.max(0.8, sc);
        // shadow underlay first (wider, slate blue) so the drop reads on white
        // clouds, then the pale highlight on top so it reads on dark sky
        for (const [col, wMul, aMul] of [
          [RAIN_DARK, 1.9, 0.8],
          [RAIN, 1, 1.25],
        ] as const) {
          for (let t = 0; t < 2; t++) {
            for (let k = 0; k < 3; k++) {
              ctx.lineWidth = b.width * wsc * wMul * (1 + 0.12 * k); // head is slightly fatter
              ctx.strokeStyle = rgba(col, b.alpha * aMul * vis * TIER_ALPHA[t]! * STAGE_ALPHA[k]!);
              ctx.stroke(paths[t]![k]!);
            }
          }
        }
      }

      /* 4. Ground ripples */
      ctx.lineWidth = 0.8;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]!;
        r.age += dt / r.life;
        if (r.age >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        const fade = Math.pow(1 - r.age, 1.5);
        ctx.strokeStyle = rgba(RAIN, fade * 0.38 * r.a * vis);
        const rr = r.r * (0.3 + r.age * 1.7);
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, rr, rr * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (r.age > 0.2) {
          ctx.beginPath(); // a second, smaller ring trailing the first
          ctx.ellipse(r.x, r.y, rr * 0.6, rr * 0.6 * 0.28, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      /* 5. Splash droplets: short motion trails along their arc */
      ctx.lineWidth = 1;
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i]!;
        s.age += dt / s.life;
        if (s.age >= 1) {
          splashes.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = rgba(RAIN, (1 - s.age) * 0.75 * s.a * vis);
        ctx.beginPath();
        for (const bit of s.bits) {
          bit.px = bit.x;
          bit.py = bit.y;
          bit.x += bit.vx * dt;
          bit.y += bit.vy * dt;
          bit.vy += GRAVITY * sc * dt;
          ctx.moveTo(bit.px, bit.py);
          ctx.lineTo(bit.x, bit.y);
        }
        ctx.stroke();
      }

      raf = requestAnimationFrame(frame);
    };

    // Start, and restart whenever the clouds come back into view.
    raf = requestAnimationFrame(frame);
    const unsub = visibility.on("change", (v) => {
      if (v > 0.01 && !raf) raf = requestAnimationFrame(frame);
    });

    return () => {
      unsub();
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reduceMotion, visibility, intensity, wind, groundLine]);

  if (reduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-32 h-full w-full"
    />
  );
};

export default Rain;