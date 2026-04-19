/**
 * Global effect bus — a singleton that lets voice commands trigger synchronized
 * visual effects across the UI (arc reactor, full-screen overlays, etc.).
 *
 * Two data paths:
 *  - `effectState` — continuous 0..1 values updated per animation frame.
 *    Components can read these inside `useFrame` / render without triggering
 *    React re-renders. Used by the Arc Reactor to drive surge intensity.
 *  - `onEffect(cb)` — pub/sub for one-shot triggers. Good for mounting
 *    full-screen overlays that play a CSS animation and then unmount.
 */

export type EffectName = "surge" | "scan" | "alert" | "stealth" | "doomsday" | "suitup";

export type EffectPayload = {
  name: EffectName;
  /** Peak intensity (0..1). Default 1. */
  peak?: number;
  /** How long the effect runs from start to zero (ms). Default varies per effect. */
  durationMs?: number;
  /** Optional label shown by the overlay (e.g. "RUNNING DIAGNOSTIC"). */
  label?: string;
};

/** Continuous per-effect intensity (0..1), readable from any render loop. */
export const effectState: Record<EffectName, number> = {
  surge: 0,
  scan: 0,
  alert: 0,
  stealth: 0,
  doomsday: 0,
  suitup: 0,
};

type Listener = (e: EffectPayload) => void;
const listeners = new Set<Listener>();

export function onEffect(cb: Listener) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const DEFAULT_DURATION: Record<EffectName, number> = {
  surge: 1600,
  scan: 1800,
  alert: 1800,
  stealth: 1400,
  doomsday: 12000, // 10s countdown + 2s outro
  suitup: 6200, // scan → assemble → lock → launch
};

/** Trigger an effect. Ramps `effectState[name]` up sharply, then decays to zero. */
export function triggerEffect(payload: EffectPayload) {
  const { name } = payload;
  const peak = payload.peak ?? 1;
  const duration = payload.durationMs ?? DEFAULT_DURATION[name];

  if (typeof window === "undefined") return;

  const start = performance.now();
  // Ramp phase (first 12%), decay phase (rest)
  const rampFrac = 0.12;
  const ramp = duration * rampFrac;
  const decay = duration - ramp;

  const tick = (now: number) => {
    const elapsed = now - start;
    if (elapsed >= duration) {
      effectState[name] = 0;
      return;
    }
    const v =
      elapsed < ramp
        ? peak * (elapsed / ramp)
        : peak * (1 - (elapsed - ramp) / decay);
    effectState[name] = Math.max(effectState[name], v);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // Notify overlay subscribers so they can play their one-shot animations
  listeners.forEach((l) => l({ ...payload, peak, durationMs: duration }));
}
