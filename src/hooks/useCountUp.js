import { useEffect, useRef, useState } from "react";

const easeOut = (t) => 1 - (1 - t) ** 3;

/**
 * Animate a number from 0 up to `target`, calling `onTick` on each visible step
 * (used to fire the coin SE while the daily report tallies up).
 * With `enabled: false` the final value is returned immediately.
 */
export function useCountUp(target, { duration = 900, enabled = true, onTick } = {}) {
  const [progress, setProgress] = useState(0);
  const tickRef = useRef(onTick);

  useEffect(() => {
    tickRef.current = onTick;
  });

  useEffect(() => {
    if (!enabled || target <= 0) return undefined;
    let frame = 0;
    let lastBucket = -1;
    const start = performance.now();

    const step = (now) => {
      const ratio = Math.min(1, (now - start) / duration);
      setProgress(ratio);
      const bucket = Math.floor(ratio * 8);
      if (bucket !== lastBucket && ratio < 1) {
        lastBucket = bucket;
        tickRef.current?.();
      }
      if (ratio < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, enabled]);

  if (!enabled || target <= 0) return target;
  return Math.round(target * easeOut(progress));
}
