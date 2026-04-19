/**
 * Minimal Web Audio helper scoped to the boot sequence.
 * Must be unlocked from a user gesture (browsers block autoplay).
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

/* ----- Speaking-state broadcast (so UI can react when JARVIS talks) ----- */

const speakingListeners = new Set<(v: boolean) => void>();

export function onSpeakingChange(cb: (v: boolean) => void) {
  speakingListeners.add(cb);
  return () => {
    speakingListeners.delete(cb);
  };
}

function setSpeaking(v: boolean) {
  speakingListeners.forEach((cb) => cb(v));
}

export function unlock() {
  if (ctx) return ctx;
  const AC =
    typeof window !== "undefined"
      ? window.AudioContext || (window as any).webkitAudioContext
      : null;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);
  return ctx;
}

export function isUnlocked() {
  return !!ctx;
}

export function beep(opts?: { pitch?: number; vol?: number }) {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.value = 1400 * (opts?.pitch ?? 1);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.09 * (opts?.vol ?? 1), t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + 0.12);
}

export function engageSweep() {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(320, t);
  osc.frequency.exponentialRampToValueAtTime(1400, t + 0.55);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 900;
  filter.Q.value = 6;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + 0.7);
}

/* ----- Klaxon alarm for doomsday sequence ------------------- */

let klaxonCtx: AudioContext | null = null;
let klaxonOsc: OscillatorNode | null = null;
let klaxonInterval: ReturnType<typeof setInterval> | null = null;
let klaxonGain: GainNode | null = null;

export function startKlaxon() {
  if (klaxonCtx) return;
  if (typeof window === "undefined") return;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  try {
    klaxonCtx = new AC();
    klaxonGain = klaxonCtx.createGain();
    klaxonGain.gain.value = 0;
    klaxonGain.gain.linearRampToValueAtTime(0.22, klaxonCtx.currentTime + 0.15);
    klaxonGain.connect(klaxonCtx.destination);

    const filter = klaxonCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 700;
    filter.Q.value = 1.4;
    filter.connect(klaxonGain);

    const osc = klaxonCtx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 620;
    osc.connect(filter);
    osc.start();
    klaxonOsc = osc;

    // Alternate the two-tone siren
    let high = true;
    klaxonInterval = setInterval(() => {
      if (!klaxonCtx || !klaxonOsc) return;
      const now = klaxonCtx.currentTime;
      klaxonOsc.frequency.exponentialRampToValueAtTime(high ? 340 : 620, now + 0.09);
      high = !high;
    }, 450);
  } catch {
    stopKlaxon();
  }
}

export function stopKlaxon() {
  if (klaxonInterval) {
    clearInterval(klaxonInterval);
    klaxonInterval = null;
  }
  const g = klaxonGain;
  const c = klaxonCtx;
  const o = klaxonOsc;
  if (g && c) {
    try {
      const now = c.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(0, now + 0.35);
    } catch {}
  }
  setTimeout(() => {
    try {
      o?.stop();
      o?.disconnect();
      g?.disconnect();
      c?.close();
    } catch {}
  }, 450);
  klaxonOsc = null;
  klaxonGain = null;
  klaxonCtx = null;
}

export function welcomeSwell() {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  // Warm triad that swells in — feels "JARVIS wakes up"
  const freqs = [261.63, 392.0, 523.25]; // C4, G4, C5
  freqs.forEach((f, i) => {
    const osc = ctx!.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    const gain = ctx!.createGain();
    gain.gain.setValueAtTime(0, t + i * 0.05);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.25 + i * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    osc.connect(gain);
    gain.connect(master!);
    osc.start(t + i * 0.05);
    osc.stop(t + 1.7);
  });
}

/** Speak a line using the browser TTS — picks a British voice if available for JARVIS vibe. */
export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => /en-GB/i.test(v.lang) && /male|daniel|oliver|arthur/i.test(v.name)) ||
      voices.find((v) => /en-GB/i.test(v.lang)) ||
      voices.find((v) => /daniel/i.test(v.name)) ||
      voices.find((v) => v.default);
    if (preferred) u.voice = preferred;
    u.rate = 0.92;
    u.pitch = 0.85;
    u.volume = 0.9;

    // Safety timeout — Chrome occasionally fires onstart but never onend, which
    // would leave the mic paused forever. Estimate duration from word count,
    // then force-clear speaking state a bit later as a backstop.
    const words = text.split(/\s+/).length;
    const estMs = Math.max(1500, (words / (150 / 60 / 0.92)) * 1000); // ~150 wpm @ rate 0.92
    const safety = estMs + 2000;
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;
    const clearSafety = () => {
      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
    };

    u.onstart = () => {
      setSpeaking(true);
      safetyTimer = setTimeout(() => {
        setSpeaking(false);
      }, safety);
    };
    u.onend = () => {
      clearSafety();
      setSpeaking(false);
    };
    u.onerror = () => {
      clearSafety();
      setSpeaking(false);
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    setSpeaking(false);
  }
}
