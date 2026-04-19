/**
 * Tiny generative music engine — plays a looping sci-fi theme using Web Audio
 * oscillators. No assets, no copyright concerns, graceful fade in/out.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let loopTimer: ReturnType<typeof setTimeout> | null = null;
let activeOsc = new Set<OscillatorNode>();
let playing = false;

const midi2freq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// A minor pentatonic, 8 beats — cinematic arpeggio
// [midi, beatStart, beatLen]
const MELODY: Array<[number, number, number]> = [
  [57, 0, 0.5], // A3
  [64, 0.5, 0.5], // E4
  [69, 1, 0.5], // A4
  [72, 1.5, 0.5], // C5
  [76, 2, 1.0], // E5 held
  [74, 3, 0.5], // D5
  [72, 3.5, 0.5], // C5
  [69, 4, 0.5], // A4
  [64, 4.5, 0.5], // E4
  [67, 5, 0.5], // G4
  [69, 5.5, 0.5], // A4
  [72, 6, 1.0], // C5 held
  [69, 7, 1.0], // A4 tail
];

const BAR_BEATS = 8;
const BPM = 96;

function scheduleNote(midi: number, when: number, dur: number) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = midi2freq(midi);

  // Slight detune for warmth via a second osc
  const osc2 = ctx.createOscillator();
  osc2.type = "sawtooth";
  osc2.frequency.value = midi2freq(midi) * 1.003;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(0.14, when + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2400, when);
  filter.frequency.exponentialRampToValueAtTime(800, when + dur);
  filter.Q.value = 1.2;

  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(g);
  g.connect(master);

  osc.start(when);
  osc2.start(when);
  osc.stop(when + dur + 0.05);
  osc2.stop(when + dur + 0.05);
  activeOsc.add(osc);
  activeOsc.add(osc2);
  const cleanup = () => {
    activeOsc.delete(osc);
    activeOsc.delete(osc2);
  };
  osc.onended = cleanup;
  osc2.onended = cleanup;
}

function scheduleDrone(midi: number, when: number, dur: number) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = midi2freq(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(0.06, when + 0.15);
  g.gain.setValueAtTime(0.06, when + dur - 0.2);
  g.gain.linearRampToValueAtTime(0, when + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(when);
  osc.stop(when + dur + 0.05);
  activeOsc.add(osc);
  osc.onended = () => activeOsc.delete(osc);
}

/** Simple additive kick on each downbeat for groove */
function scheduleKick(when: number) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(140, when);
  osc.frequency.exponentialRampToValueAtTime(45, when + 0.12);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.18, when);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
  osc.connect(g);
  g.connect(master);
  osc.start(when);
  osc.stop(when + 0.25);
  activeOsc.add(osc);
  osc.onended = () => activeOsc.delete(osc);
}

function playBar(startTime: number) {
  if (!playing || !ctx || !master) return;
  const beat = 60 / BPM;
  const bar = BAR_BEATS * beat;

  MELODY.forEach(([midi, s, len]) => scheduleNote(midi, startTime + s * beat, len * beat));
  scheduleDrone(45, startTime, bar); // A2 bass drone
  // Kicks on beats 0, 2, 4, 6
  [0, 2, 4, 6].forEach((b) => scheduleKick(startTime + b * beat));

  // Schedule next bar slightly early so it seams together
  loopTimer = setTimeout(
    () => playBar(startTime + bar),
    Math.max(100, (bar - 0.15) * 1000)
  );
}

export function startTheme(): boolean {
  if (playing) return true;
  if (typeof window === "undefined") return false;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return false;
  try {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    // Fade in
    master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.7);
    playing = true;
    playBar(ctx.currentTime + 0.05);
    return true;
  } catch {
    playing = false;
    return false;
  }
}

export function stopTheme() {
  playing = false;
  if (loopTimer) {
    clearTimeout(loopTimer);
    loopTimer = null;
  }
  if (ctx && master) {
    const now = ctx.currentTime;
    try {
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 0.5);
    } catch {}
  }
  const snapshotCtx = ctx;
  const snapshotOsc = activeOsc;
  setTimeout(() => {
    snapshotOsc.forEach((o) => {
      try {
        o.stop();
        o.disconnect();
      } catch {}
    });
    snapshotOsc.clear();
    if (snapshotCtx && snapshotCtx.state !== "closed") {
      snapshotCtx.close().catch(() => {});
    }
  }, 650);
  ctx = null;
  master = null;
  activeOsc = new Set();
}

export function isThemePlaying() {
  return playing;
}

/** Temporarily lower music volume so JARVIS voice sits clearly on top. */
export function duckTheme(ducked: boolean) {
  if (!ctx || !master) return;
  const now = ctx.currentTime;
  const target = ducked ? 0.14 : 0.55;
  try {
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(target, now + 0.25);
  } catch {}
}
