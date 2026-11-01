import type { MotionValue } from "motion";
import { useTransform } from "motion/react";

export const useSlot = (p: MotionValue<number>, i: number, n: number) => {
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