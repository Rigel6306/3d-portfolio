"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion, type MotionValue } from "motion/react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type Point = [number, number];
type RGB = [number, number, number];

/**
 * ground  - classic cloud-to-ground bolt (stepped leader, return stroke
 *           climbing from the ground, dart-leader restrikes, ribboning)
 * crawler - horizontal cloud-to-cloud / intra-cloud discharge that propagates
 *           both ways from an initiation point; sometimes drops a leg down
 * sheet   - no visible channel at all: the bolt is hidden inside the clouds
 *           and only the sky flickers
 */
type Kind = "ground" | "crawler" | "sheet";

interface Palette {
  outer: RGB; // wide atmospheric halo
  mid: RGB; // ionised air around the channelcd bento-g
  inner: RGB; // hot plasma
  flash: RGB; // sky illumination
  cloud: RGB; // light scattered inside the clouds
}

/** One continuous channel: the main bolt, a branch, or a sub-branch. */
interface Poly {
  pts: Point[];
  cum: number[]; // cumulative length at each point
  total: number;
  width: number; // relative thickness
  depth: number; // 0 = main, 1 = branch, 2 = sub-branch
  t0: number; // ms after strike birth when the leader reaches the start
  dur: number; // ms the leader takes to travel this channel
  gain: number; // brightness multiplier
  rootFrac: number; // where along the main channel this limb forks off (0..1)
  taper: number; // how much the channel thins toward its tip (0..1)
}

/** A return stroke: fast attack, exponential decay. */
interface Pulse {
  at: number;
  amp: number;
  decay: number;
}

interface Cloud {
  x: number;
  y: number;
  r: number;
  k: number;
  f: number;
  ph: number;
}

interface Strike {
  kind: Kind;
  born: number;
  polys: Poly[];
  pulses: Pulse[];
  clouds: Cloud[];
  cx: number; // centre of the sky illumination
  cy: number;
  spread: number; // radius of the sky bloom relative to max(w, h)
  end: Point | null; // ground / drop attachment point
  impact: number; // strength of the attachment glow
  rs: number; // ms when the first return stroke / main flash hits
  lead: number; // brightness of the faint leader before that
  afterglow: number; // lingering glow of the ionised channel
  attack: number; // ms of rise time for each pulse (bigger = softer)
  front: boolean; // return stroke climbs the channel from the ground
  ribbon: number; // px the channel shifts between restrikes (wind)
  duration: number;
}

interface LightningProps {
  visibility: MotionValue<number>;
  interval?: [number, number];
  /** Master thunder volume, 0..1. */
  volume?: number;
  /** Silence the thunder without touching the visuals. */
  muted?: boolean;
}

interface BranchCfg {
  c1: number; // fork chance per point (depth 1)
  m1: number; // max branches (depth 1)
  c2: number; // fork chance per point (depth 2)
  m2: number; // max sub-branches
  up: number; // chance a branch heads upward
  drop: number; // chance a branch hangs straight down like a tendril
  angle: [number, number]; // fork angle range (radians)
  len: [number, number]; // length range as a fraction of height
  low: boolean; // favour forks toward the bottom of the channel
}

/* -------------------------------------------------------------------------- */
/*  Tuning                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Real lightning photographs as a blown-out white core wrapped in a pale
 * blue-violet glow (plasma at ~30,000 K emits broadband light, the cool tint
 * comes from nitrogen/oxygen emission lines and Rayleigh scattering).
 */
const PALETTE: Palette = {
  outer: [92, 118, 245],
  mid: [150, 178, 255],
  inner: [222, 233, 255],
  flash: [105, 172, 255], // fixed typo: was 1050
  cloud: [108, 128, 232],
};
const CORE: RGB = [250, 252, 255];

/** Layered strokes, widest -> thinnest. Widths in CSS px for the main channel. */
const PASSES: { w: number; a: number; c: "outer" | "mid" | "inner" | "core" }[] = [
  { w: 34, a: 0.035, c: "outer" },
  { w: 16, a: 0.085, c: "outer" },
  { w: 7, a: 0.17, c: "mid" },
  { w: 3, a: 0.5, c: "inner" },
  { w: 1.3, a: 1, c: "core" },
];

const FRONT_MS = 55; // time for the return stroke to climb the whole channel

const GROUND_BRANCH: BranchCfg = {
  c1: 0.055,
  m1: 8,
  c2: 0.03,
  m2: 2,
  up: 0,
  drop: 0,
  angle: [0.35, 1.0],
  len: [0.05, 0.2],
  low: true,
};

const CRAWLER_BRANCH: BranchCfg = {
  c1: 0.07,
  m1: 11,
  c2: 0.035,
  m2: 3,
  up: 0.25,
  drop: 0.35,
  angle: [0.3, 1.1],
  len: [0.04, 0.16],
  low: false,
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const rgba = (c: RGB, a: number) =>
  `rgba(${c[0]},${c[1]},${c[2]},${clamp01(a).toFixed(3)})`;
const colorOf = (c: "outer" | "mid" | "inner" | "core"): RGB =>
  c === "core" ? CORE : PALETTE[c];

const pickKind = (): Kind => {
  const r = Math.random() * 100;
  if (r < 40) return "ground";
  if (r < 68) return "crawler";
  return "sheet";
};

/** Midpoint displacement perpendicular to the segment -> natural kinks. */
const jag = (a: Point, b: Point, disp: number, minLen: number, out: Point[]) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len < minLen) {
    out.push(a);
    return;
  }
  const nx = -dy / len;
  const ny = dx / len;
  let o = rand(-disp, disp);
  if (Math.random() < 0.12) o *= 1.8; // the occasional sharp, angular kink
  const mid: Point = [(a[0] + b[0]) / 2 + nx * o, (a[1] + b[1]) / 2 + ny * o];
  jag(a, mid, disp * 0.55, minLen, out);
  jag(mid, b, disp * 0.55, minLen, out);
};

const channel = (a: Point, b: Point, disp: number, minLen: number): Point[] => {
  const out: Point[] = [];
  jag(a, b, disp, minLen, out);
  out.push(b);
  return out;
};

const makePoly = (
  pts: Point[],
  width: number,
  depth: number,
  t0: number,
  dur: number,
  gain: number,
  rootFrac = 0,
  taper = 0.5
): Poly => {
  const cum = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
    cum.push(total);
  }
  return { pts, cum, total, width, depth, t0, dur, gain, rootFrac, taper };
};

/** Soft radial sprite used for bloom stamps. Cached per colour. */
const sprites = new Map<string, HTMLCanvasElement>();
const spriteFor = (c: RGB): HTMLCanvasElement => {
  const key = c.join(",");
  const cached = sprites.get(key);
  if (cached) return cached;
  const s = document.createElement("canvas");
  s.width = s.height = 128;
  const g = s.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,0.6)");
  grad.addColorStop(0.15, rgba(c, 0.5));
  grad.addColorStop(0.5, rgba(c, 0.13));
  grad.addColorStop(1, rgba(c, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  sprites.set(key, s);
  return s;
};

/* -------------------------------------------------------------------------- */
/*  Strike construction                                                       */
/* -------------------------------------------------------------------------- */

/** Recursively fork limbs off a channel. Branches inherit timing from the parent. */
const spawnBranches = (
  polys: Poly[],
  parent: Poly,
  depth: number,
  cfg: BranchCfg,
  h: number,
  rs: number
) => {
  const chance = depth === 1 ? cfg.c1 : cfg.c2;
  const maxBranches = depth === 1 ? cfg.m1 : cfg.m2;
  let count = 0;

  for (let i = 5; i < parent.pts.length - 5 && count < maxBranches; i++) {
    const frac = parent.cum[i]! / parent.total;
    const p = chance * (cfg.low ? 0.5 + frac : 1);
    if (Math.random() > p) continue;

    const a = parent.pts[i - 1]!;
    const b = parent.pts[i + 1]!;
    const from = parent.pts[i]!;
    const heading = Math.atan2(b[0] - a[0], b[1] - a[1]); // angle from "down"
    const hangs = Math.random() < cfg.drop;
    const theta = hangs
      ? rand(-0.35, 0.35)
      : heading + (Math.random() < 0.5 ? -1 : 1) * rand(cfg.angle[0], cfg.angle[1]);
    const len = (h * rand(cfg.len[0], cfg.len[1])) / depth;
    const up = !hangs && Math.random() < cfg.up ? -1 : 1;
    const to: Point = [
      from[0] + Math.sin(theta) * len,
      from[1] + up * Math.abs(Math.cos(theta)) * len,
    ];

    const t0 = parent.t0 + frac * parent.dur;
    const dur = Math.max(24, Math.min(35 + len * 0.12, rs - t0));
    const branch = makePoly(
      channel(from, to, len * 0.22, 5),
      depth === 1 ? 0.55 : 0.32,
      depth,
      t0,
      dur,
      depth === 1 ? 0.8 : 0.6,
      depth === 1 ? frac : parent.rootFrac,
      0.85 // limbs thin out to hair-fine tips
    );
    polys.push(branch);
    count++;
    if (depth < 2) spawnBranches(polys, branch, depth + 1, cfg, h, rs);
  }
};

const buildGround = (w: number, h: number, now: number): Strike => {
  const lead = rand(130, 190);
  const rs = lead + 35;
  const x0 = rand(0.12, 0.88) * w;
  const start: Point = [x0, -20];
  const end: Point = [x0 + rand(-0.16, 0.16) * w, h * rand(0.72, 0.95)];
  const mainLen = Math.hypot(end[0] - start[0], end[1] - start[1]);

  const main = makePoly(channel(start, end, mainLen * 0.15, 6), 1, 0, 0, lead, 1, 0, 0.5);
  const polys: Poly[] = [main];
  spawnBranches(polys, main, 1, GROUND_BRANCH, h, rs);

  // One big return stroke, then weaker dart-leader restrikes (the "flicker").
  const pulses: Pulse[] = [{ at: rs, amp: 1, decay: 70 }];
  let t = rs + rand(60, 110);
  const restrikes = Math.floor(rand(2, 5));
  for (let i = 0; i < restrikes; i++) {
    pulses.push({ at: t, amp: rand(0.45, 0.95), decay: rand(35, 75) });
    t += rand(45, 130);
  }

  const clouds: Cloud[] = Array.from({ length: 5 }, () => ({
    x: x0 + rand(-0.25, 0.25) * w,
    y: rand(0, 0.25) * h,
    r: rand(0.18, 0.4) * Math.max(w, h),
    k: rand(0.4, 1),
    f: rand(0.02, 0.05),
    ph: rand(0, Math.PI * 2),
  }));

  return {
    kind: "ground",
    born: now,
    polys,
    pulses,
    clouds,
    cx: x0,
    cy: h * 0.08,
    spread: 0.95,
    end,
    impact: 1,
    rs,
    lead: 0.28,
    afterglow: 0.2,
    attack: 4,
    front: true,
    ribbon: (Math.random() < 0.5 ? -1 : 1) * rand(2, 6),
    duration: t + 450,
  };
};

const buildCrawler = (w: number, h: number, now: number): Strike => {
  const lead = rand(110, 200);
  const rs = lead + 30;
  const dir = Math.random() < 0.5 ? -1 : 1;
  const x0 = rand(0.15, 0.85) * w;
  const y0 = h * rand(0.04, 0.3);
  const start: Point = [x0, y0];

  const lenA = w * rand(0.25, 0.6);
  const lenB = w * rand(0.08, 0.3);
  const clampX = (x: number) => Math.max(-30, Math.min(w + 30, x));
  const endA: Point = [clampX(x0 + dir * lenA), y0 + h * rand(-0.04, 0.1)];
  const endB: Point = [clampX(x0 - dir * lenB), y0 + h * rand(-0.05, 0.06)];

  // Intra-cloud leaders grow in both directions from the initiation point.
  const A = makePoly(channel(start, endA, lenA * 0.1, 6), 1, 0, 0, lead, 1, 0, 0.45);
  const B = makePoly(
    channel(start, endB, lenB * 0.12, 5),
    0.85,
    0,
    0,
    lead * rand(0.5, 0.9),
    0.9,
    0,
    0.45
  );
  const polys: Poly[] = [A, B];
  spawnBranches(polys, A, 1, CRAWLER_BRANCH, h, rs);
  spawnBranches(polys, B, 1, CRAWLER_BRANCH, h, rs);

  // Sometimes the discharge drops a long leg out of the cloud base.
  let end: Point | null = null;
  if (Math.random() < 0.3) {
    const i = Math.floor(A.pts.length * rand(0.3, 0.8));
    const from = A.pts[i]!;
    const frac = A.cum[i]! / A.total;
    const to: Point = [from[0] + rand(-0.08, 0.08) * w, h * rand(0.4, 0.75)];
    const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const t0 = A.t0 + frac * A.dur;
    const leg = makePoly(
      channel(from, to, len * 0.15, 6),
      0.8,
      1,
      t0,
      Math.max(30, Math.min(rand(60, 100), rs - t0)),
      0.9,
      frac,
      0.6
    );
    polys.push(leg);
    spawnBranches(polys, leg, 2, GROUND_BRANCH, h, rs);
    end = to;
  }

  // Intra-cloud flashes shimmer: a run of softer, closely spaced pulses.
  const pulses: Pulse[] = [{ at: rs, amp: 0.85, decay: 55 }];
  let t = rs + rand(35, 90);
  const flickers = Math.floor(rand(3, 8));
  for (let i = 0; i < flickers; i++) {
    pulses.push({ at: t, amp: rand(0.3, 0.8), decay: rand(30, 70) });
    t += rand(35, 110);
  }

  const lo = Math.min(x0, endB[0], endA[0]);
  const hi = Math.max(x0, endB[0], endA[0]);
  const clouds: Cloud[] = Array.from({ length: 6 }, () => ({
    x: rand(lo, hi),
    y: y0 + rand(-0.05, 0.1) * h,
    r: rand(0.14, 0.32) * Math.max(w, h),
    k: rand(0.4, 1),
    f: rand(0.02, 0.05),
    ph: rand(0, Math.PI * 2),
  }));

  return {
    kind: "crawler",
    born: now,
    polys,
    pulses,
    clouds,
    cx: (lo + hi) / 2,
    cy: y0,
    spread: 0.75,
    end,
    impact: 0.5,
    rs,
    lead: 0.3,
    afterglow: 0.22,
    attack: 6,
    front: false,
    ribbon: 0,
    duration: t + 450,
  };
};

/** Bolt hidden inside the clouds: only the sky lights up, irregularly. */
const buildSheet = (w: number, h: number, now: number): Strike => {
  const cx = rand(0.1, 0.9) * w;
  const cy = h * rand(0.03, 0.35);

  const pulses: Pulse[] = [];
  let t = 0;
  const n = Math.floor(rand(2, 6));
  for (let i = 0; i < n; i++) {
    pulses.push({
      at: t,
      amp: rand(0.3, 0.75) * (i === 0 ? 1.15 : 1),
      decay: rand(45, 110),
    });
    t += rand(50, 170);
  }

  const clouds: Cloud[] = Array.from({ length: 6 }, () => ({
    x: cx + rand(-0.35, 0.35) * w,
    y: cy + rand(-0.1, 0.15) * h,
    r: rand(0.2, 0.5) * Math.max(w, h),
    k: rand(0.4, 1),
    f: rand(0.02, 0.05),
    ph: rand(0, Math.PI * 2),
  }));

  return {
    kind: "sheet",
    born: now,
    polys: [],
    pulses,
    clouds,
    cx,
    cy,
    spread: 0.7,
    end: null,
    impact: 0,
    rs: 0,
    lead: 0,
    afterglow: 0.08,
    attack: 14,
    front: false,
    ribbon: 0,
    duration: t + 500,
  };
};

const buildStrike = (kind: Kind, w: number, h: number, now: number): Strike =>
  kind === "ground"
    ? buildGround(w, h, now)
    : kind === "crawler"
      ? buildCrawler(w, h, now)
      : buildSheet(w, h, now);

const intensityAt = (s: Strike, t: number) => {
  if (t < s.rs) return s.lead; // faint leader
  let v = 0;
  for (const p of s.pulses) {
    const d = t - p.at;
    if (d >= 0) v += p.amp * Math.exp(-d / p.decay) * Math.min(1, d / s.attack + 0.15);
  }
  // continuing current / afterglow of the ionised channel
  v += s.afterglow * Math.exp(-(t - s.rs) / 280);
  return Math.min(1.4, v);
};

/* -------------------------------------------------------------------------- */
/*  Drawing                                                                   */
/* -------------------------------------------------------------------------- */

const visibleOf = (poly: Poly, p: number, jitter: number): Point[] => {
  const target = poly.total * p;
  const out: Point[] = [];
  for (let i = 0; i < poly.pts.length; i++) {
    const pt = poly.pts[i]!;
    const c = poly.cum[i]!;
    if (c <= target) {
      out.push(
        i === 0
          ? pt
          : [pt[0] + rand(-jitter, jitter), pt[1] + rand(-jitter, jitter)]
      );
    } else {
      const prev = poly.pts[i - 1]!;
      const pc = poly.cum[i - 1]!;
      const f = (target - pc) / (c - pc || 1);
      out.push([prev[0] + (pt[0] - prev[0]) * f, prev[1] + (pt[1] - prev[1]) * f]);
      break;
    }
  }
  return out;
};

/** Stroke a polyline in chunks so the width tapers toward the tip. */
const strokeTapered = (
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  baseW: number,
  style: string,
  taper = 0.5
) => {
  const CH = 6;
  const last = pts.length - 1;
  if (last < 1) return;
  ctx.strokeStyle = style;
  for (let i = 0; i < last; i += CH) {
    const end = Math.min(i + CH, last);
    ctx.lineWidth = Math.max(0.5, baseW * (1 - taper * (i / last)));
    ctx.beginPath();
    ctx.moveTo(pts[i]![0], pts[i]![1]);
    for (let k = i + 1; k <= end; k++) ctx.lineTo(pts[k]![0], pts[k]![1]);
    ctx.stroke();
  }
};

const stamp = (
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  x: number,
  y: number,
  r: number,
  alpha: number
) => {
  ctx.globalAlpha = clamp01(alpha);
  ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
};

/**
 * @param I current flash intensity
 * @param L intensity of the faint pre-stroke leader glow
 */
const drawBolt = (
  ctx: CanvasRenderingContext2D,
  s: Strike,
  I: number,
  L: number,
  t: number
) => {
  const sprite = spriteFor(PALETTE.outer);
  const post = t - s.rs;
  // Ground strokes: the return stroke races UP the channel from the ground.
  // Intra-cloud strokes light nearly everything at once.
  const lf = s.front ? clamp01(post / FRONT_MS) : clamp01(post / 14);
  const widthScale = 0.7 + 0.5 * Math.min(I, 1);
  const jitter = 0.4 + Math.min(I, 1.2) * 1.1; // crackle

  // Ribboning: successive strokes drift sideways in the wind.
  let k = -1;
  for (const p of s.pulses) if (t >= p.at) k++;
  const ribbonOff = k > 0 ? Math.max(-14, Math.min(14, s.ribbon * k)) : 0;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const paint = (
    pts: Point[],
    strength: number,
    poly: Poly,
    wScale: number
  ) => {
    if (pts.length < 2 || strength <= 0.002) return;

    // Bloom stamps along the channel
    ctx.globalAlpha = 1;
    const step = poly.depth === 0 ? 5 : 8;
    const base = poly.depth === 0 ? (s.kind === "ground" ? 150 : 110) : 70;
    const r = base * (0.6 + 0.5 * Math.min(I, 1));
    for (let i = 0; i < pts.length; i += step) {
      stamp(ctx, sprite, pts[i]![0], pts[i]![1], r, 0.11 * strength);
    }

    // Subtle chromatic fringe on the main channel (lens dispersion)
    if (poly.depth === 0 && strength > 0.35) {
      ctx.save();
      ctx.translate(1.8, 0);
      strokeTapered(ctx, pts, 11 * wScale, rgba([255, 90, 120], 0.05 * strength), poly.taper);
      ctx.translate(-3.6, 0);
      strokeTapered(ctx, pts, 11 * wScale, rgba([70, 120, 255], 0.07 * strength), poly.taper);
      ctx.restore();
    }

    // Layered core
    ctx.globalAlpha = 1;
    for (const pass of PASSES) {
      strokeTapered(
        ctx,
        pts,
        pass.w * wScale,
        rgba(colorOf(pass.c), pass.a * strength),
        poly.taper
      );
    }
  };

  for (const poly of s.polys) {
    const p = clamp01((t - poly.t0) / poly.dur);
    if (p <= 0) continue;

    const pts = visibleOf(poly, p, jitter);
    if (pts.length < 2) continue;

    const wScale = widthScale * poly.width;
    // Side limbs fade much faster than the main channel.
    const fade =
      poly.depth === 0 || post < 0 ? 1 : 0.3 + 0.7 * Math.exp(-post / (190 / poly.depth));
    const gain = poly.gain * fade;

    // How "lit" this limb is by the return stroke (0 = leader glow only).
    const lit =
      poly.depth === 0 || !s.front
        ? lf
        : clamp01((lf - (1 - poly.rootFrac)) * 6);

    if (poly.depth === 0 && s.front && lf > 0 && lf < 1 && p >= 1) {
      // Front is mid-climb: bright below it, faint leader glow above it.
      const target = poly.total * (1 - lf);
      let idx = poly.cum.findIndex((c) => c >= target);
      if (idx < 1) idx = 1;
      paint(pts.slice(0, idx + 1), L * gain, poly, wScale);
      paint(pts.slice(idx - 1), I * gain, poly, wScale);
    } else {
      paint(pts, (L * (1 - lit) + I * lit) * gain, poly, wScale);
    }

    // Ribbon ghost of the main channel on restrikes
    if (poly.depth === 0 && ribbonOff !== 0 && lit >= 1) {
      ctx.save();
      ctx.translate(ribbonOff, 0);
      ctx.globalAlpha = 1;
      for (const pass of PASSES.slice(2)) {
        strokeTapered(
          ctx,
          pts,
          pass.w * wScale,
          rgba(colorOf(pass.c), pass.a * I * gain * 0.4),
          poly.taper
        );
      }
      ctx.restore();
    }

    // Hot leader tip while still travelling
    if (p < 1) {
      const head = pts[pts.length - 1]!;
      const tipR = poly.depth === 0 ? 40 : 18;
      stamp(
        ctx,
        sprite,
        head[0],
        head[1],
        tipR,
        (poly.depth === 0 ? 0.9 : 0.5) * (0.6 + 0.4 * Math.random())
      );
    }
  }

  // Attachment glow where the channel meets the ground
  if (s.end && t >= s.rs) {
    ctx.globalAlpha = 1;
    stamp(
      ctx,
      sprite,
      s.end[0],
      s.end[1],
      260 * s.impact * (0.5 + 0.5 * Math.min(I, 1)),
      0.7 * I * s.impact
    );
    stamp(ctx, sprite, s.end[0], s.end[1], 80 * s.impact, 0.9 * I * s.impact);
  }
  ctx.globalAlpha = 1;
};

const drawFlash = (
  ctx: CanvasRenderingContext2D,
  s: Strike,
  I: number,
  t: number,
  w: number,
  h: number
) => {
  if (t < s.rs - 40) return;
  const R = Math.max(w, h);
  const sheet = s.kind === "sheet";

  // Ambient wash
  ctx.fillStyle = rgba(PALETTE.flash, (sheet ? 0.05 : 0.07) * I);
  ctx.fillRect(0, 0, w, h);

  // Big sky bloom around the (possibly hidden) discharge
  const rad = R * s.spread;
  const g = ctx.createRadialGradient(s.cx, s.cy, 0, s.cx, s.cy, rad);
  g.addColorStop(0, rgba([235, 242, 255], 0.5 * I));
  g.addColorStop(0.25, rgba(PALETTE.flash, 0.26 * I));
  g.addColorStop(0.6, rgba(PALETTE.cloud, 0.09 * I));
  g.addColorStop(1, rgba(PALETTE.cloud, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Hidden discharge: a tight hot spot glowing through the cloud deck
  if (sheet) {
    const r2 = R * 0.14;
    const hg = ctx.createRadialGradient(s.cx, s.cy, 0, s.cx, s.cy, r2);
    hg.addColorStop(0, rgba(PALETTE.inner, 0.38 * I));
    hg.addColorStop(0.5, rgba(PALETTE.flash, 0.14 * I));
    hg.addColorStop(1, rgba(PALETTE.flash, 0));
    ctx.fillStyle = hg;
    ctx.fillRect(s.cx - r2, s.cy - r2, r2 * 2, r2 * 2);
  }

  // Clouds lit from inside, each flickering on its own phase
  for (const c of s.clouds) {
    const flick = 0.7 + 0.3 * (Math.sin(t * c.f + c.ph) * 0.5 + 0.5);
    const a = 0.45 * I * c.k * flick;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(1, 0.55);
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, c.r);
    cg.addColorStop(0, rgba(PALETTE.inner, a * 0.9));
    cg.addColorStop(0.4, rgba(PALETTE.cloud, a * 0.5));
    cg.addColorStop(1, rgba(PALETTE.cloud, 0));
    ctx.fillStyle = cg;
    ctx.fillRect(-c.r, -c.r, c.r * 2, c.r * 2);
    ctx.restore();
  }
};

/* -------------------------------------------------------------------------- */
/*  Thunder audio                                                             */
/* -------------------------------------------------------------------------- */

/** Put the three files in your Next.js `public/sounds/` folder. */
const SOUND_URLS = {
  heavy: "/sounds/heavyThunder.mp3",
  light: ["/sounds/thunder1.mp3", "/sounds/thunder2.mp3"],
} as const;

/**
 * Sound travels ~1 km per 3 s, so thunder trails the flash. Each kind of
 * strike behaves like it is a different distance away: a ground bolt is close
 * (short delay, loud, full-bandwidth, often the heavy clap), a crawler is
 * further out, and sheet lightning is a distant, muffled rumble.
 *
 * Delays are kept short on purpose: the visual return stroke already lands
 * ~165-220 ms after the strike starts, so anything longer feels detached.
 */
const DISTANCE: Record<
  Kind,
  { delay: [number, number]; gain: number; lowpass: number; heavy: number }
> = {
  ground: { delay: [0.05, 0.25], gain: 1, lowpass: 16000, heavy: 0.45 },
  crawler: { delay: [0.2, 0.6], gain: 0.85, lowpass: 8000, heavy: 0.12 },
  sheet: { delay: [0.5, 1.2], gain: 0.6, lowpass: 3500, heavy: 0 },
};

const MAX_CONCURRENT = 3;

/** Overall loudness boost applied after the per-strike gain. */
const MASTER_BOOST = 2.5;

const createThunder = (getVolume: () => number) => {
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;

  const ctx = new AC();
  const buffers = new Map<string, AudioBuffer>();
  let active = 0;
  let disposed = false;

  // Master chain: boost -> compressor -> speakers. The compressor lets us push
  // the level up without clipping on the loud claps.
  const master = ctx.createGain();
  master.gain.value = MASTER_BOOST;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.knee.value = 12;
  comp.ratio.value = 6;
  comp.attack.value = 0.003;
  comp.release.value = 0.25;
  master.connect(comp);
  comp.connect(ctx.destination);

  // Fetch + decode up front (small files) so the first strike is never late.
  const load = async (url: string) => {
    try {
      const res = await fetch(url);
      const buf = await ctx.decodeAudioData(await res.arrayBuffer());
      if (!disposed) buffers.set(url, buf);
    } catch {
      /* missing file / decode error: that sound is simply skipped */
    }
  };
  [SOUND_URLS.heavy, ...SOUND_URLS.light].forEach(load);

  // Browsers block audio until the visitor interacts with the page, so the
  // context is resumed on the first real gesture. Strikes before that stay
  // silent (never queued) instead of all firing at once later.
  const gestures = ["pointerdown", "pointerup", "keydown", "touchend", "click"];
  const unlock = () => {
    if (ctx.state === "suspended") void ctx.resume();
  };
  const onState = () => {
    if (ctx.state === "running") gestures.forEach((g) => window.removeEventListener(g, unlock));
  };
  gestures.forEach((g) => window.addEventListener(g, unlock, { passive: true }));
  ctx.addEventListener("statechange", onState);

  const play = (kind: Kind, vis: number) => {
    // Try to wake the context on every strike (works if the browser already
    // considers the page "activated"); this strike may still be skipped.
    if (ctx.state !== "running") void ctx.resume();

    const volume = getVolume();
    if (
      disposed ||
      volume <= 0 ||
      ctx.state !== "running" ||
      document.hidden ||
      vis < 0.15 || // hero scrolled away: the flash isn't visible, so no thunder
      active >= MAX_CONCURRENT
    )
      return;

    const cfg = DISTANCE[kind];
    const url =
      Math.random() < cfg.heavy
        ? SOUND_URLS.heavy
        : SOUND_URLS.light[Math.floor(Math.random() * SOUND_URLS.light.length)]!;
    const buf = buffers.get(url);
    if (!buf) return;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rand(0.92, 1.06); // no two claps sound identical

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = cfg.lowpass;

    const gain = ctx.createGain();
    const peak = clamp01(volume) * cfg.gain * rand(0.8, 1) * Math.min(1, vis);
    const at = ctx.currentTime + rand(cfg.delay[0], cfg.delay[1]);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(peak, at + 0.02);

    src.connect(lp);
    lp.connect(gain);
    gain.connect(master);

    active++;
    src.onended = () => {
      active--;
      src.disconnect();
      lp.disconnect();
      gain.disconnect();
    };
    src.start(at);
  };

  const dispose = () => {
    disposed = true;
    gestures.forEach((g) => window.removeEventListener(g, unlock));
    ctx.removeEventListener("statechange", onState);
    master.disconnect();
    comp.disconnect();
    void ctx.close().catch(() => {});
  };

  return { play, dispose };
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

const Lightning = ({
  visibility,
  interval = [1.5, 6.5],
  volume = 0.7,
  muted = false,
}: LightningProps) => {
  const reduceMotion = useReducedMotion();
  // Read inside the effect through a ref so changing volume never restarts
  // the storm.
  const volumeRef = useRef(muted ? 0 : volume);
  useEffect(() => {
    volumeRef.current = muted ? 0 : volume;
  }, [volume, muted]);
  const boltRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduceMotion) return;
    const bolt = boltRef.current;
    const glow = glowRef.current;
    if (!bolt || !glow) return;
    const bctx = bolt.getContext("2d");
    const gctx = glow.getContext("2d");
    if (!bctx || !gctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let timer = 0;
    const extraTimers = new Set<number>();
    let strikes: Strike[] = [];
    const thunder = createThunder(() => volumeRef.current);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = bolt.clientWidth;
      h = bolt.clientHeight;
      for (const c of [bolt, glow]) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(bolt);

    const prep = (ctx: CanvasRenderingContext2D, c: HTMLCanvasElement) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "lighter";
    };

    const loop = (now: number) => {
      prep(bctx, bolt);
      prep(gctx, glow);

      strikes = strikes.filter((s) => now - s.born < s.duration);
      const vis = visibility.get();

      if (vis > 0.01) {
        for (const s of strikes) {
          const t = now - s.born;
          const flick = 0.9 + Math.random() * 0.2; // per-frame plasma flicker
          const I = intensityAt(s, t) * vis * flick;
          const L = s.lead * vis * flick;
          drawFlash(gctx, s, I, t, w, h);
          if (s.polys.length) drawBolt(bctx, s, I, L, t);
        }
      }

      raf = strikes.length ? requestAnimationFrame(loop) : 0;
    };

    const fire = () => {
      if (w === 0 || h === 0) return;
      const strike = buildStrike(pickKind(), w, h, performance.now());
      strikes.push(strike);
      thunder?.play(strike.kind, visibility.get());
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const schedule = (first = false) => {
      const wait = first ? 1200 : rand(interval[0], interval[1]) * 1000;
      timer = window.setTimeout(() => {
        fire();
        // ~1 in 5 strikes is followed by a quick second one
        if (Math.random() < 0.2) {
          const id = window.setTimeout(() => {
            extraTimers.delete(id);
            fire();
          }, rand(80, 220));
          extraTimers.add(id);
        }
        schedule();
      }, wait);
    };

    schedule(true);

    return () => {
      window.clearTimeout(timer);
      extraTimers.forEach((id) => window.clearTimeout(id));
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      thunder?.dispose();
    };
  }, [reduceMotion, interval[0], interval[1], visibility]);

  if (reduceMotion) return null;

  return (
    <>
      {/* Bolt + bloom */}
      <canvas
        ref={boltRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-29 h-full w-full"
      />
      {/* Sky / cloud illumination */}
      <canvas
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-31 h-full w-full mix-blend-screen"
      />
    </>
  );
};

export default Lightning;